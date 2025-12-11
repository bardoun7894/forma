import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { adminDb } from '@/lib/firebase-admin';

// Credit pack mapping
const CREDIT_PACKS: Record<string, number> = {
    starter: 100,
    pro: 500,
    enterprise: 1000,
};

// Paymob HMAC verification
function verifyPaymobHmac(body: Record<string, unknown>, receivedHmac: string): boolean {
    const hmacSecret = process.env.PAYMOB_HMAC_SECRET!;

    // Paymob HMAC calculation based on specific fields
    // Order of fields matters for HMAC calculation
    const hmacFields = [
        'amount_cents',
        'created_at',
        'currency',
        'error_occured',
        'has_parent_transaction',
        'id',
        'integration_id',
        'is_3d_secure',
        'is_auth',
        'is_capture',
        'is_refunded',
        'is_standalone_payment',
        'is_voided',
        'order',
        'owner',
        'pending',
        'source_data.pan',
        'source_data.sub_type',
        'source_data.type',
        'success',
    ];

    const concatenatedString = hmacFields
        .map((field) => {
            const keys = field.split('.');
            let value: unknown = body;
            for (const key of keys) {
                value = (value as Record<string, unknown>)?.[key];
            }
            return value?.toString() || '';
        })
        .join('');

    const calculatedHmac = createHmac('sha512', hmacSecret)
        .update(concatenatedString)
        .digest('hex');

    return calculatedHmac === receivedHmac;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Get HMAC from query params (Paymob sends it as a query param)
        const url = new URL(req.url);
        const receivedHmac = url.searchParams.get('hmac');

        if (!receivedHmac) {
            console.error('No HMAC provided');
            return NextResponse.json({ error: 'No HMAC' }, { status: 400 });
        }

        // Verify HMAC
        const obj = body.obj;
        if (!verifyPaymobHmac(obj, receivedHmac)) {
            console.error('HMAC verification failed');
            return NextResponse.json({ error: 'Invalid HMAC' }, { status: 400 });
        }

        // Check if transaction was successful
        if (!obj.success) {
            console.log('Transaction was not successful:', obj.id);
            return NextResponse.json({ received: true, status: 'failed' });
        }

        // Extract user info from special_reference or extras
        // Special reference format: userId_packId_timestamp
        const specialReference = obj.order?.merchant_order_id || '';
        const [userId, packId] = specialReference.split('_');

        if (!userId || !packId) {
            console.error('Could not extract userId/packId from:', specialReference);
            return NextResponse.json({ error: 'Invalid reference' }, { status: 400 });
        }

        const creditsToAdd = CREDIT_PACKS[packId];
        if (!creditsToAdd) {
            console.error('Unknown pack ID:', packId);
            return NextResponse.json({ error: 'Unknown pack' }, { status: 400 });
        }

        // Update user credits in Firestore
        const userRef = adminDb().collection('users').doc(userId);
        const userDoc = await userRef.get();

        const currentCredits = userDoc.exists ? (userDoc.data()?.credits || 0) : 0;
        const newCredits = currentCredits + creditsToAdd;

        await userRef.set(
            {
                credits: newCredits,
                updatedAt: new Date(),
            },
            { merge: true }
        );

        // Log the transaction
        await userRef.collection('creditTransactions').add({
            amount: creditsToAdd,
            type: 'purchase',
            paymobTransactionId: obj.id,
            paymobOrderId: obj.order?.id,
            amountCents: obj.amount_cents,
            currency: obj.currency,
            packId,
            createdAt: new Date(),
        });

        console.log(`Added ${creditsToAdd} credits to user ${userId}. New balance: ${newCredits}`);

        return NextResponse.json({ received: true, status: 'success' });
    } catch (error) {
        console.error('Error processing Paymob webhook:', error);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
}

// Handle GET request for redirection callback
export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const success = url.searchParams.get('success');

    if (success === 'true') {
        // Transaction was successful via redirect
        return NextResponse.redirect(new URL('/dashboard?payment=success', req.url));
    } else {
        return NextResponse.redirect(new URL('/pricing?payment=failed', req.url));
    }
}
