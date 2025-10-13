import React from 'react';

export default function TaskCard({ title, company, pay, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-black/10 rounded-2xl shadow-sm hover:shadow-md hover:border-black/20 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-black/5 p-6 group"
    >
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h3 className="text-black text-[15px] sm:text-[16px] font-semibold leading-snug tracking-tight truncate">{title}</h3>
          <p className="text-[13px] text-black/60 mt-1 truncate">{company}</p>
        </div>
        <div className="shrink-0">
          <span className="inline-flex items-center rounded-full border border-black/10 bg-black/5 px-3 py-1 text-[12px] font-medium text-black group-hover:bg-black/10 group-hover:translate-y-[-1px] transition-all">
            {pay}
          </span>
        </div>
      </div>
    </button>
  );
}


