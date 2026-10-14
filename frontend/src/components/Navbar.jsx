import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HeartHandshake, 
  UserPlus, 
  FileHeart, 
  ShieldCheck, 
  History, 
  Wallet,
  ChevronDown,
  Activity,
  Menu,
  X
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { shortenAddress } from '../utils/constants';

export const Navbar = () => {
  const location = useLocation();
  const { account, chainId, targetChainId, isCorrectNetwork, isAdmin, connectWallet, isConnecting } = useWeb3();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: Activity },
    { to: '/donor', label: 'Donor Portal', icon: UserPlus },
    { to: '/recipient', label: 'Patient Requests', icon: FileHeart },
    { to: '/admin', label: 'Admin Panel', icon: ShieldCheck },
    { to: '/audit', label: 'Audit Logs', icon: History },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-cyan-700 text-white flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm leading-none">OrganChain</div>
              <div className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">National Organ Registry</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(to)
                    ? 'bg-cyan-50 text-cyan-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right: Wallet */}
          <div className="flex items-center gap-2.5">
            {account ? (
              <div className="flex items-center gap-2">
                {/* Network pill */}
                <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                  isCorrectNetwork
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isCorrectNetwork ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {isCorrectNetwork ? 'Connected' : 'Wrong Network'}
                </div>

                {/* Admin badge */}
                {isAdmin && (
                  <span className="hidden sm:flex px-2.5 py-1 bg-violet-600 text-white text-[11px] font-bold rounded-full">
                    ADMIN
                  </span>
                )}

                {/* Address */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800">
                  <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  {shortenAddress(account)}
                </div>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="btn-primary text-xs py-2 px-4"
              >
                <Wallet className="w-3.5 h-3.5" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(to)
                  ? 'bg-cyan-50 text-cyan-800 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default Navbar;
