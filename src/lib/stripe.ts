import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  // In development, we might want to warn but not crash immediately if not using Stripe yet
  console.warn('STRIPE_SECRET_KEY is missing from environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

