import { NextRequest, NextResponse } from 'next/server';

// Credit pack definitions with prices in EGP (Egyptian Pounds) - amounts in cents/piasters
const CREDIT_PACKS = {
    starter: { credits: 100, amount: 50000, name: 'Starter Pack' },  // 500 EGP
    pro: { credits: 500, amount: 200000, name: 'Pro Pack' },         // 2000 EGP
    enterprise: { credits: 1000, amount: 350000, name: 'Enterprise Pack' }, // 3500 EGP
};

export async function POST(req: NextRequest) {
    try {
        const { packId, userId, userEmail, userPhone } = await req.json();

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

        // Direct fetch call to Paymob Unified Intention API
        // Docs: https://accept.paymob.com/
        const response = await fetch('https://accept.paymob.com/v1/intention/', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${process.env.PAYMOB_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: pack.amount, // Amount in piasters (cents)
                currency: 'EGP',
                payment_methods: ['card', 'kiosk', 'wallet', 'cash'],
                items: [
                    {
                        name: pack.name,
                        amount: pack.amount,
                        description: `${pack.credits} AI Generation Credits`,
                        quantity: 1,
                    },
                ],
                billing_data: {
                    email: userEmail || 'guest@formai.app',
                    phone_number: userPhone || '+201000000000',
                    first_name: 'FormaAI',
                    last_name: 'Customer',
                    country: 'EGY',
                    city: 'Cairo',
                    street: 'N/A',
                    building: 'N/A',
                    floor: 'N/A',
                    apartment: 'N/A',
                },
                special_reference: `${userId}_${packId}_${Date.now()}`, // Used to identify this transaction
                notification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/paymob`,
                redirection_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment=success`,
                extras: {
                    userId,
                    packId,
                    credits: pack.credits.toString(),
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Paymob API error:', response.status, errorData);
            throw new Error(`Paymob API failed: ${response.statusText}`);
        }

        const paymentIntention = await response.json();

        // The unified response typically contains 'client_url' or 'redirect_url' or keys in 'payment_keys'
        // Adjust based on exact response structure. 
        // For 'intention', it usually returns a client redirection URL or keys.
        // Fallback checks for various response formats.

        // Common Intention API Response keys: next_action: { url: ... } or just url?
        // Let's inspect safety:
        const redirectUrl =
            paymentIntention.next_action?.url ||
            paymentIntention.redirect_url ||
            paymentIntention.url;

        const intentionId = paymentIntention.id;

        return NextResponse.json({
            success: true,
            data: {
                url: redirectUrl,
                intentionId: intentionId,
                raw: paymentIntention // Debugging aid
            }
        });

    } catch (error) {
        console.error('Paymob checkout error:', error);
        return NextResponse.json(
            { success: false, error: { code: 'PAYMOB_ERROR', message: 'Failed to create payment session' } },
            { status: 500 }
        );
    }
}
