import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, CheckCircle2, XCircle, Link2, RefreshCw,
  FileText, UserCheck, Layers, Lock
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { ORGAN_TYPES, BLOOD_GROUPS, formatTimestamp, shortenAddress } from '../utils/constants';
import StatusBadge from '../components/StatusBadge';
import TransactionModal from '../components/TransactionModal';

export const AdminDashboard = () => {
  const { contract, signerContract, account, isAdmin, adminAddress, isCorrectNetwork, connectWallet } = useWeb3();

  const [activeTab, setActiveTab] = useState('allocationStudio');
  const [donors, setDonors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedOrganFilter, setSelectedOrganFilter] = useState('ALL');
  const [selectedBloodFilter, setSelectedBloodFilter] = useState('ALL');
  const [selectedDonorId, setSelectedDonorId] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [allocationNotes, setAllocationNotes] = useState('Allocation verified by hospital administrator');

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', action: null });
  const [modalState, setModalState] = useState({ isOpen: false, status: 'idle', txHash: '', blockNumber: null, error: '', title: '' });

  const loadData = useCallback(async () => {
    if (!contract) return;
    try {
      setLoading(true);
      const [allDonors, allRequests, allAllocations] = await Promise.all([
        contract.getAllDonors(),
        contract.getAllRequests(),
        contract.getAllAllocations(),
      ]);
      setDonors(allDonors);
      setRequests(allRequests);
      setAllocations(allAllocations);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }, [contract]);

  useEffect(() => { loadData(); }, [loadData]);

  const executeAdminAction = async (actionTitle, contractCall) => {
    if (!signerContract) { alert('Wallet not connected.'); return; }
    try {
      setConfirmDialog({ isOpen: false, title: '', message: '', action: null });
      setModalState({ isOpen: true, status: 'pending', txHash: '', blockNumber: null, error: '', title: actionTitle });
      const tx = await contractCall();
      setModalState(prev => ({ ...prev, txHash: tx.hash }));
      const receipt = await tx.wait(1);
      setModalState({ isOpen: true, status: 'success', txHash: receipt.hash, blockNumber: receipt.blockNumber, error: '', title: actionTitle });
      await loadData();
    } catch (err) {
      let errorMsg = err.reason || err.message || 'Transaction failed.';
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) errorMsg = 'Transaction rejected by user.';
      setModalState({ isOpen: true, status: 'error', txHash: '', blockNumber: null, error: errorMsg, title: actionTitle });
    }
  };

  const handleUpdateDonorStatus = (donorId, newStatus, alias) => {
    const label = newStatus === 1 ? 'Approve' : 'Reject';
    setConfirmDialog({
      isOpen: true, title: `${label} Donor #${donorId}`,
      message: `Confirm ${label.toLowerCase()} for donor "${alias}"? This action will be permanently recorded on-chain.`,
      action: () => executeAdminAction(`${label} Donor #${donorId}`, () => signerContract.updateDonorStatus(donorId, newStatus)),
    });
  };

  const handleUpdateRequestStatus = (requestId, newStatus, alias) => {
    const label = newStatus === 1 ? 'Approve' : 'Reject';
    setConfirmDialog({
      isOpen: true, title: `${label} Request #${requestId}`,
      message: `Confirm ${label.toLowerCase()} for patient request "${alias}"? This will be recorded on-chain.`,
      action: () => executeAdminAction(`${label} Request #${requestId}`, () => signerContract.updateRecipientRequestStatus(requestId, newStatus)),
    });
  };

  const handleCreateAllocation = () => {
    if (!selectedDonorId || !selectedRequestId) { alert('Select both a donor and a recipient.'); return; }
    const donor = donors.find(d => d.id.toString() === selectedDonorId);
    const req = requests.find(r => r.id.toString() === selectedRequestId);
    if (!donor || !req) return;
    if (donor.organType !== req.requestedOrgan) {
      alert(`Organ mismatch: Donor offers ${donor.organType}, recipient needs ${req.requestedOrgan}`);
      return;
    }
    setConfirmDialog({
      isOpen: true, title: `Confirm Allocation`,
      message: `Link Donor #${donor.id} (${donor.nameAlias}, ${donor.organType}) with Request #${req.id} (${req.patientAlias}) on-chain?`,
      action: () => executeAdminAction('Create Allocation', async () => {
        const tx = await signerContract.createAllocation(donor.id, req.id, allocationNotes.trim());
        setSelectedDonorId(''); setSelectedRequestId('');
        return tx;
      }),
    });
  };

  const handleUpdateAllocation = (allocId, newStatus) => {
    const label = newStatus === 1 ? 'Complete' : 'Cancel';
    setConfirmDialog({
      isOpen: true, title: `${label} Allocation #${allocId}`,
      message: `Mark Allocation #${allocId} as ${label.toLowerCase()}? This will update the status on the blockchain.`,
      action: () => executeAdminAction(`${label} Allocation #${allocId}`, () => signerContract.updateAllocationStatus(allocId, newStatus)),
    });
  };

  const filterList = (items, organProp, bloodProp) =>
    items.filter(item => {
      const matchOrgan = selectedOrganFilter === 'ALL' || item[organProp] === selectedOrganFilter;
      const matchBlood = selectedBloodFilter === 'ALL' || item[bloodProp] === selectedBloodFilter;
      return matchOrgan && matchBlood;
    });

  const availableApprovedDonors = donors.filter(d => Number(d.status) === 1 && !d.isAllocated);
  const availableApprovedRequests = requests.filter(r => Number(r.status) === 1);
  const selectedDonorObj = donors.find(d => d.id.toString() === selectedDonorId);
  const selectedRequestObj = requests.find(r => r.id.toString() === selectedRequestId);
  const compatibleRequests = selectedDonorObj
    ? availableApprovedRequests.filter(r => r.requestedOrgan === selectedDonorObj.organType)
    : availableApprovedRequests;

  const tabs = [
    { key: 'allocationStudio', label: 'Allocation Studio', Icon: Link2 },
    { key: 'donors', label: `Donors (${donors.length})`, Icon: UserCheck },
    { key: 'requests', label: `Requests (${requests.length})`, Icon: FileText },
    { key: 'allocations', label: `Allocations (${allocations.length})`, Icon: Layers },
  ];

  const FilterBar = () => (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <select value={selectedOrganFilter} onChange={e => setSelectedOrganFilter(e.target.value)} className="form-input text-xs py-1.5 w-36">
        <option value="ALL">All Organs</option>
        {ORGAN_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <select value={selectedBloodFilter} onChange={e => setSelectedBloodFilter(e.target.value)} className="form-input text-xs py-1.5 w-28">
        <option value="ALL">All Blood</option>
        {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
      </select>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-violet-700 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-violet-700 uppercase tracking-wider">Admin Panel</span>
          </div>
          <h1 className="section-title">Administration & Allocations</h1>
          <p className="section-subtitle">
            Approve donors, review patient requests, and manage organ allocations.
          </p>
        </div>
        <button onClick={loadData} className="btn-secondary text-xs gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Access Guard */}
      {!isAdmin && (
        <div className="card border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h3 className="font-bold text-amber-950 text-sm">Access Restricted</h3>
              <p className="text-xs text-amber-800 mt-1">
                Administrative functions require the authorized administrator wallet. Currently connected: <code className="font-mono bg-amber-100 px-1 rounded">{account ? shortenAddress(account) : 'Not connected'}</code>
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Authorized admin: <code className="font-mono bg-white px-1 rounded border border-amber-200">{adminAddress || 'Loading...'}</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === key
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================= TAB: ALLOCATION STUDIO ========================= */}
      {activeTab === 'allocationStudio' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-violet-600" /> Allocation Studio
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Link an approved donor with a compatible recipient request to create an allocation record on the blockchain.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Select Donor */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-xs text-slate-800">Select Donor</span>
                  <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {availableApprovedDonors.length} Available
                  </span>
                </div>
                {availableApprovedDonors.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No approved donors available. Approve a donor first.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {availableApprovedDonors.map(d => {
                      const isSelected = selectedDonorId === d.id.toString();
                      return (
                        <div key={d.id.toString()} onClick={() => setSelectedDonorId(d.id.toString())}
                          className={`p-3 rounded-lg border cursor-pointer transition-all text-xs ${
                            isSelected ? 'border-cyan-500 bg-cyan-50 ring-1 ring-cyan-400' : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{d.nameAlias}</span>
                            <span className="text-[10px] font-mono text-slate-400">#{d.id.toString()}</span>
                          </div>
                          <div className="text-slate-500 mt-0.5">{d.organType} &bull; {d.bloodGroup}</div>
                          {isSelected && <div className="mt-1.5 text-[10px] text-cyan-700 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Selected</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Select Recipient */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-xs text-slate-800">Select Recipient</span>
                  <span className="text-[11px] text-violet-700 font-semibold bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
                    {compatibleRequests.length} Compatible
                  </span>
                </div>
                {availableApprovedRequests.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No approved requests available.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {availableApprovedRequests.map(r => {
                      const isCompatible = !selectedDonorObj || r.requestedOrgan === selectedDonorObj.organType;
                      const isSelected = selectedRequestId === r.id.toString();
                      return (
                        <div key={r.id.toString()}
                          onClick={() => { if (isCompatible) setSelectedRequestId(r.id.toString()); }}
                          className={`p-3 rounded-lg border text-xs transition-all ${
                            !isCompatible ? 'opacity-30 cursor-not-allowed border-slate-100 bg-white' :
                            isSelected ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-400 cursor-pointer' :
                            'border-slate-200 bg-white hover:border-slate-300 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{r.patientAlias}</span>
                            <span className="text-[10px] font-mono text-slate-400">#{r.id.toString()}</span>
                          </div>
                          <div className="text-slate-500 mt-0.5">{r.requestedOrgan} &bull; {r.bloodGroup}</div>
                          {isSelected && <div className="mt-1.5 text-[10px] text-violet-700 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Selected</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Summary & Execute */}
            {selectedDonorObj && selectedRequestObj && (
              <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-xs font-bold text-emerald-900 mb-2">Allocation Preview</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-emerald-700 font-semibold">Donor</p>
                    <p className="text-slate-800">{selectedDonorObj.nameAlias} — {selectedDonorObj.organType} ({selectedDonorObj.bloodGroup})</p>
                  </div>
                  <div>
                    <p className="text-emerald-700 font-semibold">Recipient</p>
                    <p className="text-slate-800">{selectedRequestObj.patientAlias} — {selectedRequestObj.requestedOrgan} ({selectedRequestObj.bloodGroup})</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5">
              <label className="form-label text-xs">Allocation Notes</label>
              <input value={allocationNotes} onChange={e => setAllocationNotes(e.target.value)}
                className="form-input text-xs" placeholder="Notes to record on-chain..." />
            </div>

            <button
              onClick={handleCreateAllocation}
              disabled={!isAdmin || !selectedDonorId || !selectedRequestId}
              className="mt-4 btn-primary bg-violet-700 hover:bg-violet-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Link2 className="w-4 h-4" /> Execute Allocation
            </button>
          </div>
        </div>
      )}

      {/* ========================= TAB: DONORS ========================= */}
      {activeTab === 'donors' && (
        <div>
          <FilterBar />
          <div className="card overflow-hidden">
            {loading ? (
              <div className="p-10 text-center text-sm text-slate-400">Loading...</div>
            ) : filterList(donors, 'organType', 'bloodGroup').length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-400">No donor records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-500 font-semibold uppercase tracking-wide">
                      <th className="px-5 py-3">ID</th>
                      <th className="px-5 py-3">Identifier</th>
                      <th className="px-5 py-3">Organ</th>
                      <th className="px-5 py-3">Blood</th>
                      <th className="px-5 py-3">Registered</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filterList(donors, 'organType', 'bloodGroup').map(d => (
                      <tr key={d.id.toString()} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-500 text-xs">#{d.id.toString()}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-900">{d.nameAlias}</td>
                        <td className="px-5 py-3.5 text-slate-700">{d.organType}</td>
                        <td className="px-5 py-3.5 text-slate-700">{d.bloodGroup}</td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs">{formatTimestamp(d.registrationTime)}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={d.status} type="donor" /></td>
                        <td className="px-5 py-3.5">
                          {Number(d.status) === 0 ? (
                            <div className="flex gap-1.5">
                              <button onClick={() => handleUpdateDonorStatus(d.id, 1, d.nameAlias)} disabled={!isAdmin} className="btn-success disabled:opacity-40 disabled:cursor-not-allowed">
                                <CheckCircle2 className="w-3 h-3" /> Approve
                              </button>
                              <button onClick={() => handleUpdateDonorStatus(d.id, 2, d.nameAlias)} disabled={!isAdmin} className="btn-danger disabled:opacity-40 disabled:cursor-not-allowed">
                                <XCircle className="w-3 h-3" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================= TAB: REQUESTS ========================= */}
      {activeTab === 'requests' && (
        <div>
          <FilterBar />
          <div className="card overflow-hidden">
            {loading ? (
              <div className="p-10 text-center text-sm text-slate-400">Loading...</div>
            ) : filterList(requests, 'requestedOrgan', 'bloodGroup').length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-400">No patient requests found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-500 font-semibold uppercase tracking-wide">
                      <th className="px-5 py-3">ID</th>
                      <th className="px-5 py-3">Patient</th>
                      <th className="px-5 py-3">Organ</th>
                      <th className="px-5 py-3">Blood</th>
                      <th className="px-5 py-3">Summary</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filterList(requests, 'requestedOrgan', 'bloodGroup').map(r => (
                      <tr key={r.id.toString()} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-500 text-xs">#{r.id.toString()}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-900">{r.patientAlias}</td>
                        <td className="px-5 py-3.5 text-slate-700">{r.requestedOrgan}</td>
                        <td className="px-5 py-3.5 text-slate-700">{r.bloodGroup}</td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs max-w-[160px] truncate">{r.description}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={r.status} type="recipient" /></td>
                        <td className="px-5 py-3.5">
                          {Number(r.status) === 0 ? (
                            <div className="flex gap-1.5">
                              <button onClick={() => handleUpdateRequestStatus(r.id, 1, r.patientAlias)} disabled={!isAdmin} className="btn-success disabled:opacity-40 disabled:cursor-not-allowed">
                                <CheckCircle2 className="w-3 h-3" /> Approve
                              </button>
                              <button onClick={() => handleUpdateRequestStatus(r.id, 2, r.patientAlias)} disabled={!isAdmin} className="btn-danger disabled:opacity-40 disabled:cursor-not-allowed">
                                <XCircle className="w-3 h-3" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================= TAB: ALLOCATIONS ========================= */}
      {activeTab === 'allocations' && (
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-400">Loading...</div>
          ) : allocations.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400">No allocations on record.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500 font-semibold uppercase tracking-wide">
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Donor</th>
                    <th className="px-5 py-3">Recipient</th>
                    <th className="px-5 py-3">Organ</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allocations.map(a => {
                    const allocId = a?.id?.toString?.() ?? '';
                    const donorId = a?.donorId?.toString?.() ?? '';
                    const reqId = (a?.requestId ?? a?.recipientRequestId)?.toString?.() ?? '';
                    const donor = donors.find(d => d?.id?.toString?.() === donorId);
                    const req = requests.find(r => r?.id?.toString?.() === reqId);
                    return (
                      <tr key={allocId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-500 text-xs">#{allocId}</td>
                        <td className="px-5 py-3.5">
                          <div className="text-xs font-semibold text-slate-900">{donor?.nameAlias || '—'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">#{donorId}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-xs font-semibold text-slate-900">{req?.patientAlias || '—'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">#{reqId}</div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700 text-xs">{donor?.organType || '—'}</td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs">{formatTimestamp(a?.allocationTime)}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={a.status} type="allocation" /></td>
                        <td className="px-5 py-3.5">
                          {Number(a.status) === 0 ? (
                            <div className="flex gap-1.5">
                              <button onClick={() => handleUpdateAllocation(a.id, 1)} disabled={!isAdmin} className="btn-success disabled:opacity-40 disabled:cursor-not-allowed">
                                <CheckCircle2 className="w-3 h-3" /> Complete
                              </button>
                              <button onClick={() => handleUpdateAllocation(a.id, 2)} disabled={!isAdmin} className="btn-danger disabled:opacity-40 disabled:cursor-not-allowed">
                                <XCircle className="w-3 h-3" /> Cancel
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card max-w-sm w-full p-6 shadow-xl">
            <h3 className="font-bold text-slate-900 text-base mb-2">{confirmDialog.title}</h3>
            <p className="text-sm text-slate-600 mb-6 whitespace-pre-line">{confirmDialog.message}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDialog({ isOpen: false })} className="btn-secondary text-xs">Cancel</button>
              <button
                onClick={() => { confirmDialog.action?.(); }}
                className="btn-primary bg-violet-700 hover:bg-violet-800 text-xs"
              >
                Confirm & Sign
              </button>
            </div>
          </div>
        </div>
      )}

      <TransactionModal
        isOpen={modalState.isOpen} status={modalState.status} txHash={modalState.txHash}
        blockNumber={modalState.blockNumber} error={modalState.error} title={modalState.title}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AdminDashboard;
