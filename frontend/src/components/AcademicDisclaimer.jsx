import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const AcademicDisclaimer = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-md text-xs text-amber-900 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Academic Demonstration Notice:</span> This application is an educational prototype demonstrating blockchain integrity and transparency. It does not perform clinical matching or legal organ donor registration.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-100 rounded-md text-amber-700 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="text-sm">
          <h4 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
            Academic Project Disclaimer & Ethics Notice
            <span className="px-2 py-0.5 text-xs font-medium bg-sky-100 text-sky-800 rounded">College Viva Demo</span>
          </h4>
          <p className="text-slate-600 text-xs leading-relaxed mb-2">
            This system demonstrates how Ethereum smart contracts can enforce tamper-resistant logging of donor pledges, recipient requests, and administrative state changes. It is strictly an educational tool for college coursework.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              No real-world medical eligibility or allocation decisions.
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              Pseudonymous data only (no real PII or medical records stored on-chain).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicDisclaimer;
