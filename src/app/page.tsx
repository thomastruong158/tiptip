import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      {/* Navbar */}
      <nav className="p-6 flex justify-between items-center max-w-6xl mx-auto w-full">
        <div className="text-2xl font-bold tracking-tighter text-blue-600">
          TipTip
        </div>
        <div className="flex gap-4">
          <Link 
            href="/login" 
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
          >
            Log in
          </Link>
          <Link 
            href="/signup" 
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center mt-12 mb-20">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl">
          The easiest way to <span className="text-blue-600">get tipped</span> without an app.
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Create your page, get your QR code, and start accepting tips in seconds. 
          No app download required for your fans.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/signup"
            className="px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-full hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Get your QR Code
          </Link>
          <Link 
            href="/u/demo"
            className="px-8 py-4 bg-white text-gray-900 text-lg font-bold rounded-full border border-gray-200 hover:border-gray-400 transition shadow-sm hover:shadow-md"
          >
            See a demo
          </Link>
        </div>

        {/* Features / Social Proof */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl text-left">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 text-2xl">
              🚀
            </div>
            <h3 className="text-xl font-bold mb-2">Instant Setup</h3>
            <p className="text-gray-600">Connect your bank account and get your unique link instantly.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 text-2xl">
              📱
            </div>
            <h3 className="text-xl font-bold mb-2">Apple & Google Pay</h3>
            <p className="text-gray-600">Tippers pay with one tap. No account needed for them.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 text-2xl">
              💸
            </div>
            <h3 className="text-xl font-bold mb-2">Direct Payouts</h3>
            <p className="text-gray-600">Funds go directly to your bank account via Stripe.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} TipTip. Powered by Stripe.
      </footer>
    </div>
  );
}
