import React from 'react';

export default function TaskCard({ title, company, pay, onClick }) {
  return (
    <div className="w-full bg-white border border-black/10 rounded-3xl overflow-hidden">
      {/* Media area */}
      <div className="relative">
        <img src="/hand.gif" alt="task" className="w-full h-48 sm:h-56 object-cover bg-gray-100" />
        {/* Top-right pill (shows time remaining) */}
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black text-white text-[13px] leading-none">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span>5 days left</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-[22px] font-semibold tracking-tight text-black">{title}</h3>
        <p className="mt-3 text-[15px] leading-6 text-black/60">
          {company || 'Perform this task precisely in real‑time.'}
        </p>

        <div className="mt-6 border-t border-black/10 pt-4 flex items-center justify-between">
          <div className="inline-flex items-center px-3.5 py-2 rounded-xl border border-black/10 bg-gray-50 text-[13px] font-semibold text-black tracking-wide">
            {pay}
          </div>
          <button
            onClick={onClick}
            className="px-4 py-2 rounded-xl bg-black text-white text-[14px] font-medium hover:bg-gray-800 transition-colors"
          >
            Train
          </button>
        </div>
      </div>
    </div>
  );
}


