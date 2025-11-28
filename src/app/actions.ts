'use server'

import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

async function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  
  if (host) {
    return `${protocol}://${host}`;
  }
  
  return 'http://localhost:3000';
}

// Mock Auth: In a real app, use Clerk/NextAuth to get the session.
// For now, we'll create a user and return the ID.

export async function registerUser(formData: FormData) {
  console.log('➡️ [registerUser] Starting registration');
  const username = formData.get('username') as string;
  const email = formData.get('email') as string;
  const name = formData.get('name') as string;

  if (!username || !email) {
    console.error('❌ [registerUser] Missing fields');
    throw new Error('Missing fields');
  }

  // Check if user exists
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] }
  });

  if (existing) {
    console.log('✅ [registerUser] User exists:', existing.id);
    // For MVP demo, just return existing ID
    return { success: true, userId: existing.id };
  }

  const user = await prisma.user.create({
    data: {
      username,
      email,
      name,
    }
  });
  console.log('✅ [registerUser] Created new user:', user.id);

  return { success: true, userId: user.id };
}

export async function createStripeAccount(userId: string) {
  console.log('➡️ [createStripeAccount] User:', userId);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.error('❌ [createStripeAccount] User not found');
    throw new Error('User not found');
  }

  if (user.stripeAccountId) {
    console.log('✅ [createStripeAccount] Existing account:', user.stripeAccountId);
    return { accountId: user.stripeAccountId };
  }

  let accountId;
  try {
    console.log('🔄 [createStripeAccount] Creating Stripe Express account...');
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // Default to US for MVP
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;
    console.log('✅ [createStripeAccount] Created account:', accountId);
  } catch (error: any) {
    console.error('❌ [createStripeAccount] Stripe Error:', error.message);
    return { error: error.message };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { stripeAccountId: accountId },
  });

  return { accountId };
}

export async function getStripeOnboardingLink(accountId: string) {
  console.log('➡️ [getStripeOnboardingLink] Account:', accountId);
  const baseUrl = await getBaseUrl();
  
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/dashboard`, // Handle refresh (e.g. link expired)
      return_url: `${baseUrl}/dashboard?connected=true`, // Handle success
      type: 'account_onboarding',
    });
    console.log('✅ [getStripeOnboardingLink] Link created:', accountLink.url);
    return { url: accountLink.url };
  } catch (error: any) {
     console.error('❌ [getStripeOnboardingLink] Error:', error.message);
     return { error: error.message };
  }
}

export async function getUser(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId }
  });
}

export async function getUserByUsername(username: string) {
  return await prisma.user.findUnique({
    where: { username }
  });
}

export async function createCheckoutSession(recipientId: string, amountInCents: number) {
  console.log('➡️ [createCheckoutSession] Recipient:', recipientId, 'Amount:', amountInCents);
  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  
  if (!recipient) {
     console.error('❌ [createCheckoutSession] Recipient not found');
     // Return error object instead of throwing
     return { error: 'Recipient not found' };
  }

  if (!recipient.stripeAccountId) {
    console.error('❌ [createCheckoutSession] Recipient has no stripeAccountId');
    return { error: 'Recipient has not set up payments' };
  }
  
  console.log('ℹ️ [createCheckoutSession] Stripe Account ID:', recipient.stripeAccountId);

  const baseUrl = await getBaseUrl();

  try {
    const sessionParams: any = {
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Tip for ${recipient.name}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/u/${recipient.username}?success=true`,
      cancel_url: `${baseUrl}/u/${recipient.username}`,
    };

    try {
      const session = await stripe.checkout.sessions.create({
        ...sessionParams,
        payment_intent_data: {
          application_fee_amount: Math.round(amountInCents * 0.05), // 5% platform fee
          transfer_data: {
            destination: recipient.stripeAccountId,
          },
        },
      });

      console.log('✅ [createCheckoutSession] Session created:', session.url);
      return { url: session.url };
    } catch (error: any) {
      // If we try to transfer to our own account (Platform account), Stripe throws an error.
      // In this case, we just process it as a direct payment without transfer_data/application_fee.
      if (error.message?.includes("cannot be set to your own account")) {
        console.warn('⚠️ [createCheckoutSession] Destination is platform account. Fallback to direct charge.');
        const session = await stripe.checkout.sessions.create(sessionParams);
        console.log('✅ [createCheckoutSession] Session created (Direct):', session.url);
        return { url: session.url };
      }
      
      throw error;
    }
  } catch (error: any) {
    console.error('❌ [createCheckoutSession] Error:', error.message);
    return { error: `Payment Error: ${error.message}` };
  }
}
