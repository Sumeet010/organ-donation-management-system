import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Heart, RefreshCw } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { ORGAN_TYPES, BLOOD_GROUPS, formatTimestamp, shortenAddress } from '../utils/constants';
import StatusBadge from '../components/StatusBadge';
import TransactionModal from '../components/TransactionModal';

export const DonorRegistration = () => {
  const { contract, signerContract, account, isCorrectNetwork, connectWallet } = useWeb3();

  const [formData, setFormData] = useState({
    nameAlias: '',
    organType: ORGAN_TYPES[0],
    bloodGroup: BLOOD_GROUPS[0],
    consentAgreed: false,
  });

  const [formErrors, setFormErrors] = useState({});
  const [myDonors, setMyDonors] = useState([]);
  const [allDonors, setAllDonors] = useState([]);
  const [activeTab, setActiveTab] = useState('my');
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [modalState, setModalState] = useState({
    isOpen: false, status: 'idle', txHash: '', blockNumber: null, error: '',
  });

  const fetchDonors = useCallback(async () => {
    if (!contract) return;
    try {
      setLoadingRecords(true);
      const all = await contract.getAllDonors();
      setAllDonors(all);
      if (account) {
        const mine = await contract.getDonorsByAddress(account);
        setMyDonors(mine);
      }
    } catch (err) {
      console.error('Error fetching donors:', err);
    } finally {
      setLoadingRecords(false);
    }
  }, [contract, account]);

  useEffect(() => { fetchDonors(); }, [fetchDonors]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nameAlias.trim()) errors.nameAlias = 'Donor identifier is required.';
    else if (formData.nameAlias.trim().length < 3) errors.nameAlias = 'Must be at least 3 characters.';
    if (!formData.organType) errors.organType = 'Please select an organ.';
    if (!formData.bloodGroup) errors.bloodGroup = 'Please select a blood group.';
    if (!formData.consentAgreed) errors.consentAgreed = 'You must confirm your pledge to proceed.';
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
      const tx = await signerContract.registerDonor(formData.nameAlias.trim(), formData.organType, formData.bloodGroup);
      setModalState(prev => ({ ...prev, txHash: tx.hash }));
      const receipt = await tx.wait(1);
      setModalState({ isOpen: true, status: 'success', txHash: receipt.hash, blockNumber: receipt.blockNumber, error: '' });
      setFormData({ nameAlias: '', organType: ORGAN_TYPES[0], bloodGroup: BLOOD_GROUPS[0], consentAgreed: false });
      await fetchDonors();
    } catch (err) {
      let errorMsg = err.reason || err.message || 'Transaction failed.';
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) errorMsg = 'Transaction rejected by user.';
      setModalState({ isOpen: true, status: 'error', txHash: '', blockNumber: null, error: errorMsg });
    }
  };

  const displayList = activeTab === 'my' ? myDonors : allDonors;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 bg-cyan-700 rounded-lg flex items-center justify-center">
            <UserPlus className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">Donor Registry</span>
        </div>
        <h1 className="section-title">Register Organ Donation Pledge</h1>
        <p className="section-subtitle max-w-xl">
          Submit your pledge to the blockchain-secured donor registry. Your record is cryptographically signed and permanently logged.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Form */}
        <div className="lg:col-span-4">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Heart className="w-4 h-4 text-rose-500" />
              <h2 className="font-bold text-slate-900">Pledge Details</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Wallet */}
              <div>
                <label className="form-label text-xs">Connected Wallet</label>
                <div className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-700 flex items-center justify-between">
                  {account ? (
                    <><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="select-all">{shortenAddress(account)}</span></>
                  ) : (
                    <button type="button" onClick={connectWallet} className="text-cyan-700 font-semibold text-xs">Connect Wallet</button>
                  )}
                </div>
              </div>

              {/* Alias */}
              <div>
                <label htmlFor="nameAlias" className="form-label">
                  Donor Identifier <span className="text-rose-500">*</span>
                </label>
                <input
                  id="nameAlias" name="nameAlias" type="text" value={formData.nameAlias}
                  onChange={handleChange} placeholder="e.g. D-2024-001 or Donor_Alex"
                  className={`form-input text-sm ${formErrors.nameAlias ? 'border-rose-400 focus:border-rose-500' : ''}`}
                />
                {formErrors.nameAlias && <p className="text-xs text-rose-600 mt-1">{formErrors.nameAlias}</p>}
                <p className="text-[11px] text-slate-400 mt-1">Use a pseudonym — avoid real personal names.</p>
              </div>

              {/* Organ */}
              <div>
                <label htmlFor="organType" className="form-label">Organ Pledged <span className="text-rose-500">*</span></label>
                <select id="organType" name="organType" value={formData.organType} onChange={handleChange} className="form-input text-sm">
                  {ORGAN_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Blood Group */}
              <div>
                <label htmlFor="bloodGroup" className="form-label">Blood Group <span className="text-rose-500">*</span></label>
                <select id="bloodGroup" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="form-input text-sm">
                  {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {/* Consent */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox" name="consentAgreed" checked={formData.consentAgreed}
                    onChange={handleChange}
                    className="mt-0.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    I voluntarily pledge my organ(s) for donation and consent to this record being permanently stored on the blockchain registry.
                  </span>
                </label>
                {formErrors.consentAgreed && <p className="text-xs text-rose-600 mt-2 font-semibold">{formErrors.consentAgreed}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!account || modalState.status === 'pending'}
                className="w-full btn-primary justify-center py-3 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                {!account ? 'Connect Wallet to Proceed' : 'Submit Pledge'}
              </button>

            </form>
          </div>
        </div>

        {/* Records */}
        <div className="lg:col-span-8">
          <div className="card overflow-hidden">
            {/* Tab bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex gap-1 text-xs">
                {[
                  { key: 'my', label: `My Registrations (${myDonors.length})` },
                  { key: 'all', label: `All Donors (${allDonors.length})` },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${activeTab === t.key ? 'bg-white border border-slate-200 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button onClick={fetchDonors} className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {/* Table */}
            {loadingRecords ? (
              <div className="p-10 text-center text-sm text-slate-400">Loading records...</div>
            ) : displayList.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-400">
                {activeTab === 'my' ? 'No pledges registered from your wallet.' : 'No donors registered yet.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-500 font-semibold uppercase tracking-wide">
                      <th className="px-5 py-3">ID</th>
                      <th className="px-5 py-3">Identifier</th>
                      <th className="px-5 py-3">Organ</th>
                      <th className="px-5 py-3">Blood</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayList.map(d => (
                      <tr key={d.id.toString()} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-600 text-xs">#{d.id.toString()}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-900">{d.nameAlias}</td>
                        <td className="px-5 py-3.5 text-slate-700">{d.organType}</td>
                        <td className="px-5 py-3.5 text-slate-700">{d.bloodGroup}</td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs">{formatTimestamp(d.registrationTime)}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={d.status} type="donor" /></td>
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
        blockNumber={modalState.blockNumber} error={modalState.error} title="Donor Registration"
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default DonorRegistration;
