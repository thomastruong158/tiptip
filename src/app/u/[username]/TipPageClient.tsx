'use client';

import { useState } from 'react';
import { createCheckoutSession } from '@/app/actions';
import { useSearchParams } from 'next/navigation';

export default function TipPageClient({ user }: { user: any }) {
  const [amount, setAmount] = useState(5); // Default $5
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const success = searchParams.get('success');

  async function handlePay() {
    setLoading(true);
    try {
      const finalAmount = customAmount ? parseFloat(customAmount) : amount;
      if (!finalAmount || finalAmount <= 0) return;
      
      const cents = Math.round(finalAmount * 100);
      const result = await createCheckoutSession(user.id, cents);
      
      if (result && result.url) {
        window.location.href = result.url;
      } else if (result && result.error) {
         console.error('Payment error:', result.error);
         alert(result.error);
      } else {
        console.error('No checkout URL returned', result);
        alert('Something went wrong initiating the payment.');
      }
    } catch (error) {
      // This catch block might not be reached if server action catches errors, 
      // but good for network errors.
      alert('Error creating payment. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
        <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-green-900 mb-2">Thank You!</h1>
            <p className="text-green-700 mb-6">Your tip has been sent to {user.name}.</p>
            <button 
              onClick={() => window.location.href = `/u/${user.username}`}
              className="px-6 py-2 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 transition"
            >
              Send Another
            </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Header Profile */}
        <div className="bg-blue-600 p-8 text-center text-white">
          <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center text-4xl text-blue-600 font-bold border-4 border-blue-400 uppercase">
            {user.name?.[0] || user.username[0]}
          </div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="opacity-90">@{user.username}</p>
        </div>

        {/* Tipping Section */}
        <div className="p-8">
          <h2 className="text-gray-600 text-center mb-6 font-medium">Select an amount to tip</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 5, 10].map((val) => (
              <button
                key={val}
                onClick={() => { setAmount(val); setCustomAmount(''); }}
                className={`py-4 rounded-xl font-bold text-lg transition ${
                  amount === val && !customAmount
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ${val}
              </button>
            ))}
          </div>

          <div className="mb-8">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
              <input
                type="number"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setAmount(0); }}
                className={`w-full pl-8 pr-4 py-4 rounded-xl border-2 font-bold text-lg outline-none transition ${
                  customAmount ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-gray-200 focus:border-blue-400'
                }`}
              />
            </div>
          </div>

          <button
            onClick={handlePay}
            disabled={loading || (!amount && !customAmount)}
            className="w-full py-4 bg-black text-white font-bold text-xl rounded-xl hover:bg-gray-800 transition disabled:opacity-50 shadow-lg"
          >
            {loading ? 'Processing...' : `Pay $${customAmount || amount}`}
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <span>🔒 Secured by</span>
              <span className="font-bold text-gray-500">Stripe</span>
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <a href="/" className="text-sm text-gray-500 hover:text-gray-900 font-medium">
          Powered by TipTip
        </a>
      </div>
    </div>
  );
}
