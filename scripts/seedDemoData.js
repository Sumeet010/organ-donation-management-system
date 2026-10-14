const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log("Seeding Demo Data for Organ Donation System...");
  console.log("==================================================");

  const configPath = path.join(__dirname, "../frontend/src/contracts/contractConfig.json");
  if (!fs.existsSync(configPath)) {
    console.error("contractConfig.json not found! Please deploy the contract first using: npm run deploy:local");
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const signers = await ethers.getSigners();
  const admin = signers[0];
  const donorUser1 = signers[1] || signers[0];
  const donorUser2 = signers[2] || signers[0];
  const recipientUser1 = signers[3] || signers[0];
  const recipientUser2 = signers[4] || signers[0];

  const organDonation = await ethers.getContractAt("OrganDonation", config.address);

  console.log("Connected to OrganDonation at:", config.address);

  // 1. Register Donors
  console.log("\n1. Registering Sample Donors...");
  let tx = await organDonation.connect(donorUser1).registerDonor("Donor_Pledge_Alex", "Kidney", "O+");
  await tx.wait();
  console.log("Registered Donor 1: Alex (Kidney, O+) - Pending");

  tx = await organDonation.connect(donorUser2).registerDonor("Donor_Pledge_Sam", "Liver", "A+");
  await tx.wait();
  console.log("Registered Donor 2: Sam (Liver, A+) - Pending");

  tx = await organDonation.connect(donorUser1).registerDonor("Donor_Pledge_Jordan", "Cornea", "B+");
  await tx.wait();
  console.log("Registered Donor 3: Jordan (Cornea, B+) - Pending");

  // 2. Register Recipients
  console.log("\n2. Creating Sample Recipient Requests...");
  tx = await organDonation
    .connect(recipientUser1)
    .createRecipientRequest("Patient_Case_101", "Kidney", "O+", "Stage 5 CKD, waitlist priority");
  await tx.wait();
  console.log("Created Request 1: Case 101 (Kidney, O+) - Pending");

  tx = await organDonation
    .connect(recipientUser2)
    .createRecipientRequest("Patient_Case_102", "Liver", "A+", "Acute hepatic failure, non-emergency demo");
  await tx.wait();
  console.log("Created Request 2: Case 102 (Liver, A+) - Pending");

  // 3. Admin Approvals
  console.log("\n3. Hospital Admin Approving Records...");
  tx = await organDonation.connect(admin).updateDonorStatus(1, 1); // Approve Donor 1
  await tx.wait();
  console.log("Approved Donor 1 (Alex)");

  tx = await organDonation.connect(admin).updateDonorStatus(2, 1); // Approve Donor 2
  await tx.wait();
  console.log("Approved Donor 2 (Sam)");

  tx = await organDonation.connect(admin).updateRecipientRequestStatus(1, 1); // Approve Request 1
  await tx.wait();
  console.log("Approved Request 1 (Case 101)");

  // 4. Admin Demonstration Allocation
  console.log("\n4. Creating Demonstration Allocation...");
  tx = await organDonation
    .connect(admin)
    .createAllocation(1, 1, "Academic demonstration: compatibility match verified for demo purposes");
  await tx.wait();
  console.log("Allocated Donor 1 (Alex) -> Request 1 (Case 101) [Allocation ID: 1]");

  const counts = await organDonation.getSystemCounts();
  console.log("\nSeeding Complete! Summary:");
  console.log("- Total Donors:", counts.totalDonors.toString());
  console.log("- Total Requests:", counts.totalRequests.toString());
  console.log("- Available Approved Donors:", counts.approvedDonors.toString());
  console.log("- Available Approved Requests:", counts.approvedRequests.toString());
  console.log("- Active Allocations:", counts.activeAllocations.toString());
  console.log("==================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
