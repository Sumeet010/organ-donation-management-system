import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';

export const NetworkAlert = () => {
  const { account, chainId, targetChainId, isCorrectNetwork, switchNetwork, error } = useWeb3();

  if (!account) return null;

  if (!isCorrectNetwork) {
    return (
      <div className="bg-rose-600 text-white px-4 py-2.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Wrong network detected (Chain ID: {chainId || '?'}). Please switch to the OrganChain network to continue.
            </span>
          </div>
          <button
            onClick={switchNetwork}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-rose-700 rounded font-semibold text-xs transition-colors hover:bg-rose-50 shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            Switch Network
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-amber-900 text-xs">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return null;
};

export default NetworkAlert;
