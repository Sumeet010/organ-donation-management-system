# Blockchain-Based Organ Donation Management System

An academic demonstration decentralized application (dApp) developed for a college Blockchain Technology course. This system demonstrates how Ethereum smart contracts can provide immutability, transparency, verifiable access control, and an auditable event trail for organ donation pledges, recipient requests, and hospital administrative records.

---

> **Important Academic Disclaimer:**
> This project is strictly an educational prototype designed for academic study, coursework evaluation, and college viva presentation. It **does not** perform real clinical matching, determine transplant eligibility, or serve as a legally valid donor registry. Real-world organ allocation requires strict medical evaluation, HLA tissue typing, and authorized governmental procedures.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Objectives](#3-objectives)
4. [Main Features](#4-main-features)
5. [Technology Stack](#5-technology-stack)
6. [Architecture and Data Flow](#6-architecture-and-data-flow)
7. [Folder Structure](#7-folder-structure)
8. [Smart Contract Explanation](#8-smart-contract-explanation)
9. [Smart Contract Functions and Modifiers](#9-smart-contract-functions-and-modifiers)
10. [Frontend and Blockchain Integration](#10-frontend-and-blockchain-integration)
11. [Prerequisites](#11-prerequisites)
12. [Installation Commands](#12-installation-commands)
13. [How to Start the Local Hardhat Node](#13-how-to-start-the-local-hardhat-node)
14. [How to Deploy the Smart Contract](#14-how-to-deploy-the-smart-contract)
15. [How to Configure MetaMask](#15-how-to-configure-metamask)
16. [How to Start the React Application](#16-how-to-start-the-react-application)
17. [How to Run Smart Contract Tests](#17-how-to-run-smart-contract-tests)
18. [Sample Demo Workflow for Viva](#18-sample-demo-workflow-for-viva)
19. [Limitations and Future Enhancements](#19-limitations-and-future-enhancements)
20. [Security and Privacy Considerations](#20-security-and-privacy-considerations)

---

## 1. Project Overview
In traditional healthcare management, organ donation records and waiting lists reside in centralized databases maintained by individual hospital authorities or regional servers. Centralized databases are susceptible to single points of failure, unauthorized tampering, opaque queue manipulation, and data alteration without a public audit trail.

This project implements a decentralized registry using an Ethereum smart contract (`OrganDonation.sol`), tested and deployed on a local Hardhat network, coupled with a responsive React/Vite web application. It enforces role-based access control, tracks the complete lifecycle of donor pledges and recipient requests, and logs all transitions as immutable events.

---

## 2. Problem Statement
1. **Lack of Public Auditability:** Centralized databases do not easily allow external auditors or participants to verify whether records were altered post-hoc.
2. **Unauthorized Record Tampering:** Without cryptographic consensus and bytecode-enforced permissioning, bad actors with database administrator access can modify donor status or priority lists.
3. **Data Loss & Single Point of Failure:** Centralized servers can experience downtime, corruption, or catastrophic data loss.
4. **Trust Deficit:** Patients and donors must blindly trust central authorities without cryptographic proof of record integrity.

---

## 3. Objectives
- Implement an **immutable on-chain ledger** for recording pseudonymous donor pledges and recipient requests.
- Enforce strict **on-chain role-based authorization** ensuring that only the authorized Hospital Administrator can approve records or create demonstration allocations.
- Prevent invalid state transitions, conflicting double-allocations, and duplicate assignments directly within the Solidity contract.
- Provide a modern, clean web interface (without visual distraction or gradient noise) allowing users to connect MetaMask, sign transactions, and inspect blockchain event logs in real time.
- Minimize privacy risks by storing only non-sensitive categorical data (pseudonyms, organ type, blood group, timestamps) on the blockchain.

---

## 4. Main Features
- **MetaMask Wallet Integration:** Automatic detection, account switching, network switching to Hardhat Localhost (Chain ID: `31337`), and balance display.
- **Donor Registration:** Donors register their pledge with alias, organ type, blood group, and explicit educational consent checkbox.
- **Recipient Request Portal:** Patients/coordinators submit requests with non-sensitive case identifiers and medical summaries.
- **Hospital Administrator Dashboard:**
  - View all registered donors and requests.
  - Approve or reject donor pledges.
  - Approve or reject recipient requests.
  - **Demo Allocation Studio:** Select approved donors and recipients with organ matching enforcement and educational ABO notes.
  - **Lifecycle Management:** Complete or cancel allocations (cancellation automatically reverts records back to the available approved pool).
- **Basic Compatibility Filtering:** Group records by organ type and blood group for educational review.
- **Blockchain Audit Trail & Event Explorer:** Live query of EVM events (`DonorRegistered`, `DonorStatusUpdated`, `RecipientRequestCreated`, `AllocationCreated`, etc.) with block numbers and transaction hashes.

---

## 5. Technology Stack

### Blockchain Layer
- **Solidity (^0.8.24):** Core smart contract programming language.
- **Hardhat (v2.22):** Ethereum development environment for compiling, running local EVM nodes, running automated tests, and deploying.
- **Ethers.js (v6):** Comprehensive JavaScript library for signing transactions and querying contract state and events.
- **Hardhat Network:** Fast local Ethereum testnet running on `http://127.0.0.1:8545` (Chain ID: `31337`).

### Frontend Layer
- **React 18:** Modern declarative UI library.
- **Vite:** High-speed development bundler.
- **Tailwind CSS:** Utility-first CSS framework configured with crisp, clean, solid healthcare palettes (no gradients).
- **React Router (v6):** Client-side routing between Overview, Donor, Recipient, Admin, and Audit pages.
- **Lucide React:** Clean medical and system icons.

---

## 6. Architecture and Data Flow

```
[ User Browser / MetaMask Wallet ]
               │
               ▼ (EIP-1193 RPC Provider)
     [ React Frontend (Vite) ]
               │
               ▼ (Ethers.js v6 Calls)
  [ Hardhat Local EVM Node (31337) ]
               │
  ┌────────────┴────────────┐
  ▼                         ▼
[ OrganDonation.sol ]  [ EVM Event Logs ]
- State: Donors        - DonorRegistered
- State: Requests      - DonorStatusUpdated
- State: Allocations   - RecipientRequestCreated
- onlyAdmin Modifiers  - AllocationCreated
```

---

## 7. Folder Structure

```
organ-donation-management-system/
├── contracts/
│   └── OrganDonation.sol            # Solidity Smart Contract
├── scripts/
│   ├── deploy.js                    # Deployment script (exports address & ABI)
│   └── seedDemoData.js              # Seeds sample records for viva demo
├── test/
│   └── OrganDonation.test.js        # 23 automated Hardhat unit tests
├── hardhat.config.js                # Hardhat compilation and network config
├── package.json                     # Root configuration and runner scripts
├── .gitignore
├── .env.example
├── README.md                        # Complete project documentation
├── PROJECT_EXPLANATION.md           # College viva Q&A guide
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── AcademicDisclaimer.jsx
    │   │   ├── Footer.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── NetworkAlert.jsx
    │   │   ├── StatusBadge.jsx
    │   │   └── TransactionModal.jsx
    │   ├── context/
    │   │   └── Web3Context.jsx      # MetaMask connection & contract provider
    │   ├── contracts/
    │   │   └── contractConfig.json  # Auto-generated address & ABI
    │   ├── pages/
    │   │   ├── AdminDashboard.jsx   # Admin approvals & Demo Allocation Studio
    │   │   ├── AuditTrail.jsx       # Real-time EVM event explorer
    │   │   ├── DonorRegistration.jsx# Donor registration form & records
    │   │   ├── Home.jsx             # Overview & on-chain statistics
    │   │   └── RecipientRequest.jsx # Recipient request form & records
    │   ├── utils/
    │   │   └── constants.js         # Formatting helpers & reference data
    │   ├── App.jsx                  # Main routing container
    │   ├── index.css                # Base Tailwind styling (solid colors)
    │   └── main.jsx                 # React root mount
    ├── index.html
    ├── package.json                 # Frontend dependencies
    ├── postcss.config.js
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 8. Smart Contract Explanation
The smart contract `OrganDonation.sol` acts as the single source of truth for all registration and status records.

### Lifecycle States (Enums)
1. **DonorStatus:**
   - `Pending (0)`: Newly submitted pledge awaiting admin review.
   - `Approved (1)`: Verified by hospital administrator; eligible for demo allocation.
   - `Rejected (2)`: Denied by hospital administrator.
2. **RecipientStatus:**
   - `Pending (0)`: Request awaiting admin review.
   - `Approved (1)`: Verified by hospital administrator; eligible for demo allocation.
   - `Rejected (2)`: Denied by administrator.
   - `Allocated (3)`: Linked to an approved donor in an active allocation.
   - `Completed (4)`: Finished demo allocation.
3. **AllocationStatus:**
   - `Active (0)`: Donor and recipient currently paired.
   - `Completed (1)`: Allocation permanently completed.
   - `Cancelled (2)`: Allocation cancelled; donor and recipient released back to the approved pool.

---

## 9. Smart Contract Functions and Modifiers

| Function / Modifier | Access | Description |
|---|---|---|
| `modifier onlyAdmin()` | Internal | Requires `msg.sender == admin`. Reverts with informative error otherwise. |
| `constructor()` | Public | Sets the deployer (`msg.sender`) as the initial `admin`. |
| `registerDonor(...)` | Public | Registers a new donor pledge. Emits `DonorRegistered`. |
| `updateDonorStatus(...)` | `onlyAdmin` | Approves or rejects a donor pledge. Prevents modifying allocated donors. |
| `createRecipientRequest(...)` | Public | Submits a recipient organ request. Emits `RecipientRequestCreated`. |
| `updateRecipientRequestStatus(...)` | `onlyAdmin` | Approves or rejects a recipient request. |
| `createAllocation(...)` | `onlyAdmin` | Verifies donor & request are approved, ensures matching organs, and links them. |
| `updateAllocationStatus(...)` | `onlyAdmin` | Transitions allocation to Completed or Cancelled. If cancelled, safely returns parties to the approved pool. |
| `transferAdmin(...)` | `onlyAdmin` | Safely transfers admin role to a new address. |
| `getAllDonors()` | View | Returns array of all registered donor records. |
| `getAllRequests()` | View | Returns array of all recipient request records. |
| `getAllAllocations()` | View | Returns array of all demonstration allocations. |
| `getSystemCounts()` | View | Computes total donors, requests, approved pools, and active/completed counts. |

---

## 10. Frontend and Blockchain Integration
- **`Web3Context.jsx`**: Listens to MetaMask's `accountsChanged` and `chainChanged` events. It sets up an Ethers.js `BrowserProvider` and `Signer`.
- **Read-Only Provider**: Even if MetaMask is disconnected, the frontend creates a `JsonRpcProvider` connecting to `http://127.0.0.1:8545` so visitors can view live ledger counts and records without signing in.
- **Transaction Modal**: Tracks transactions across three phases:
  1. `pending`: Waiting for user signature and block inclusion.
  2. `success`: Displays transaction hash and confirmed block number.
  3. `error`: Displays user-friendly error message if rejected or reverted.

---

## 11. Prerequisites
- **Node.js**: v18.x or v20.x or v22.x
- **npm**: v9.x or higher
- **MetaMask**: Browser extension installed in Chrome, Brave, Firefox, or Edge.

---

## 12. Installation Commands

In the root directory of the project:
```bash
# 1. Install root dependencies (Hardhat, Ethers, Chai)
npm install --legacy-peer-deps

# 2. Install frontend dependencies (React, Vite, Tailwind, Lucide)
cd frontend
npm install --legacy-peer-deps
cd ..
```

---

## 13. How to Start the Local Hardhat Node

Open a dedicated terminal window in the root directory:
```bash
npm run node
```
This starts a local Ethereum JSON-RPC node at `http://127.0.0.1:8545` with 20 pre-funded test accounts (10,000 ETH each).

---

## 14. How to Deploy the Smart Contract

Open a second terminal window in the root directory:
```bash
npm run deploy:local
```
This compiles `OrganDonation.sol`, deploys it to the local node, and automatically exports the contract address and ABI into `frontend/src/contracts/contractConfig.json`.

*(Optional)* To populate sample demonstration records for a college presentation:
```bash
npm run seed:local
```

---

## 15. How to Configure MetaMask

1. Open your browser and click the MetaMask icon.
2. Click the network dropdown (top-left) &rarr; **Add network** &rarr; **Add a network manually**.
3. Fill in the network details:
   - **Network Name:** Hardhat Localhost
   - **New RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
4. Click **Save** and switch to **Hardhat Localhost**.
5. **Import the Hospital Administrator Account:**
   - In MetaMask, click your profile icon &rarr; **Import Account**.
   - Paste Account #0 private key:
     ```
     0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
     ```
   - Click **Import**. You now have the Hospital Admin wallet address `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` with 10,000 test ETH!
6. *(Optional)* Import Account #1 (Donor) using private key:
   ```
   0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   ```

---

## 16. How to Start the React Application

In your second terminal window:
```bash
npm run frontend:dev
```
Open your browser at:
```
http://localhost:5173
```

---

## 17. How to Run Smart Contract Tests

To execute the automated unit test suite verifying all 23 security assertions:
```bash
npm test
```
**Expected Test Output:**
```
  OrganDonation Smart Contract
    Deployment and Admin Initialization
      ✔ Should deploy successfully and set deployer as administrator
      ✔ Should allow admin to transfer administrative authority
      ✔ Should reject admin transfer from unauthorized user
      ✔ Should reject admin transfer to zero address
    Donor Registration
      ✔ Should register a donor with valid data in Pending state
      ✔ Should reject donor registration with empty fields
      ✔ Should return user-specific donors
    Recipient Request Creation
      ✔ Should create recipient request in Pending state
      ✔ Should reject recipient request with empty required fields
    Administrator Status Updates & Access Control
      ✔ Should allow administrator to approve donor registration
      ✔ Should allow administrator to reject donor registration
      ✔ Should allow administrator to approve recipient request
      ✔ Should reject status updates from non-administrator
      ✔ Should reject status update with invalid identifier
    Allocation Management & Integrity Enforcements
      ✔ Should reject allocation if donor or recipient is not approved
      ✔ Should reject allocation if organ types do not match
      ✔ Should successfully create allocation when donor and request are approved
      ✔ Should prevent duplicate/conflicting active allocations for the same donor
      ✔ Should prevent modifying status of an actively allocated donor
      ✔ Should allow completing an active allocation
      ✔ Should allow cancelling an allocation and releasing donor/request back to approved pool
    System Counts and Aggregations
      ✔ Should accurately compute system statistics
      ✔ Should retrieve all records via list getters

  23 passing (5s)
```

---

## 18. Sample Demo Workflow for Viva

1. **Start Services:** Start `npm run node`, run `npm run deploy:local`, and launch `npm run frontend:dev`.
2. **Connect Wallet:** Open `http://localhost:5173`. Connect MetaMask with Account #1 (Donor).
3. **Register Donor:** Go to **Donor Registration**. Submit alias "Donor_Pledge_01", select "Kidney", blood group "O+", check the consent box, and submit. Confirm in MetaMask. The record appears under "My Registrations" as **Pending Review**.
4. **Submit Recipient Request:** Switch MetaMask account to Account #2 (Recipient). Go to **Recipient Request**. Submit "Patient_Case_Alpha", organ "Kidney", blood "O+", clinical note, and submit. Confirm in MetaMask. Status shows **Pending Review**.
5. **Admin Approval:** Switch MetaMask to Account #0 (Hospital Administrator).
   - Go to **Admin Dashboard** &rarr; **Review Donors**. Click **Approve**. Confirm on-chain.
   - Go to **Review Requests**. Click **Approve**. Confirm on-chain.
6. **Demo Allocation Studio:** Click the **Demo Allocation Studio** tab. Select the approved Kidney donor and the approved Kidney recipient. Notice the automatic organ match check and educational ABO note. Click **Execute Demonstration Allocation On-Chain**.
7. **Inspect Audit Trail:** Navigate to the **Audit Trail** page. Observe the chronological log of all events (`DonorRegistered`, `DonorStatusUpdated`, `AllocationCreated`) complete with block numbers and transaction hashes!

---

## 19. Limitations and Future Enhancements
- **No Clinical Matching:** This system demonstrates record integrity, not medical tissue compatibility (e.g., HLA crossmatching, PRA titers).
- **Public Blockchain Privacy:** Ethereum testnet data is public. Production enterprise healthcare systems would use Zero-Knowledge Proofs (zk-SNARKs) or a private consortium chain (Hyperledger Besu).
- **Decentralized Storage:** Currently, records are kept compact on-chain. Future versions could integrate encrypted IPFS storage for hashed medical consent documents.

---

## 20. Security and Privacy Considerations
- **Bytecode Enforcement:** Admin checks are enforced in Solidity (`require(msg.sender == admin)`), preventing bypasses via UI inspection.
- **Protection Against Re-entrancy & Conflicts:** Donors and requests are guarded with flags (`isAllocated`) to prevent double-pledging or conflicting active allocations.
- **Zero Real PII:** Only pseudonyms, categorical fields, and timestamps are stored on the ledger to protect patient privacy.
- **Local Testnet Only:** Private keys supplied in this documentation are publicly known Hardhat development keys and must never be used on Ethereum Mainnet or hold real assets.
