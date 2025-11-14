'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, X } from 'lucide-react';

export default function TopBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white py-3 px-4 overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(90deg,transparent,black,transparent)] animate-slide" />
      
      <div className="relative max-w-7xl mx-auto flex items-center justify-center gap-3 text-center flex-wrap">
        <Sparkles className="w-4 h-4 animate-pulse" />
        <span className="text-sm font-semibold">
          🎉 Launch Special: Get <span className="px-2 py-0.5 bg-white/20 rounded-full mx-1">50% OFF</span> Pro Plan — Limited Time!
        </span>
        <Link 
          href="/login" 
          className="text-sm font-bold underline hover:no-underline transition-all hover:scale-105"
        >
          Claim Offer →
        </Link>
      </div>
      
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
        aria-label="Close banner"
        onClick={() => setIsVisible(false)}
      >
        <X className="w-4 h-4" />
      </button>
      
      <style jsx>{`
        @keyframes slide {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        .animate-slide {
          animation: slide 20s linear infinite;
        }
      `}</style>
    </div>
  );
}

