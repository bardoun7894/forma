import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Verify PayPal webhook signature
async function verifyWebhookSignature(
    req: NextRequest,
    body: string
): Promise<boolean> {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    const baseUrl = process.env.PAYPAL_MODE === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

    // Get access token
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
        console.error('Failed to get access token for webhook verification');
        return false;
    }

    const { access_token } = await tokenResponse.json();

    // Verify the webhook signature
    const verifyResponse = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            auth_algo: req.headers.get('paypal-auth-algo'),
            cert_url: req.headers.get('paypal-cert-url'),
            transmission_id: req.headers.get('paypal-transmission-id'),
            transmission_sig: req.headers.get('paypal-transmission-sig'),
            transmission_time: req.headers.get('paypal-transmission-time'),
            webhook_id: webhookId,
            webhook_event: JSON.parse(body),
        }),
    });

    if (!verifyResponse.ok) {
        console.error('Webhook verification request failed');
        return false;
    }

    const verifyResult = await verifyResponse.json();
    return verifyResult.verification_status === 'SUCCESS';
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();

        // Verify webhook signature (skip in development if webhook ID not set)
        if (process.env.PAYPAL_WEBHOOK_ID) {
            const isValid = await verifyWebhookSignature(req, body);
            if (!isValid) {
                console.error('PayPal webhook signature verification failed');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
            }
        }

        const event = JSON.parse(body);
        const eventType = event.event_type;

        console.log('PayPal webhook event:', eventType);

        switch (eventType) {
            case 'PAYMENT.CAPTURE.COMPLETED': {
                // Payment was captured successfully
                // This is a backup to the redirect capture - usually redirect handles this
                const capture = event.resource;
                console.log('Payment captured via webhook:', capture.id);
                break;
            }

            case 'PAYMENT.CAPTURE.REFUNDED': {
                // Payment was refunded
                const refund = event.resource;
                const captureId = refund.links?.find(
                    (l: { rel: string; href: string }) => l.rel === 'up'
                )?.href?.split('/').pop();

                // Find the payment by capture ID and mark as refunded
                const paymentsSnapshot = await adminDb()
                    .collection('payments')
                    .where('paypalCaptureId', '==', captureId)
                    .limit(1)
                    .get();

                if (!paymentsSnapshot.empty) {
                    const paymentDoc = paymentsSnapshot.docs[0];
                    await paymentDoc.ref.update({
                        status: 'refunded',
                        refundedAt: new Date(),
                        refundId: refund.id,
                    });
                    console.log('Payment marked as refunded:', captureId);
                }
                break;
            }

            case 'PAYMENT.CAPTURE.DENIED':
            case 'PAYMENT.CAPTURE.DECLINED': {
                // Payment was denied/declined
                console.log('Payment denied/declined:', event.resource?.id);
                break;
            }

            default:
                console.log('Unhandled PayPal event type:', eventType);
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('Error processing PayPal webhook:', error);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
}
