import { NextRequest, NextResponse } from 'next/server';

// Credit pack definitions with prices in USD
export const CREDIT_PACKS = {
    starter: { credits: 100, amount: 9.99, name: 'Starter Pack' },
    pro: { credits: 500, amount: 39.99, name: 'Pro Pack' },
    enterprise: { credits: 1000, amount: 69.99, name: 'Enterprise Pack' },
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

// Create PayPal order for JavaScript SDK
export async function POST(req: NextRequest) {
    try {
        const { packId, userId } = await req.json();

        if (!packId || !userId) {
            return NextResponse.json(
                { success: false, error: { code: 'MISSING_PARAMS', message: 'Pack ID and User ID are required' } },
                { status: 400 }
            );
        }

        const pack = CREDIT_PACKS[packId as keyof typeof CREDIT_PACKS];
        if (!pack) {
            return NextResponse.json(
                { success: false, error: { code: 'INVALID_PACK', message: 'Invalid credit pack' } },
                { status: 400 }
            );
        }

        const accessToken = await getPayPalAccessToken();
        const baseUrl = process.env.PAYPAL_MODE === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';

        // Create PayPal order (for SDK flow - no redirect URLs needed)
        const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        reference_id: `${userId}_${packId}_${Date.now()}`,
                        description: `${pack.name} - ${pack.credits} AI Generation Credits`,
                        custom_id: JSON.stringify({ userId, packId, credits: pack.credits }),
                        amount: {
                            currency_code: 'USD',
                            value: pack.amount.toFixed(2),
                        },
                    },
                ],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('PayPal API error:', response.status, errorData);
            throw new Error(`PayPal API failed: ${response.statusText}`);
        }

        const order = await response.json();

        // Return just the order ID for the SDK to use
        return NextResponse.json({
            success: true,
            orderId: order.id,
        });

    } catch (error) {
        console.error('PayPal order creation error:', error);
        return NextResponse.json(
            { success: false, error: { code: 'PAYPAL_ERROR', message: 'Failed to create order' } },
            { status: 500 }
        );
    }
}
