import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Credit pack mapping
const CREDIT_PACKS: Record<string, number> = {
    starter: 100,
    pro: 500,
    enterprise: 1000,
};

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const baseUrl = process.env.PAYPAL_MODE === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
        throw new Error('Failed to get PayPal access token');
    }

    const data = await response.json();
    return data.access_token;
}

// Capture PayPal order after user approval
export async function POST(req: NextRequest) {
    try {
        const { orderId } = await req.json();

        if (!orderId) {
            return NextResponse.json(
                { success: false, error: 'Order ID is required' },
                { status: 400 }
            );
        }

        const accessToken = await getPayPalAccessToken();
        const baseUrl = process.env.PAYPAL_MODE === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';

        // Capture the order
        const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        const captureResult = await response.json();

        if (captureResult.status !== 'COMPLETED') {
            console.error('PayPal capture failed:', captureResult);
            return NextResponse.json(
                { success: false, error: 'Payment capture failed' },
                { status: 400 }
            );
        }

        // Extract data from the captured order
        const purchaseUnit = captureResult.purchase_units?.[0];
        const captureData = purchaseUnit?.payments?.captures?.[0];
        const customId = captureData?.custom_id || purchaseUnit?.custom_id;

        let userId: string | undefined;
        let packId: string | undefined;
        let credits: number | undefined;

        try {
            const customData = JSON.parse(customId);
            userId = customData.userId;
            packId = customData.packId;
            credits = customData.credits;
        } catch {
            // Fallback: try to get from reference_id
            const referenceId = purchaseUnit?.reference_id || '';
            [userId, packId] = referenceId.split('_');
            credits = packId ? CREDIT_PACKS[packId] : undefined;
        }

        if (!userId || !packId || !credits) {
            console.error('Could not extract user data:', { userId, packId, credits });
            return NextResponse.json(
                { success: false, error: 'Invalid order data' },
                { status: 400 }
            );
        }

        // Update user credits in Firestore
        const userRef = adminDb().collection('users').doc(userId);
        const userDoc = await userRef.get();

        const currentCredits = userDoc.exists ? (userDoc.data()?.credits || 0) : 0;
        const newCredits = currentCredits + credits;

        await userRef.set(
            {
                credits: newCredits,
                updatedAt: new Date(),
            },
            { merge: true }
        );

        // Log the transaction
        await userRef.collection('creditTransactions').add({
            amount: credits,
            type: 'purchase',
            paypalOrderId: orderId,
            paypalCaptureId: captureData?.id,
            amountUsd: parseFloat(captureData?.amount?.value || '0'),
            currency: 'USD',
            packId,
            createdAt: new Date(),
        });

        // Create payment record
        await adminDb().collection('payments').add({
            userId,
            amount: parseFloat(captureData?.amount?.value || '0'),
            currency: 'USD',
            credits,
            status: 'completed',
            paypalOrderId: orderId,
            paypalCaptureId: captureData?.id,
            packId,
            createdAt: new Date().toISOString(),
        });

        console.log(`Added ${credits} credits to user ${userId}. New balance: ${newCredits}`);

        return NextResponse.json({
            success: true,
            credits: newCredits,
            added: credits,
        });

    } catch (error) {
        console.error('PayPal capture error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to process payment' },
            { status: 500 }
        );
    }
}
