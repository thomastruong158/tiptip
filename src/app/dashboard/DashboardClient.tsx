'use client';

import { useState, useRef } from 'react';
import { createStripeAccount, getStripeOnboardingLink } from '@/app/actions';
import Link from 'next/link';
import { QRCodeCanvas } from 'qrcode.react';

export default function DashboardClient({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const qrRef = useRef<HTMLCanvasElement>(null);

  async function handleConnect() {
    setLoading(true);
    try {
      // 1. Ensure account exists
      const accountResult = await createStripeAccount(user.id);
      if (accountResult.error) {
        throw new Error(accountResult.error);
      }
      const accountId = accountResult.accountId;

      if (!accountId) {
         throw new Error('Failed to create account ID');
      }
      
      // 2. Get link
      const linkResult = await getStripeOnboardingLink(accountId);
      if (linkResult.error) {
        throw new Error(linkResult.error);
      }
      const link = linkResult.url;

      if (!link) {
        throw new Error('Failed to get onboarding link');
      }
      
      // 3. Redirect
      window.location.href = link;
    } catch (error) {
      console.error(error);
      alert('Failed to connect Stripe: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setLoading(false);
    }
  }

  const downloadQRCode = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `tiptip-${user.username}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fallback if env not set, though it should be for production
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? '';
  const profilePath = `/u/${user.username}`;
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${profilePath}` : `${baseUrl}${profilePath}`;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="text-sm text-gray-500">Welcome, {user.name}</div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Status Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4">Payment Status</h2>
            {user.stripeAccountId ? (
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-4">
                  ● Connected to Stripe
                </div>
                <p className="text-gray-600 mb-4">You are ready to receive payouts.</p>
                <button className="text-blue-600 font-medium hover:underline">View Stripe Dashboard</button>
              </div>
            ) : (
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium mb-4">
                  ● Setup Required
                </div>
                <p className="text-gray-600 mb-6">Connect your bank account to start receiving tips.</p>
                <button 
                  onClick={handleConnect}
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Redirecting...' : 'Connect Bank via Stripe'}
                </button>
              </div>
            )}
          </div>

          {/* Profile Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4">Your Tip Page</h2>
            {user.stripeAccountId ? (
              <div>
                <div className="mb-4 p-4 bg-gray-50 rounded-lg break-all font-mono text-sm">
                  {fullUrl}
                </div>
                
                {/* Hidden QR Code for generation */}
                <div className="hidden">
                  <QRCodeCanvas 
                    ref={qrRef}
                    value={fullUrl}
                    size={512}
                    level={"H"}
                    includeMargin={true}
                  />
                </div>

                <div className="flex gap-2">
                  <Link 
                    href={profilePath}
                    target="_blank"
                    className="flex-1 py-2 text-center border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
                  >
                    View Page
                  </Link>
                  <button 
                    className="flex-1 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
                    onClick={downloadQRCode}
                  >
                    Download QR
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-center">
                Complete setup to get your page link
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

