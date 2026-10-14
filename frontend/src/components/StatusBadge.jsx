import React from 'react';
import { CheckCircle2, Clock, XCircle, Link2, CheckCheck } from 'lucide-react';

export const StatusBadge = ({ status, type = 'donor' }) => {
  const statusNum = Number(status);

  // Donor Status: 0: Pending, 1: Approved, 2: Rejected
  if (type === 'donor') {
    if (statusNum === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Pending Review
        </span>
      );
    }
    if (statusNum === 1) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Approved Donor
        </span>
      );
    }
    if (statusNum === 2) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Rejected
        </span>
      );
    }
  }

  // Recipient Status: 0: Pending, 1: Approved, 2: Rejected, 3: Allocated, 4: Completed
  if (type === 'recipient') {
    if (statusNum === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Pending Review
        </span>
      );
    }
    if (statusNum === 1) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Approved Request
        </span>
      );
    }
    if (statusNum === 2) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Rejected
        </span>
      );
    }
    if (statusNum === 3) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200">
          <Link2 className="w-3.5 h-3.5 text-sky-600" />
          Allocated
        </span>
      );
    }
    if (statusNum === 4) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">
          <CheckCheck className="w-3.5 h-3.5 text-indigo-600" />
          Completed
        </span>
      );
    }
  }

  // Allocation Status: 0: Active, 1: Completed, 2: Cancelled
  if (type === 'allocation') {
    if (statusNum === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200">
          <Link2 className="w-3.5 h-3.5 text-sky-600" />
          Active Allocation
        </span>
      );
    }
    if (statusNum === 1) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">
          <CheckCheck className="w-3.5 h-3.5 text-indigo-600" />
          Completed
        </span>
      );
    }
    if (statusNum === 2) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
          <XCircle className="w-3.5 h-3.5 text-slate-500" />
          Cancelled
        </span>
      );
    }
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
      Unknown ({statusNum})
    </span>
  );
};
export default StatusBadge;
