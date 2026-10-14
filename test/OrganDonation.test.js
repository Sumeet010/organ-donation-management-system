const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("OrganDonation Smart Contract", function () {
  let organDonation;
  let admin, donor1, donor2, recipient1, recipient2, unauthorizedUser;

  // Helper for checking expected reverts
  async function expectRevert(promise, expectedSubstring) {
    try {
      await promise;
      expect.fail("Expected transaction to revert, but it succeeded");
    } catch (error) {
      if (expectedSubstring) {
        expect(error.message).to.include(expectedSubstring);
      }
    }
  }

  beforeEach(async function () {
    [admin, donor1, donor2, recipient1, recipient2, unauthorizedUser] = await ethers.getSigners();

    const OrganDonation = await ethers.getContractFactory("OrganDonation");
    organDonation = await OrganDonation.deploy();
    await organDonation.waitForDeployment();
  });

  describe("Deployment and Admin Initialization", function () {
    it("Should deploy successfully and set deployer as administrator", async function () {
      const contractAdmin = await organDonation.admin();
      expect(contractAdmin).to.equal(admin.address);
      expect(await organDonation.donorCount()).to.equal(0n);
      expect(await organDonation.requestCount()).to.equal(0n);
      expect(await organDonation.allocationCount()).to.equal(0n);
    });

    it("Should allow admin to transfer administrative authority", async function () {
      await organDonation.connect(admin).transferAdmin(donor1.address);
      expect(await organDonation.admin()).to.equal(donor1.address);
    });

    it("Should reject admin transfer from unauthorized user", async function () {
      await expectRevert(
        organDonation.connect(unauthorizedUser).transferAdmin(unauthorizedUser.address),
        "OrganDonation: caller is not the hospital administrator"
      );
    });

    it("Should reject admin transfer to zero address", async function () {
      await expectRevert(
        organDonation.connect(admin).transferAdmin(ethers.ZeroAddress),
        "OrganDonation: zero address cannot be admin"
      );
    });
  });

  describe("Donor Registration", function () {
    it("Should register a donor with valid data in Pending state", async function () {
      const tx = await organDonation.connect(donor1).registerDonor("Donor_Alice", "Kidney", "O+");
      await tx.wait();

      expect(await organDonation.donorCount()).to.equal(1n);

      const donorRecord = await organDonation.donors(1);
      expect(donorRecord.id).to.equal(1n);
      expect(donorRecord.donorAddress).to.equal(donor1.address);
      expect(donorRecord.nameAlias).to.equal("Donor_Alice");
      expect(donorRecord.organType).to.equal("Kidney");
      expect(donorRecord.bloodGroup).to.equal("O+");
      expect(donorRecord.status).to.equal(0n); // 0 = Pending
      expect(donorRecord.isAllocated).to.equal(false);
    });

    it("Should reject donor registration with empty fields", async function () {
      await expectRevert(
        organDonation.connect(donor1).registerDonor("", "Kidney", "O+"),
        "OrganDonation: name alias is required"
      );
      await expectRevert(
        organDonation.connect(donor1).registerDonor("Donor_Bob", "", "O+"),
        "OrganDonation: organ type is required"
      );
      await expectRevert(
        organDonation.connect(donor1).registerDonor("Donor_Bob", "Kidney", ""),
        "OrganDonation: blood group is required"
      );
    });

    it("Should return user-specific donors", async function () {
      await organDonation.connect(donor1).registerDonor("Donor_Alice_1", "Kidney", "O+");
      await organDonation.connect(donor1).registerDonor("Donor_Alice_2", "Cornea", "O+");
      await organDonation.connect(donor2).registerDonor("Donor_Bob", "Liver", "A+");

      const userDonors = await organDonation.getDonorsByAddress(donor1.address);
      expect(userDonors.length).to.equal(2);
      expect(userDonors[0].nameAlias).to.equal("Donor_Alice_1");
      expect(userDonors[1].nameAlias).to.equal("Donor_Alice_2");
    });
  });

  describe("Recipient Request Creation", function () {
    it("Should create recipient request in Pending state", async function () {
      const tx = await organDonation
        .connect(recipient1)
        .createRecipientRequest("Patient_Charlie", "Kidney", "O+", "End-stage renal disease");
      await tx.wait();

      expect(await organDonation.requestCount()).to.equal(1n);

      const req = await organDonation.recipientRequests(1);
      expect(req.id).to.equal(1n);
      expect(req.recipientAddress).to.equal(recipient1.address);
      expect(req.patientAlias).to.equal("Patient_Charlie");
      expect(req.requestedOrgan).to.equal("Kidney");
      expect(req.bloodGroup).to.equal("O+");
      expect(req.description).to.equal("End-stage renal disease");
      expect(req.status).to.equal(0n); // 0 = Pending
      expect(req.allocatedDonorId).to.equal(0n);
    });

    it("Should reject recipient request with empty required fields", async function () {
      await expectRevert(
        organDonation.connect(recipient1).createRecipientRequest("", "Kidney", "O+", "Notes"),
        "OrganDonation: patient alias is required"
      );
      await expectRevert(
        organDonation.connect(recipient1).createRecipientRequest("Patient_C", "", "O+", "Notes"),
        "OrganDonation: requested organ is required"
      );
    });
  });

  describe("Administrator Status Updates & Access Control", function () {
    beforeEach(async function () {
      await organDonation.connect(donor1).registerDonor("Donor_Alice", "Kidney", "O+");
      await organDonation
        .connect(recipient1)
        .createRecipientRequest("Patient_Charlie", "Kidney", "O+", "Urgent");
    });

    it("Should allow administrator to approve donor registration", async function () {
      await organDonation.connect(admin).updateDonorStatus(1, 1); // 1 = Approved
      const donor = await organDonation.donors(1);
      expect(donor.status).to.equal(1n);
    });

    it("Should allow administrator to reject donor registration", async function () {
      await organDonation.connect(admin).updateDonorStatus(1, 2); // 2 = Rejected
      const donor = await organDonation.donors(1);
      expect(donor.status).to.equal(2n);
    });

    it("Should allow administrator to approve recipient request", async function () {
      await organDonation.connect(admin).updateRecipientRequestStatus(1, 1); // 1 = Approved
      const req = await organDonation.recipientRequests(1);
      expect(req.status).to.equal(1n);
    });

    it("Should reject status updates from non-administrator", async function () {
      await expectRevert(
        organDonation.connect(unauthorizedUser).updateDonorStatus(1, 1),
        "OrganDonation: caller is not the hospital administrator"
      );
      await expectRevert(
        organDonation.connect(unauthorizedUser).updateRecipientRequestStatus(1, 1),
        "OrganDonation: caller is not the hospital administrator"
      );
    });

    it("Should reject status update with invalid identifier", async function () {
      await expectRevert(
        organDonation.connect(admin).updateDonorStatus(999, 1),
        "OrganDonation: invalid donor ID"
      );
      await expectRevert(
        organDonation.connect(admin).updateRecipientRequestStatus(999, 1),
        "OrganDonation: invalid request ID"
      );
    });
  });

  describe("Allocation Management & Integrity Enforcements", function () {
    beforeEach(async function () {
      // Register donor 1 (Kidney, O+)
      await organDonation.connect(donor1).registerDonor("Donor_Alice", "Kidney", "O+");
      // Register donor 2 (Liver, A+)
      await organDonation.connect(donor2).registerDonor("Donor_Bob", "Liver", "A+");

      // Register request 1 (Kidney, O+)
      await organDonation
        .connect(recipient1)
        .createRecipientRequest("Patient_Charlie", "Kidney", "O+", "Kidney request");
      // Register request 2 (Kidney, O+)
      await organDonation
        .connect(recipient2)
        .createRecipientRequest("Patient_David", "Kidney", "O+", "Second kidney request");
    });

    it("Should reject allocation if donor or recipient is not approved", async function () {
      // Both are pending
      await expectRevert(
        organDonation.connect(admin).createAllocation(1, 1, "Demo allocation notes"),
        "OrganDonation: donor must be in Approved state"
      );

      // Approve donor only
      await organDonation.connect(admin).updateDonorStatus(1, 1);
      await expectRevert(
        organDonation.connect(admin).createAllocation(1, 1, "Demo allocation notes"),
        "OrganDonation: request must be in Approved state"
      );
    });

    it("Should reject allocation if organ types do not match", async function () {
      // Approve donor 2 (Liver) and request 1 (Kidney)
      await organDonation.connect(admin).updateDonorStatus(2, 1);
      await organDonation.connect(admin).updateRecipientRequestStatus(1, 1);

      await expectRevert(
        organDonation.connect(admin).createAllocation(2, 1, "Mismatch organ demo"),
        "OrganDonation: organ types do not match"
      );
    });

    it("Should successfully create allocation when donor and request are approved", async function () {
      await organDonation.connect(admin).updateDonorStatus(1, 1);
      await organDonation.connect(admin).updateRecipientRequestStatus(1, 1);

      const tx = await organDonation
        .connect(admin)
        .createAllocation(1, 1, "Demonstration matching approved");
      await tx.wait();

      expect(await organDonation.allocationCount()).to.equal(1n);

      const alloc = await organDonation.allocations(1);
      expect(alloc.id).to.equal(1n);
      expect(alloc.donorId).to.equal(1n);
      expect(alloc.requestId).to.equal(1n);
      expect(alloc.status).to.equal(0n); // Active
      expect(alloc.notes).to.equal("Demonstration matching approved");

      const donor = await organDonation.donors(1);
      expect(donor.isAllocated).to.equal(true);

      const req = await organDonation.recipientRequests(1);
      expect(req.status).to.equal(3n); // Allocated
      expect(req.allocatedDonorId).to.equal(1n);
    });

    it("Should prevent duplicate/conflicting active allocations for the same donor", async function () {
      await organDonation.connect(admin).updateDonorStatus(1, 1);
      await organDonation.connect(admin).updateRecipientRequestStatus(1, 1);
      await organDonation.connect(admin).updateRecipientRequestStatus(2, 1);

      // Allocate donor 1 to request 1
      await organDonation.connect(admin).createAllocation(1, 1, "First allocation");

      // Attempt allocating same donor 1 to request 2
      await expectRevert(
        organDonation.connect(admin).createAllocation(1, 2, "Conflicting allocation attempt"),
        "OrganDonation: donor is already in an active or completed allocation"
      );
    });

    it("Should prevent modifying status of an actively allocated donor", async function () {
      await organDonation.connect(admin).updateDonorStatus(1, 1);
      await organDonation.connect(admin).updateRecipientRequestStatus(1, 1);
      await organDonation.connect(admin).createAllocation(1, 1, "Active allocation");

      await expectRevert(
        organDonation.connect(admin).updateDonorStatus(1, 2),
        "OrganDonation: cannot modify status of an allocated donor"
      );
    });

    it("Should allow completing an active allocation", async function () {
      await organDonation.connect(admin).updateDonorStatus(1, 1);
      await organDonation.connect(admin).updateRecipientRequestStatus(1, 1);
      await organDonation.connect(admin).createAllocation(1, 1, "Pre-surgery allocation");

      // Complete allocation
      await organDonation.connect(admin).updateAllocationStatus(1, 1); // 1 = Completed

      const alloc = await organDonation.allocations(1);
      expect(alloc.status).to.equal(1n); // Completed

      const req = await organDonation.recipientRequests(1);
      expect(req.status).to.equal(4n); // Completed

      const donor = await organDonation.donors(1);
      expect(donor.isAllocated).to.equal(true);
    });

    it("Should allow cancelling an allocation and releasing donor/request back to approved pool", async function () {
      await organDonation.connect(admin).updateDonorStatus(1, 1);
      await organDonation.connect(admin).updateRecipientRequestStatus(1, 1);
      await organDonation.connect(admin).createAllocation(1, 1, "Initial allocation");

      // Cancel allocation
      await organDonation.connect(admin).updateAllocationStatus(1, 2); // 2 = Cancelled

      const alloc = await organDonation.allocations(1);
      expect(alloc.status).to.equal(2n); // Cancelled

      const req = await organDonation.recipientRequests(1);
      expect(req.status).to.equal(1n); // Reverted back to Approved
      expect(req.allocatedDonorId).to.equal(0n);

      const donor = await organDonation.donors(1);
      expect(donor.isAllocated).to.equal(false); // Released back to available

      // Now donor 1 can be allocated to request 2!
      await organDonation.connect(admin).updateRecipientRequestStatus(2, 1);
      await organDonation.connect(admin).createAllocation(1, 2, "Reallocated to request 2");

      const newAlloc = await organDonation.allocations(2);
      expect(newAlloc.id).to.equal(2n);
      expect(newAlloc.donorId).to.equal(1n);
      expect(newAlloc.requestId).to.equal(2n);
    });
  });

  describe("System Counts and Aggregations", function () {
    it("Should accurately compute system statistics", async function () {
      await organDonation.connect(donor1).registerDonor("Alice", "Kidney", "O+");
      await organDonation.connect(donor2).registerDonor("Bob", "Liver", "A+");
      await organDonation.connect(recipient1).createRecipientRequest("Charlie", "Kidney", "O+", "Req 1");
      await organDonation.connect(recipient2).createRecipientRequest("David", "Liver", "A+", "Req 2");

      let counts = await organDonation.getSystemCounts();
      expect(counts.totalDonors).to.equal(2n);
      expect(counts.totalRequests).to.equal(2n);
      expect(counts.approvedDonors).to.equal(0n);
      expect(counts.approvedRequests).to.equal(0n);
      expect(counts.activeAllocations).to.equal(0n);

      // Approve 1 donor and 1 request
      await organDonation.connect(admin).updateDonorStatus(1, 1);
      await organDonation.connect(admin).updateRecipientRequestStatus(1, 1);

      counts = await organDonation.getSystemCounts();
      expect(counts.approvedDonors).to.equal(1n);
      expect(counts.approvedRequests).to.equal(1n);

      // Create allocation
      await organDonation.connect(admin).createAllocation(1, 1, "System demo");

      counts = await organDonation.getSystemCounts();
      expect(counts.activeAllocations).to.equal(1n);
      // Once allocated, donor is no longer in the "available approved" pool
      expect(counts.approvedDonors).to.equal(0n);
    });

    it("Should retrieve all records via list getters", async function () {
      await organDonation.connect(donor1).registerDonor("Alice", "Kidney", "O+");
      await organDonation.connect(recipient1).createRecipientRequest("Charlie", "Kidney", "O+", "Req 1");

      const donors = await organDonation.getAllDonors();
      const requests = await organDonation.getAllRequests();
      const allocations = await organDonation.getAllAllocations();

      expect(donors.length).to.equal(1);
      expect(requests.length).to.equal(1);
      expect(allocations.length).to.equal(0);
    });
  });
});
