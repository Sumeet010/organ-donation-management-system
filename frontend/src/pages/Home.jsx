import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartHandshake,
  UserPlus,
  FileHeart,
  ShieldCheck,
  ArrowRight,
  Activity,
  Lock,
  Eye,
  Database,
  CheckCircle2,
  TrendingUp,
  Clock,
  Users,
  Layers
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';

export const Home = () => {
  const { contract } = useWeb3();
  const [stats, setStats] = useState({
    totalDonors: 0,
    totalRequests: 0,
    approvedDonors: 0,
    approvedRequests: 0,
    activeAllocations: 0,
    completedAllocations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!contract) return;
      try {
        setLoading(true);
        const data = await contract.getSystemCounts();
        setStats({
          totalDonors: Number(data[0]),
          totalRequests: Number(data[1]),
          approvedDonors: Number(data[2]),
          approvedRequests: Number(data[3]),
          activeAllocations: Number(data[4]),
          completedAllocations: Number(data[5]),
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, [contract]);

  const statCards = [
    { label: 'Registered Donors', value: stats.totalDonors, icon: Users, color: 'text-cyan-700', bg: 'bg-cyan-50' },
    { label: 'Patient Requests', value: stats.totalRequests, icon: FileHeart, color: 'text-violet-700', bg: 'bg-violet-50' },
    { label: 'Approved Donors', value: stats.approvedDonors, icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Active Allocations', value: stats.activeAllocations, icon: Activity, color: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'Completed Cases', value: stats.completedAllocations, icon: TrendingUp, color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: 'Pending Approvals', value: Math.max(0, stats.totalDonors - stats.approvedDonors), icon: Clock, color: 'text-rose-700', bg: 'bg-rose-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

      {/* Hero */}
      <section className="card p-8 sm:p-12">
        <div className="max-w-2xl">
          <span className="inline-block px-3 py-1 bg-cyan-50 text-cyan-700 text-xs font-semibold rounded-full border border-cyan-200 mb-4">
            Blockchain-Secured National Registry
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Organ Donation<br />Management System
          </h1>
          <p className="mt-4 text-slate-500 text-base leading-relaxed">
            A decentralized, tamper-proof platform for recording and managing organ donor pledges, recipient requests, and hospital allocation records — secured by Ethereum smart contracts.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/donor" className="btn-primary">
              <UserPlus className="w-4 h-4" />
              Register as Donor
            </Link>
            <Link to="/recipient" className="btn-secondary">
              <FileHeart className="w-4 h-4" />
              Submit Request
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Registry Overview</h2>
            <p className="text-xs text-slate-400 mt-0.5">Live data from the smart contract</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="stat-card">
                <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div className={`text-2xl font-bold font-mono ${s.color}`}>
                  {loading ? '—' : s.value}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{s.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Portal Cards */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-5">Access Portals</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          <Link to="/donor" className="card p-6 hover:border-cyan-300 hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-cyan-50 border border-cyan-200 rounded-xl flex items-center justify-center mb-4 group-hover:bg-cyan-100 transition-colors">
                <UserPlus className="w-5 h-5 text-cyan-700" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Donor Portal</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Register your organ donation pledge. Your record is cryptographically signed and permanently stored on the blockchain.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-700 mt-5 border-t border-slate-100 pt-4">
              Open Donor Portal <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link to="/recipient" className="card p-6 hover:border-slate-300 hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center mb-4 group-hover:bg-slate-100 transition-colors">
                <FileHeart className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Patient Requests</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Submit a patient organ request. Requests are verified, immutably logged, and visible to authorized hospital administrators.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mt-5 border-t border-slate-100 pt-4">
              Submit Request <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link to="/admin" className="card p-6 hover:border-violet-300 hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-violet-50 border border-violet-200 rounded-xl flex items-center justify-center mb-4 group-hover:bg-violet-100 transition-colors">
                <ShieldCheck className="w-5 h-5 text-violet-700" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Administration Panel</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Restricted to authorized hospital administrators. Review, approve, and manage organ allocation records on-chain.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 mt-5 border-t border-slate-100 pt-4">
              Admin Access <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

        </div>
      </section>

      {/* Why Blockchain */}
      <section className="card p-8">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Why Blockchain?</h2>
        <p className="text-sm text-slate-400 mb-7">How the ledger improves trust and transparency over traditional systems.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Lock, color: 'text-cyan-700 bg-cyan-50', title: 'Immutable Records', desc: 'Once a record is committed to the blockchain, it cannot be altered or deleted by any party, including system administrators.' },
            { icon: Eye, color: 'text-emerald-700 bg-emerald-50', title: 'Full Auditability', desc: 'Every status change is logged as a timestamped on-chain event, providing a complete and verifiable history.' },
            { icon: ShieldCheck, color: 'text-violet-700 bg-violet-50', title: 'Cryptographic Access Control', desc: 'Administrative permissions are enforced at the smart contract level — not by the UI — using wallet signature verification.' },
            { icon: Database, color: 'text-amber-700 bg-amber-50', title: 'Data Minimization', desc: 'Only categorical and non-sensitive fields are stored on-chain. Sensitive patient data remains off-chain and encrypted.' },
          ].map((item) => {
            const Icon = item.icon;
            const [textColor, bgColor] = item.color.split(' ');
            return (
              <div key={item.title} className="border border-slate-100 rounded-xl p-5 bg-slate-50/50">
                <div className={`w-9 h-9 ${bgColor} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className={`w-4.5 h-4.5 ${textColor}`} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">{item.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};

export default Home;
