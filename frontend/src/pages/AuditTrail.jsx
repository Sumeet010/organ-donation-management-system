import React, { useState, useEffect, useCallback } from 'react';
import { History, Search, RefreshCw, Copy, Check, Filter } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { DONOR_STATUS_LABELS, RECIPIENT_STATUS_LABELS, ALLOCATION_STATUS_LABELS, formatTimestamp, shortenAddress } from '../utils/constants';

export const AuditTrail = () => {
  const { contract } = useWeb3();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedHash, setCopiedHash] = useState('');

  const fetchAuditEvents = useCallback(async () => {
    if (!contract) return;
    try {
      setLoading(true);

      const [
        donorRegisteredEvents,
        donorStatusEvents,
        reqCreatedEvents,
        reqStatusEvents,
        allocCreatedEvents,
        allocStatusEvents,
        adminTransferredEvents,
      ] = await Promise.all([
        contract.queryFilter(contract.filters.DonorRegistered(), 0, 'latest'),
        contract.queryFilter(contract.filters.DonorStatusUpdated(), 0, 'latest'),
        contract.queryFilter(contract.filters.RecipientRequestCreated(), 0, 'latest'),
        contract.queryFilter(contract.filters.RecipientRequestStatusUpdated(), 0, 'latest'),
        contract.queryFilter(contract.filters.AllocationCreated(), 0, 'latest'),
        contract.queryFilter(contract.filters.AllocationStatusUpdated(), 0, 'latest'),
        contract.queryFilter(contract.filters.AdminTransferred(), 0, 'latest'),
      ]);

      const formatted = [];

      donorRegisteredEvents.forEach(ev => {
        formatted.push({
          id: `${ev.transactionHash}-${ev.index}`,
          eventName: 'DonorRegistered',
          category: 'donor',
          blockNumber: ev.blockNumber,
          transactionHash: ev.transactionHash,
          recordId: ev.args[0].toString(),
          timestamp: Number(ev.args[4]),
          details: `Donor #${ev.args[0]} pledged ${ev.args[2]} (${ev.args[3]})`,
          actor: ev.args[1],
        });
      });

      donorStatusEvents.forEach(ev => {
        const statusLabel = DONOR_STATUS_LABELS[Number(ev.args[1])] || 'Updated';
        formatted.push({
          id: `${ev.transactionHash}-${ev.index}`,
          eventName: 'DonorStatusUpdated',
          category: 'donor',
          blockNumber: ev.blockNumber,
          transactionHash: ev.transactionHash,
          recordId: ev.args[0].toString(),
          timestamp: Number(ev.args[3]),
          details: `Donor #${ev.args[0]} → status: "${statusLabel}"`,
          actor: ev.args[2],
        });
      });

      reqCreatedEvents.forEach(ev => {
        formatted.push({
          id: `${ev.transactionHash}-${ev.index}`,
          eventName: 'RequestCreated',
          category: 'recipient',
          blockNumber: ev.blockNumber,
          transactionHash: ev.transactionHash,
          recordId: ev.args[0].toString(),
          timestamp: Number(ev.args[4]),
          details: `Request #${ev.args[0]} submitted for ${ev.args[2]} (${ev.args[3]})`,
          actor: ev.args[1],
        });
      });

      reqStatusEvents.forEach(ev => {
        const statusLabel = RECIPIENT_STATUS_LABELS[Number(ev.args[1])] || 'Updated';
        formatted.push({
          id: `${ev.transactionHash}-${ev.index}`,
          eventName: 'RequestStatusUpdated',
          category: 'recipient',
          blockNumber: ev.blockNumber,
          transactionHash: ev.transactionHash,
          recordId: ev.args[0].toString(),
          timestamp: Number(ev.args[3]),
          details: `Request #${ev.args[0]} → status: "${statusLabel}"`,
          actor: ev.args[2],
        });
      });

      allocCreatedEvents.forEach(ev => {
        formatted.push({
          id: `${ev.transactionHash}-${ev.index}`,
          eventName: 'AllocationCreated',
          category: 'allocation',
          blockNumber: ev.blockNumber,
          transactionHash: ev.transactionHash,
          recordId: ev.args[0].toString(),
          timestamp: Number(ev.args[4]),
          details: `Allocation #${ev.args[0]}: Donor #${ev.args[1]} → Request #${ev.args[2]}`,
          actor: ev.args[3],
        });
      });

      allocStatusEvents.forEach(ev => {
        const statusLabel = ALLOCATION_STATUS_LABELS[Number(ev.args[1])] || 'Updated';
        formatted.push({
          id: `${ev.transactionHash}-${ev.index}`,
          eventName: 'AllocationUpdated',
          category: 'allocation',
          blockNumber: ev.blockNumber,
          transactionHash: ev.transactionHash,
          recordId: ev.args[0].toString(),
          timestamp: Number(ev.args[3]),
          details: `Allocation #${ev.args[0]} → status: "${statusLabel}"`,
          actor: ev.args[2],
        });
      });

      adminTransferredEvents.forEach(ev => {
        formatted.push({
          id: `${ev.transactionHash}-${ev.index}`,
          eventName: 'AdminTransferred',
          category: 'admin',
          blockNumber: ev.blockNumber,
          transactionHash: ev.transactionHash,
          recordId: 'ADMIN',
          timestamp: Number(ev.args[2]),
          details: `Admin transferred: ${shortenAddress(ev.args[0])} → ${shortenAddress(ev.args[1])}`,
          actor: ev.args[1],
        });
      });

      formatted.sort((a, b) => b.blockNumber - a.blockNumber || b.timestamp - a.timestamp);
      setEvents(formatted);
    } catch (err) {
      console.error('Failed to query events:', err);
    } finally {
      setLoading(false);
    }
  }, [contract]);

  useEffect(() => { fetchAuditEvents(); }, [fetchAuditEvents]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(''), 2000);
  };

  const categoryColors = {
    donor: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    recipient: 'bg-violet-50 text-violet-800 border-violet-200',
    allocation: 'bg-amber-50 text-amber-800 border-amber-200',
    admin: 'bg-rose-50 text-rose-800 border-rose-200',
  };

  const filteredEvents = events.filter(ev => {
    const matchCat = selectedFilter === 'ALL' || ev.category === selectedFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !searchQuery
      || ev.transactionHash.toLowerCase().includes(q)
      || ev.details.toLowerCase().includes(q)
      || ev.recordId.includes(q)
      || ev.blockNumber.toString().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center">
              <History className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Audit Logs</span>
          </div>
          <h1 className="section-title">Blockchain Audit Trail</h1>
          <p className="section-subtitle">
            Immutable event history from the smart contract — cryptographically tamper-proof.
          </p>
        </div>
        <button onClick={fetchAuditEvents} className="btn-secondary text-xs gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Events
        </button>
      </div>

      {/* Filter + Search */}
      <div className="card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="flex items-center gap-1 font-semibold text-slate-600 mr-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {['ALL', 'donor', 'recipient', 'allocation', 'admin'].map(cat => (
            <button key={cat} onClick={() => setSelectedFilter(cat)}
              className={`px-2.5 py-1.5 rounded-md font-semibold capitalize transition-colors ${
                selectedFilter === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All' : `${cat}s`}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input type="text" placeholder="Search hash, block, or record ID..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="form-input text-xs pl-8 py-2"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between -mt-4">
        <p className="text-xs text-slate-400">{filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found</p>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-400" />
            <p className="text-sm text-slate-400">Scanning blockchain for events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">No events match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wide">
                  <th className="px-5 py-3">Event</th>
                  <th className="px-5 py-3">Block</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Signer</th>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3 text-right">Tx Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map(ev => (
                  <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${categoryColors[ev.category] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                        {ev.eventName}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-700">
                      #{ev.blockNumber}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 max-w-[220px]">
                      {ev.details}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">
                      {shortenAddress(ev.actor)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {formatTimestamp(ev.timestamp)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded font-mono">
                        <span className="text-slate-600 select-all">{shortenAddress(ev.transactionHash)}</span>
                        <button onClick={() => copyToClipboard(ev.transactionHash)}
                          className="text-slate-400 hover:text-slate-700 transition-colors">
                          {copiedHash === ev.transactionHash
                            ? <Check className="w-3 h-3 text-emerald-600" />
                            : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTrail;
