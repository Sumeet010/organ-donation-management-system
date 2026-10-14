import React, { useState, useEffect, useCallback } from 'react';
import { FileHeart, Link2, RefreshCw, PlusCircle } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { ORGAN_TYPES, BLOOD_GROUPS, formatTimestamp, shortenAddress } from '../utils/constants';
import StatusBadge from '../components/StatusBadge';
import TransactionModal from '../components/TransactionModal';

export const RecipientRequest = () => {
  const { contract, signerContract, account, isCorrectNetwork, connectWallet } = useWeb3();

  const [formData, setFormData] = useState({
    patientAlias: '', requestedOrgan: ORGAN_TYPES[0], bloodGroup: BLOOD_GROUPS[0], description: '', consentAgreed: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [myRequests, setMyRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('my');
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [modalState, setModalState] = useState({ isOpen: false, status: 'idle', txHash: '', blockNumber: null, error: '' });

  const fetchRequests = useCallback(async () => {
    if (!contract) return;
    try {
      setLoadingRecords(true);
      const all = await contract.getAllRequests();
      setAllRequests(all);
      if (account) {
        const mine = await contract.getRequestsByAddress(account);
        setMyRequests(mine);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoadingRecords(false);
    }
  }, [contract, account]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.patientAlias.trim()) errors.patientAlias = 'Patient identifier is required.';
    if (!formData.requestedOrgan) errors.requestedOrgan = 'Please select an organ.';
    if (!formData.bloodGroup) errors.bloodGroup = 'Please select blood group.';
    if (!formData.description.trim()) errors.description = 'Clinical summary is required.';
    if (!formData.consentAgreed) errors.consentAgreed = 'You must confirm to submit this request.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) { connectWallet(); return; }
    if (!isCorrectNetwork) { alert('Please switch to the correct network.'); return; }
    if (!validateForm()) return;
    if (!signerContract) { alert('Wallet not connected.'); return; }

    try {
      setModalState({ isOpen: true, status: 'pending', txHash: '', blockNumber: null, error: '' });
      const tx = await signerContract.createRecipientRequest(
        formData.patientAlias.trim(), formData.requestedOrgan, formData.bloodGroup, formData.description.trim()
      );
      setModalState(prev => ({ ...prev, txHash: tx.hash }));
      const receipt = await tx.wait(1);
      setModalState({ isOpen: true, status: 'success', txHash: receipt.hash, blockNumber: receipt.blockNumber, error: '' });
      setFormData({ patientAlias: '', requestedOrgan: ORGAN_TYPES[0], bloodGroup: BLOOD_GROUPS[0], description: '', consentAgreed: false });
      await fetchRequests();
    } catch (err) {
      let errorMsg = err.reason || err.message || 'Transaction failed.';
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) errorMsg = 'Transaction rejected by user.';
      setModalState({ isOpen: true, status: 'error', txHash: '', blockNumber: null, error: errorMsg });
    }
  };

  const displayList = activeTab === 'my' ? myRequests : allRequests;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center">
            <FileHeart className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Patient Registry</span>
        </div>
        <h1 className="section-title">Submit Organ Request</h1>
        <p className="section-subtitle max-w-xl">
          Register a patient organ request. Once submitted, hospital administrators can review and approve the record for processing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Form */}
        <div className="lg:col-span-4">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <PlusCircle className="w-4 h-4 text-slate-700" />
              <h2 className="font-bold text-slate-900">Request Details</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="form-label text-xs">Submitting Wallet</label>
                <div className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-700 flex items-center gap-2">
                  {account ? (
                    <><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="select-all">{shortenAddress(account)}</span></>
                  ) : (
                    <button type="button" onClick={connectWallet} className="text-cyan-700 font-semibold text-xs">Connect Wallet</button>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="patientAlias" className="form-label">Patient Identifier <span className="text-rose-500">*</span></label>
                <input
                  id="patientAlias" name="patientAlias" type="text" value={formData.patientAlias}
                  onChange={handleChange} placeholder="e.g. P-2024-REQ-001"
                  className={`form-input text-sm ${formErrors.patientAlias ? 'border-rose-400' : ''}`}
                />
                {formErrors.patientAlias && <p className="text-xs text-rose-600 mt-1">{formErrors.patientAlias}</p>}
                <p className="text-[11px] text-slate-400 mt-1">Use a case reference number — avoid real names.</p>
              </div>

              <div>
                <label htmlFor="requestedOrgan" className="form-label">Organ Required <span className="text-rose-500">*</span></label>
                <select id="requestedOrgan" name="requestedOrgan" value={formData.requestedOrgan} onChange={handleChange} className="form-input text-sm">
                  {ORGAN_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="bloodGroup" className="form-label">Blood Group <span className="text-rose-500">*</span></label>
                <select id="bloodGroup" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="form-input text-sm">
                  {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="description" className="form-label">Clinical Summary <span className="text-rose-500">*</span></label>
                <textarea
                  id="description" name="description" rows="3" value={formData.description}
                  onChange={handleChange} placeholder="Non-sensitive clinical notes (e.g. End-stage renal disease)"
                  className={`form-input text-sm resize-none ${formErrors.description ? 'border-rose-400' : ''}`}
                ></textarea>
                {formErrors.description && <p className="text-xs text-rose-600 mt-1">{formErrors.description}</p>}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox" name="consentAgreed" checked={formData.consentAgreed}
                    onChange={handleChange} className="mt-0.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    I confirm that this request is submitted with the patient's knowledge and consent, and authorize this record to be stored on the registry.
                  </span>
                </label>
                {formErrors.consentAgreed && <p className="text-xs text-rose-600 mt-2 font-semibold">{formErrors.consentAgreed}</p>}
              </div>

              <button
                type="submit"
                disabled={!account || modalState.status === 'pending'}
                className="w-full btn-primary justify-center py-3 bg-slate-800 hover:bg-slate-900 disabled:opacity-50"
              >
                <FileHeart className="w-4 h-4" />
                {!account ? 'Connect Wallet to Proceed' : 'Submit Request'}
              </button>

            </form>
          </div>
        </div>

        {/* Records */}
        <div className="lg:col-span-8">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex gap-1 text-xs">
                {[
                  { key: 'my', label: `My Requests (${myRequests.length})` },
                  { key: 'all', label: `All Requests (${allRequests.length})` },
                ].map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                      activeTab === t.key ? 'bg-white border border-slate-200 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <button onClick={fetchRequests} className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {loadingRecords ? (
              <div className="p-10 text-center text-sm text-slate-400">Loading records...</div>
            ) : displayList.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-400">
                {activeTab === 'my' ? 'No requests submitted from your wallet.' : 'No requests on record.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-500 font-semibold uppercase tracking-wide">
                      <th className="px-5 py-3">ID</th>
                      <th className="px-5 py-3">Patient</th>
                      <th className="px-5 py-3">Organ</th>
                      <th className="px-5 py-3">Blood</th>
                      <th className="px-5 py-3">Donor Link</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayList.map(r => (
                      <tr key={r.id.toString()} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-600 text-xs">#{r.id.toString()}</td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900 text-sm">{r.patientAlias}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 leading-tight line-clamp-1">{r.description}</div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700">{r.requestedOrgan}</td>
                        <td className="px-5 py-3.5 text-slate-700">{r.bloodGroup}</td>
                        <td className="px-5 py-3.5">
                          {Number(r.allocatedDonorId) > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-cyan-700">
                              <Link2 className="w-3 h-3" /> #{r.allocatedDonorId.toString()}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5"><StatusBadge status={r.status} type="recipient" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      <TransactionModal
        isOpen={modalState.isOpen} status={modalState.status} txHash={modalState.txHash}
        blockNumber={modalState.blockNumber} error={modalState.error} title="Patient Request Submitted"
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default RecipientRequest;
