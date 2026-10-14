// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title OrganDonation
 * @notice Academic demonstration of a blockchain-based organ donation record and allocation management system.
 * @dev Enforces permissions on-chain. This is an educational prototype and does not perform clinical matching
 * or real-world medical allocation decisions.
 */
contract OrganDonation {
    // -------------------------------------------------------------------------
    // Enums
    // -------------------------------------------------------------------------
    enum DonorStatus {
        Pending,   // 0
        Approved,  // 1
        Rejected   // 2
    }

    enum RecipientStatus {
        Pending,   // 0
        Approved,  // 1
        Rejected,  // 2
        Allocated, // 3
        Completed  // 4
    }

    enum AllocationStatus {
        Active,    // 0
        Completed, // 1
        Cancelled  // 2
    }

    // -------------------------------------------------------------------------
    // Structs
    // -------------------------------------------------------------------------
    struct Donor {
        uint256 id;
        address donorAddress;
        string nameAlias;      // Display alias (avoiding sensitive personal data)
        string organType;      // Kidney, Liver, Heart, Lung, Cornea, Pancreas, etc.
        string bloodGroup;      // A+, A-, B+, B-, AB+, AB-, O+, O-
        DonorStatus status;
        uint256 registrationTime;
        bool isAllocated;      // True if assigned to an active or completed allocation
    }

    struct RecipientRequest {
        uint256 id;
        address recipientAddress;
        string patientAlias;   // Demo identifier / alias
        string requestedOrgan; // Required organ type
        string bloodGroup;     // For educational compatibility grouping
        string description;    // Non-sensitive brief medical notes
        RecipientStatus status;
        uint256 requestTime;
        uint256 allocatedDonorId; // 0 if unallocated
    }

    struct Allocation {
        uint256 id;
        uint256 donorId;
        uint256 requestId;
        uint256 allocationTime;
        AllocationStatus status;
        string notes;          // Administrative notes for demo trace
    }

    // -------------------------------------------------------------------------
    // State Variables
    // -------------------------------------------------------------------------
    address public admin;

    uint256 public donorCount;
    uint256 public requestCount;
    uint256 public allocationCount;

    mapping(uint256 => Donor) public donors;
    mapping(uint256 => RecipientRequest) public recipientRequests;
    mapping(uint256 => Allocation) public allocations;

    // Track active allocations to prevent conflicts
    mapping(uint256 => uint256) public donorActiveAllocation;   // donorId => allocationId (0 if none)
    mapping(uint256 => uint256) public requestActiveAllocation; // requestId => allocationId (0 if none)

    // User lookup lists
    mapping(address => uint256[]) private userDonorIds;
    mapping(address => uint256[]) private userRequestIds;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------
    event DonorRegistered(
        uint256 indexed donorId,
        address indexed donorAddress,
        string organType,
        string bloodGroup,
        uint256 timestamp
    );

    event DonorStatusUpdated(
        uint256 indexed donorId,
        DonorStatus status,
        address indexed updatedBy,
        uint256 timestamp
    );

    event RecipientRequestCreated(
        uint256 indexed requestId,
        address indexed recipientAddress,
        string requestedOrgan,
        string bloodGroup,
        uint256 timestamp
    );

    event RecipientRequestStatusUpdated(
        uint256 indexed requestId,
        RecipientStatus status,
        address indexed updatedBy,
        uint256 timestamp
    );

    event AllocationCreated(
        uint256 indexed allocationId,
        uint256 indexed donorId,
        uint256 indexed requestId,
        address admin,
        uint256 timestamp
    );

    event AllocationStatusUpdated(
        uint256 indexed allocationId,
        AllocationStatus status,
        address indexed admin,
        uint256 timestamp
    );

    event AdminTransferred(
        address indexed previousAdmin,
        address indexed newAdmin,
        uint256 timestamp
    );

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------
    modifier onlyAdmin() {
        require(msg.sender == admin, "OrganDonation: caller is not the hospital administrator");
        _;
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor() {
        admin = msg.sender;
    }

    // -------------------------------------------------------------------------
    // Donor Functions
    // -------------------------------------------------------------------------
    /**
     * @notice Registers a new organ donor record
     * @param _nameAlias Pseudonymous alias of donor
     * @param _organType Organ type being pledged
     * @param _bloodGroup Blood group for basic compatibility filtering
     */
    function registerDonor(
        string calldata _nameAlias,
        string calldata _organType,
        string calldata _bloodGroup
    ) external returns (uint256) {
        require(bytes(_nameAlias).length > 0, "OrganDonation: name alias is required");
        require(bytes(_organType).length > 0, "OrganDonation: organ type is required");
        require(bytes(_bloodGroup).length > 0, "OrganDonation: blood group is required");

        donorCount++;
        uint256 newId = donorCount;

        donors[newId] = Donor({
            id: newId,
            donorAddress: msg.sender,
            nameAlias: _nameAlias,
            organType: _organType,
            bloodGroup: _bloodGroup,
            status: DonorStatus.Pending,
            registrationTime: block.timestamp,
            isAllocated: false
        });

        userDonorIds[msg.sender].push(newId);

        emit DonorRegistered(newId, msg.sender, _organType, _bloodGroup, block.timestamp);

        return newId;
    }

    /**
     * @notice Allows hospital admin to approve or reject a donor registration
     * @param _donorId Identifier of the donor record
     * @param _newStatus Desired new status (Approved or Rejected)
     */
    function updateDonorStatus(uint256 _donorId, DonorStatus _newStatus) external onlyAdmin {
        require(_donorId > 0 && _donorId <= donorCount, "OrganDonation: invalid donor ID");
        require(
            _newStatus == DonorStatus.Approved || _newStatus == DonorStatus.Rejected,
            "OrganDonation: can only approve or reject donor"
        );

        Donor storage donor = donors[_donorId];
        require(!donor.isAllocated, "OrganDonation: cannot modify status of an allocated donor");

        donor.status = _newStatus;

        emit DonorStatusUpdated(_donorId, _newStatus, msg.sender, block.timestamp);
    }

    // -------------------------------------------------------------------------
    // Recipient Request Functions
    // -------------------------------------------------------------------------
    /**
     * @notice Creates an organ request record for a recipient
     * @param _patientAlias Pseudonymous alias of the patient
     * @param _requestedOrgan Organ needed
     * @param _bloodGroup Blood group for educational matching
     * @param _description Non-sensitive general request description
     */
    function createRecipientRequest(
        string calldata _patientAlias,
        string calldata _requestedOrgan,
        string calldata _bloodGroup,
        string calldata _description
    ) external returns (uint256) {
        require(bytes(_patientAlias).length > 0, "OrganDonation: patient alias is required");
        require(bytes(_requestedOrgan).length > 0, "OrganDonation: requested organ is required");
        require(bytes(_bloodGroup).length > 0, "OrganDonation: blood group is required");

        requestCount++;
        uint256 newId = requestCount;

        recipientRequests[newId] = RecipientRequest({
            id: newId,
            recipientAddress: msg.sender,
            patientAlias: _patientAlias,
            requestedOrgan: _requestedOrgan,
            bloodGroup: _bloodGroup,
            description: _description,
            status: RecipientStatus.Pending,
            requestTime: block.timestamp,
            allocatedDonorId: 0
        });

        userRequestIds[msg.sender].push(newId);

        emit RecipientRequestCreated(newId, msg.sender, _requestedOrgan, _bloodGroup, block.timestamp);

        return newId;
    }

    /**
     * @notice Allows hospital admin to approve or reject a recipient request
     * @param _requestId Identifier of the recipient request
     * @param _newStatus Desired new status (Approved or Rejected)
     */
    function updateRecipientRequestStatus(uint256 _requestId, RecipientStatus _newStatus) external onlyAdmin {
        require(_requestId > 0 && _requestId <= requestCount, "OrganDonation: invalid request ID");
        require(
            _newStatus == RecipientStatus.Approved || _newStatus == RecipientStatus.Rejected,
            "OrganDonation: manual updates only allow Approved or Rejected"
        );

        RecipientRequest storage req = recipientRequests[_requestId];
        require(
            req.status != RecipientStatus.Allocated && req.status != RecipientStatus.Completed,
            "OrganDonation: cannot manually alter an allocated or completed request"
        );

        req.status = _newStatus;

        emit RecipientRequestStatusUpdated(_requestId, _newStatus, msg.sender, block.timestamp);
    }

    // -------------------------------------------------------------------------
    // Allocation Management Functions
    // -------------------------------------------------------------------------
    /**
     * @notice Creates a demonstration allocation linking an approved donor to an approved request
     * @param _donorId Approved donor identifier
     * @param _requestId Approved request identifier
     * @param _notes Administrative allocation notes
     */
    function createAllocation(
        uint256 _donorId,
        uint256 _requestId,
        string calldata _notes
    ) external onlyAdmin returns (uint256) {
        require(_donorId > 0 && _donorId <= donorCount, "OrganDonation: invalid donor ID");
        require(_requestId > 0 && _requestId <= requestCount, "OrganDonation: invalid request ID");

        Donor storage donor = donors[_donorId];
        RecipientRequest storage req = recipientRequests[_requestId];

        require(donor.status == DonorStatus.Approved, "OrganDonation: donor must be in Approved state");
        require(req.status == RecipientStatus.Approved, "OrganDonation: request must be in Approved state");
        require(!donor.isAllocated, "OrganDonation: donor is already in an active or completed allocation");
        require(req.allocatedDonorId == 0, "OrganDonation: request is already allocated");
        require(donorActiveAllocation[_donorId] == 0, "OrganDonation: donor has an active allocation");
        require(requestActiveAllocation[_requestId] == 0, "OrganDonation: request has an active allocation");

        // Verify organ types match
        require(
            keccak256(bytes(donor.organType)) == keccak256(bytes(req.requestedOrgan)),
            "OrganDonation: organ types do not match"
        );

        allocationCount++;
        uint256 newAllocationId = allocationCount;

        allocations[newAllocationId] = Allocation({
            id: newAllocationId,
            donorId: _donorId,
            requestId: _requestId,
            allocationTime: block.timestamp,
            status: AllocationStatus.Active,
            notes: _notes
        });

        // Mark states
        donor.isAllocated = true;
        req.status = RecipientStatus.Allocated;
        req.allocatedDonorId = _donorId;

        donorActiveAllocation[_donorId] = newAllocationId;
        requestActiveAllocation[_requestId] = newAllocationId;

        emit AllocationCreated(newAllocationId, _donorId, _requestId, msg.sender, block.timestamp);
        emit RecipientRequestStatusUpdated(_requestId, RecipientStatus.Allocated, msg.sender, block.timestamp);

        return newAllocationId;
    }

    /**
     * @notice Updates the state of an allocation (Completed or Cancelled)
     * @param _allocationId Identifier of the allocation
     * @param _newStatus AllocationStatus.Completed or AllocationStatus.Cancelled
     */
    function updateAllocationStatus(uint256 _allocationId, AllocationStatus _newStatus) external onlyAdmin {
        require(_allocationId > 0 && _allocationId <= allocationCount, "OrganDonation: invalid allocation ID");
        require(
            _newStatus == AllocationStatus.Completed || _newStatus == AllocationStatus.Cancelled,
            "OrganDonation: allocation can only transition to Completed or Cancelled"
        );

        Allocation storage alloc = allocations[_allocationId];
        require(alloc.status == AllocationStatus.Active, "OrganDonation: allocation is not active");

        alloc.status = _newStatus;

        Donor storage donor = donors[alloc.donorId];
        RecipientRequest storage req = recipientRequests[alloc.requestId];

        if (_newStatus == AllocationStatus.Completed) {
            req.status = RecipientStatus.Completed;
            donor.isAllocated = true; // Permanently fulfilled
            emit RecipientRequestStatusUpdated(alloc.requestId, RecipientStatus.Completed, msg.sender, block.timestamp);
        } else if (_newStatus == AllocationStatus.Cancelled) {
            // Revert donor and request back to Approved pool
            donor.isAllocated = false;
            req.status = RecipientStatus.Approved;
            req.allocatedDonorId = 0;
            emit RecipientRequestStatusUpdated(alloc.requestId, RecipientStatus.Approved, msg.sender, block.timestamp);
        }

        delete donorActiveAllocation[alloc.donorId];
        delete requestActiveAllocation[alloc.requestId];

        emit AllocationStatusUpdated(_allocationId, _newStatus, msg.sender, block.timestamp);
    }

    /**
     * @notice Allows current administrator to transfer administrative authority
     * @param _newAdmin Address of the new administrator
     */
    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "OrganDonation: zero address cannot be admin");
        address oldAdmin = admin;
        admin = _newAdmin;
        emit AdminTransferred(oldAdmin, _newAdmin, block.timestamp);
    }

    // -------------------------------------------------------------------------
    // View Functions for Retrieval
    // -------------------------------------------------------------------------
    function getAllDonors() external view returns (Donor[] memory) {
        Donor[] memory list = new Donor[](donorCount);
        for (uint256 i = 1; i <= donorCount; i++) {
            list[i - 1] = donors[i];
        }
        return list;
    }

    function getAllRequests() external view returns (RecipientRequest[] memory) {
        RecipientRequest[] memory list = new RecipientRequest[](requestCount);
        for (uint256 i = 1; i <= requestCount; i++) {
            list[i - 1] = recipientRequests[i];
        }
        return list;
    }

    function getAllAllocations() external view returns (Allocation[] memory) {
        Allocation[] memory list = new Allocation[](allocationCount);
        for (uint256 i = 1; i <= allocationCount; i++) {
            list[i - 1] = allocations[i];
        }
        return list;
    }

    function getDonorsByAddress(address _addr) external view returns (Donor[] memory) {
        uint256[] memory ids = userDonorIds[_addr];
        Donor[] memory list = new Donor[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            list[i] = donors[ids[i]];
        }
        return list;
    }

    function getRequestsByAddress(address _addr) external view returns (RecipientRequest[] memory) {
        uint256[] memory ids = userRequestIds[_addr];
        RecipientRequest[] memory list = new RecipientRequest[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            list[i] = recipientRequests[ids[i]];
        }
        return list;
    }

    function getSystemCounts()
        external
        view
        returns (
            uint256 totalDonors,
            uint256 totalRequests,
            uint256 approvedDonors,
            uint256 approvedRequests,
            uint256 activeAllocations,
            uint256 completedAllocations
        )
    {
        totalDonors = donorCount;
        totalRequests = requestCount;

        for (uint256 i = 1; i <= donorCount; i++) {
            if (donors[i].status == DonorStatus.Approved && !donors[i].isAllocated) {
                approvedDonors++;
            }
        }

        for (uint256 j = 1; j <= requestCount; j++) {
            if (recipientRequests[j].status == RecipientStatus.Approved) {
                approvedRequests++;
            }
        }

        for (uint256 k = 1; k <= allocationCount; k++) {
            if (allocations[k].status == AllocationStatus.Active) {
                activeAllocations++;
            } else if (allocations[k].status == AllocationStatus.Completed) {
                completedAllocations++;
            }
        }
    }
}
