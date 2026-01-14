'use client';

import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UpgradeCTA() {
  const router = useRouter();

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
      <div className="flex items-start">
        <Lock className="w-6 h-6 mr-3 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">
            Unlock AI-Powered Insights
          </h3>
          <p className="text-blue-100 mb-4">
            Get predictive analytics, risk scoring, and personalized recommendations
            with RevTrust Pro.
          </p>
          <button
            onClick={() => router.push('/pricing')}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  );
}
