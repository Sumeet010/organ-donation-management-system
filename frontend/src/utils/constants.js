export const ORGAN_TYPES = [
  'Kidney',
  'Liver',
  'Heart',
  'Lung',
  'Cornea',
  'Pancreas',
  'Bone Marrow',
  'Skin Tissue'
];

export const BLOOD_GROUPS = [
  'O+',
  'O-',
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-'
];

export const DONOR_STATUS_LABELS = {
  0: 'Pending',
  1: 'Approved',
  2: 'Rejected'
};

export const RECIPIENT_STATUS_LABELS = {
  0: 'Pending',
  1: 'Approved',
  2: 'Rejected',
  3: 'Allocated',
  4: 'Completed'
};

export const ALLOCATION_STATUS_LABELS = {
  0: 'Active',
  1: 'Completed',
  2: 'Cancelled'
};

// Basic educational ABO compatibility reference table (FOR ACADEMIC DISPLAY ONLY)
export const ABO_COMPATIBILITY_INFO = {
  'O-': { canDonateTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], note: 'Universal Donor' },
  'O+': { canDonateTo: ['O+', 'A+', 'B+', 'AB+'], note: 'Compatible with Rh positive recipients' },
  'A-': { canDonateTo: ['A-', 'A+', 'AB-', 'AB+'], note: 'Compatible with A and AB groups' },
  'A+': { canDonateTo: ['A+', 'AB+'], note: 'Compatible with A+ and AB+' },
  'B-': { canDonateTo: ['B-', 'B+', 'AB-', 'AB+'], note: 'Compatible with B and AB groups' },
  'B+': { canDonateTo: ['B+', 'AB+'], note: 'Compatible with B+ and AB+' },
  'AB-': { canDonateTo: ['AB-', 'AB+'], note: 'Compatible with AB groups' },
  'AB+': { canDonateTo: ['AB+'], note: 'Universal Recipient' }
};

export function shortenAddress(address) {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export function formatTimestamp(timestamp) {
  if (!timestamp) return 'N/A';
  const num = typeof timestamp === 'bigint' ? Number(timestamp) : Number(timestamp);
  if (num === 0) return 'N/A';
  return new Date(num * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
