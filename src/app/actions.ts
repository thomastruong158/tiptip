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
    throw error;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { stripeAccountId: accountId },
  });

  return { accountId };
}

export async function getStripeDashboardLink(accountId: string) {
  console.log('➡️ [getStripeDashboardLink] Account:', accountId);
  try {
    const account = await stripe.accounts.retrieve(accountId);
    if (!account.details_submitted) {
        return { error: 'Account setup incomplete', error_code: 'incomplete_onboarding' };
    }

    const link = await stripe.accounts.createLoginLink(accountId);
    console.log('✅ [getStripeDashboardLink] Link created:', link.url);
    return { url: link.url };
  } catch (error: any) {
    console.error('❌ [getStripeDashboardLink] Error:', error.message);
    if (error.message && error.message.includes('not completed onboarding')) {
        return { error: 'Account setup incomplete', error_code: 'incomplete_onboarding' };
    }
    return { error: error.message };
  }
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
     throw error;
  }
}

export async function getStripeOAuthLink() {
  console.log('➡️ [getStripeOAuthLink] Generating OAuth link');
  const baseUrl = await getBaseUrl();
  
  if (!process.env.STRIPE_CLIENT_ID) {
    console.error('❌ [getStripeOAuthLink] Missing STRIPE_CLIENT_ID');
    return { error: 'Server configuration error: Missing STRIPE_CLIENT_ID' };
  }

  // https://stripe.com/docs/connect/oauth-reference
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.STRIPE_CLIENT_ID,
    scope: 'read_write',
    redirect_uri: `${baseUrl}/dashboard`,
  });

  const url = `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
  console.log('✅ [getStripeOAuthLink] Link generated:', url);
  return { url };
}

export async function connectStripeAccount(code: string, userId: string) {
  console.log('➡️ [connectStripeAccount] Connecting account with code for user:', userId);
  
  try {
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    });

    const stripeAccountId = response.stripe_user_id;
    console.log('✅ [connectStripeAccount] Connected account ID:', stripeAccountId);

    await prisma.user.update({
      where: { id: userId },
      data: { stripeAccountId },
    });

    return { success: true, accountId: stripeAccountId };
  } catch (error: any) {
    console.error('❌ [connectStripeAccount] Error:', error.message);
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
          // For Standard accounts, you don't strictly need application_fee_amount if you just want to transfer
          // But if you do charge a fee, the account must have the 'card_payments' capability enabled
          application_fee_amount: Math.round(amountInCents * 0.05), // 5% platform fee
          transfer_data: {
            destination: recipient.stripeAccountId,
          },
        },
      });

      console.log('✅ [createCheckoutSession] Session created:', session.url);
      return { url: session.url };
    } catch (error: any) {
      // Handle "missing capabilities" specifically
      if (error.message?.includes("missing the required capabilities")) {
         console.warn('⚠️ [createCheckoutSession] Target account missing capabilities. Fallback to direct charge (no fee).');
         
         // Fallback: Create session WITHOUT transfer_data/application_fee (money goes to Platform, you pay them manually later)
         // OR handle it gracefully. For now, we'll try to let the platform take the money to avoid crashing.
         const session = await stripe.checkout.sessions.create(sessionParams);
         return { url: session.url };
      }
      
      // If we try to transfer to our own account (Platform account)
      if (error.message?.includes("cannot be set to your own account")) {
        console.warn('⚠️ [createCheckoutSession] Destination is platform account. Fallback to direct charge.');
        const session = await stripe.checkout.sessions.create(sessionParams);
        return { url: session.url };
      }
      
      throw error;
    }
  } catch (error: any) {
    console.error('❌ [createCheckoutSession] Error:', error.message);
    return { error: `Payment Error: ${error.message}` };
  }
}
