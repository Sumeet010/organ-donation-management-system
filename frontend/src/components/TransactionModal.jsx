import React from 'react';
import { Loader2, CheckCircle2, XCircle, ExternalLink, X } from 'lucide-react';

export const TransactionModal = ({ isOpen, status, txHash, blockNumber, error, onClose, title = 'Transaction Status' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-semibold text-slate-900 mb-4">{title}</h3>

        {/* State: Pending */}
        {status === 'pending' && (
          <div className="text-center py-6">
            <Loader2 className="w-12 h-12 text-sky-600 animate-spin mx-auto mb-4" />
            <h4 className="text-sm font-semibold text-slate-900 mb-1">Confirming On-Chain</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Please sign the transaction in MetaMask and wait for block confirmation...
            </p>
          </div>
        )}

        {/* State: Success */}
        {status === 'success' && (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 mb-1">Transaction Confirmed!</h4>
            <p className="text-xs text-slate-500 mb-4">
              Your record was permanently recorded on the blockchain ledger.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left space-y-2 mb-4 text-xs font-mono">
              {txHash && (
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-sans tracking-wider">Transaction Hash</span>
                  <span className="text-slate-800 break-all select-all font-semibold">{txHash}</span>
                </div>
              )}
              {blockNumber && (
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-sans tracking-wider">Block Number</span>
                  <span className="text-slate-800 font-semibold">{blockNumber}</span>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Close & View Records
            </button>
          </div>
        )}

        {/* State: Error */}
        {status === 'error' && (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <XCircle className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 mb-1">Transaction Failed</h4>
            <p className="text-xs text-slate-600 bg-rose-50 border border-rose-200 rounded-lg p-3 my-3 text-left break-words">
              {error || 'An unexpected smart contract error occurred.'}
            </p>
            <button
              onClick={onClose}
              className="w-full py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-medium transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionModal;
