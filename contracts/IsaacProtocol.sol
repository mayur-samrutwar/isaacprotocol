// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title IsaacProtocol
 * @dev Main contract for the Isaac Protocol platform
 * @notice Manages companies, programs, user participation, and reward distribution
 */
contract IsaacProtocol is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // ============ STATE VARIABLES ============
    
    Counters.Counter private _companyIdCounter;
    Counters.Counter private _programIdCounter;
    Counters.Counter private _participationIdCounter;

    // Platform configuration
    address public rewardToken; // ERC20 token used for rewards
    uint256 public platformFeePercentage; // Platform fee (in basis points, e.g., 250 = 2.5%)
    address public treasuryWallet; // Wallet to receive platform fees

    // ============ STRUCTS ============

    /**
     * @dev Company information structure
     */
    struct Company {
        uint256 companyId;
        string name;
        string description;
        string website;
        address walletAddress;
        bool isActive;
        uint256 registrationTimestamp;
        uint256 totalProgramsCreated;
    }

    /**
     * @dev Program configuration structure
     */
    struct Program {
        uint256 programId;
        uint256 companyId;
        string title;
        string description;
        string modelUrl; // Link to the AI model
        uint256 totalRewardPool; // Total rewards allocated for this program
        uint256 remainingRewardPool; // Remaining rewards
        bool isActive;
        uint256 startTimestamp;
        uint256 endTimestamp;
        uint256 maxParticipants;
        uint256 currentParticipants;
    }

    /**
     * @dev Action configuration structure
     */
    struct Action {
        uint256 actionId;
        string name;
        string description;
        uint256 rewardPerAction; // Reward amount per successful action
        uint256 maxAttemptsPerUser; // Maximum attempts per user for this action
        bool isActive;
    }

    /**
     * @dev User participation record structure
     */
    struct Participation {
        uint256 participationId;
        uint256 programId;
        uint256 actionId;
        address userAddress;
        uint256 score; // Performance score (0-100)
        string dataUrl; // Link to stored performance data
        uint256 rewardAmount; // Calculated reward based on score
        bool isRewarded;
        uint256 participationTimestamp;
    }

    // ============ MAPPINGS ============

    mapping(uint256 => Company) public companies;
    mapping(uint256 => Program) public programs;
    mapping(uint256 => Participation) public participations;
    
    // Company ID by wallet address
    mapping(address => uint256) public companyIdByAddress;
    
    // Program actions mapping
    mapping(uint256 => mapping(uint256 => Action)) public programActions;
    
    // User participation tracking
    mapping(address => mapping(uint256 => uint256)) public userActionAttempts; // user => programId => attempts
    mapping(address => uint256[]) public userParticipations; // user => participation IDs

    // ============ EVENTS ============

    event CompanyRegistered(
        uint256 indexed companyId,
        address indexed walletAddress,
        string name
    );

    event ProgramCreated(
        uint256 indexed programId,
        uint256 indexed companyId,
        string title,
        uint256 totalRewardPool
    );

    event UserParticipated(
        uint256 indexed participationId,
        uint256 indexed programId,
        uint256 indexed actionId,
        address userAddress,
        uint256 score,
        uint256 rewardAmount
    );

    event RewardDistributed(
        uint256 indexed participationId,
        address indexed userAddress,
        uint256 amount
    );

    event PlatformFeeUpdated(uint256 newFeePercentage);
    event TreasuryWalletUpdated(address newTreasuryWallet);

    // ============ MODIFIERS ============

    modifier onlyRegisteredCompany() {
        require(companyIdByAddress[msg.sender] != 0, "IsaacProtocol: Not a registered company");
        require(companies[companyIdByAddress[msg.sender]].isActive, "IsaacProtocol: Company not active");
        _;
    }

    modifier validProgram(uint256 _programId) {
        require(_programId > 0 && _programId <= _programIdCounter.current(), "IsaacProtocol: Invalid program ID");
        require(programs[_programId].isActive, "IsaacProtocol: Program not active");
        _;
    }

    modifier programNotFull(uint256 _programId) {
        require(programs[_programId].currentParticipants < programs[_programId].maxParticipants, "IsaacProtocol: Program is full");
        _;
    }

    modifier withinProgramDuration(uint256 _programId) {
        require(
            block.timestamp >= programs[_programId].startTimestamp && 
            block.timestamp <= programs[_programId].endTimestamp,
            "IsaacProtocol: Outside program duration"
        );
        _;
    }

    // ============ CONSTRUCTOR ============

    constructor(
        address _rewardToken,
        address _treasuryWallet,
        uint256 _platformFeePercentage
    ) {
        require(_rewardToken != address(0), "IsaacProtocol: Invalid reward token address");
        require(_treasuryWallet != address(0), "IsaacProtocol: Invalid treasury wallet");
        require(_platformFeePercentage <= 1000, "IsaacProtocol: Platform fee too high"); // Max 10%

        rewardToken = _rewardToken;
        treasuryWallet = _treasuryWallet;
        platformFeePercentage = _platformFeePercentage;
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @dev Register a new company (admin only)
     * @param _name Company name
     * @param _description Company description
     * @param _website Company website URL
     * @param _walletAddress Company wallet address
     */
    function registerCompany(
        string memory _name,
        string memory _description,
        string memory _website,
        address _walletAddress
    ) external onlyOwner {
        require(_walletAddress != address(0), "IsaacProtocol: Invalid wallet address");
        require(companyIdByAddress[_walletAddress] == 0, "IsaacProtocol: Company already registered");

        _companyIdCounter.increment();
        uint256 companyId = _companyIdCounter.current();

        companies[companyId] = Company({
            companyId: companyId,
            name: _name,
            description: _description,
            website: _website,
            walletAddress: _walletAddress,
            isActive: true,
            registrationTimestamp: block.timestamp,
            totalProgramsCreated: 0
        });

        companyIdByAddress[_walletAddress] = companyId;

        emit CompanyRegistered(companyId, _walletAddress, _name);
    }

    /**
     * @dev Deactivate a company (admin only)
     * @param _companyId Company ID to deactivate
     */
    function deactivateCompany(uint256 _companyId) external onlyOwner {
        require(_companyId > 0 && _companyId <= _companyIdCounter.current(), "IsaacProtocol: Invalid company ID");
        companies[_companyId].isActive = false;
    }

    /**
     * @dev Update platform fee percentage (admin only)
     * @param _newFeePercentage New fee percentage in basis points
     */
    function updatePlatformFee(uint256 _newFeePercentage) external onlyOwner {
        require(_newFeePercentage <= 1000, "IsaacProtocol: Platform fee too high"); // Max 10%
        platformFeePercentage = _newFeePercentage;
        emit PlatformFeeUpdated(_newFeePercentage);
    }

    /**
     * @dev Update treasury wallet (admin only)
     * @param _newTreasuryWallet New treasury wallet address
     */
    function updateTreasuryWallet(address _newTreasuryWallet) external onlyOwner {
        require(_newTreasuryWallet != address(0), "IsaacProtocol: Invalid treasury wallet");
        treasuryWallet = _newTreasuryWallet;
        emit TreasuryWalletUpdated(_newTreasuryWallet);
    }

    // ============ COMPANY FUNCTIONS ============

    /**
     * @dev Create a new program (company only)
     * @param _title Program title
     * @param _description Program description
     * @param _modelUrl Link to the AI model
     * @param _actions Array of action configurations
     * @param _totalRewardPool Total reward pool for the program
     * @param _startTimestamp Program start timestamp
     * @param _endTimestamp Program end timestamp
     * @param _maxParticipants Maximum number of participants
     */
    function createProgram(
        string memory _title,
        string memory _description,
        string memory _modelUrl,
        Action[] memory _actions,
        uint256 _totalRewardPool,
        uint256 _startTimestamp,
        uint256 _endTimestamp,
        uint256 _maxParticipants
    ) external onlyRegisteredCompany nonReentrant {
        require(_totalRewardPool > 0, "IsaacProtocol: Invalid reward pool");
        require(_startTimestamp > block.timestamp, "IsaacProtocol: Invalid start timestamp");
        require(_endTimestamp > _startTimestamp, "IsaacProtocol: Invalid end timestamp");
        require(_maxParticipants > 0, "IsaacProtocol: Invalid max participants");
        require(_actions.length > 0, "IsaacProtocol: No actions provided");

        // Transfer reward tokens to contract
        IERC20(rewardToken).transferFrom(msg.sender, address(this), _totalRewardPool);

        _programIdCounter.increment();
        uint256 programId = _programIdCounter.current();
        uint256 companyId = companyIdByAddress[msg.sender];

        // Create program
        programs[programId] = Program({
            programId: programId,
            companyId: companyId,
            title: _title,
            description: _description,
            modelUrl: _modelUrl,
            totalRewardPool: _totalRewardPool,
            remainingRewardPool: _totalRewardPool,
            isActive: true,
            startTimestamp: _startTimestamp,
            endTimestamp: _endTimestamp,
            maxParticipants: _maxParticipants,
            currentParticipants: 0
        });

        // Store actions
        for (uint256 i = 0; i < _actions.length; i++) {
            programActions[programId][_actions[i].actionId] = _actions[i];
        }

        // Update company stats
        companies[companyId].totalProgramsCreated++;

        emit ProgramCreated(programId, companyId, _title, _totalRewardPool);
    }

    /**
     * @dev Deactivate a program (company only)
     * @param _programId Program ID to deactivate
     */
    function deactivateProgram(uint256 _programId) external onlyRegisteredCompany {
        require(programs[_programId].companyId == companyIdByAddress[msg.sender], "IsaacProtocol: Not program owner");
        programs[_programId].isActive = false;
    }

    // ============ USER FUNCTIONS ============

    /**
     * @dev Participate in a program action
     * @param _programId Program ID
     * @param _actionId Action ID
     * @param _score Performance score (0-100)
     * @param _dataUrl Link to performance data
     */
    function participateInProgram(
        uint256 _programId,
        uint256 _actionId,
        uint256 _score,
        string memory _dataUrl
    ) external validProgram(_programId) programNotFull(_programId) withinProgramDuration(_programId) {
        require(_score <= 100, "IsaacProtocol: Invalid score");
        require(programActions[_programId][_actionId].isActive, "IsaacProtocol: Action not active");
        
        // Check attempt limits
        uint256 currentAttempts = userActionAttempts[msg.sender][_programId];
        require(
            currentAttempts < programActions[_programId][_actionId].maxAttemptsPerUser,
            "IsaacProtocol: Max attempts exceeded"
        );

        // Calculate reward based on score
        uint256 baseReward = programActions[_programId][_actionId].rewardPerAction;
        uint256 rewardAmount = (baseReward * _score) / 100;

        // Ensure sufficient reward pool
        require(rewardAmount <= programs[_programId].remainingRewardPool, "IsaacProtocol: Insufficient reward pool");

        _participationIdCounter.increment();
        uint256 participationId = _participationIdCounter.current();

        // Create participation record
        participations[participationId] = Participation({
            participationId: participationId,
            programId: _programId,
            actionId: _actionId,
            userAddress: msg.sender,
            score: _score,
            dataUrl: _dataUrl,
            rewardAmount: rewardAmount,
            isRewarded: false,
            participationTimestamp: block.timestamp
        });

        // Update tracking
        userParticipations[msg.sender].push(participationId);
        userActionAttempts[msg.sender][_programId]++;
        programs[_programId].currentParticipants++;
        programs[_programId].remainingRewardPool -= rewardAmount;

        emit UserParticipated(participationId, _programId, _actionId, msg.sender, _score, rewardAmount);
    }

    /**
     * @dev Claim reward for participation
     * @param _participationId Participation ID
     */
    function claimReward(uint256 _participationId) external nonReentrant {
        require(_participationId > 0 && _participationId <= _participationIdCounter.current(), "IsaacProtocol: Invalid participation ID");
        
        Participation storage participation = participations[_participationId];
        require(participation.userAddress == msg.sender, "IsaacProtocol: Not your participation");
        require(!participation.isRewarded, "IsaacProtocol: Already rewarded");
        require(participation.rewardAmount > 0, "IsaacProtocol: No reward to claim");

        // Calculate platform fee
        uint256 platformFee = (participation.rewardAmount * platformFeePercentage) / 10000;
        uint256 userReward = participation.rewardAmount - platformFee;

        // Mark as rewarded
        participation.isRewarded = true;

        // Transfer rewards
        if (platformFee > 0) {
            IERC20(rewardToken).transfer(treasuryWallet, platformFee);
        }
        IERC20(rewardToken).transfer(msg.sender, userReward);

        emit RewardDistributed(_participationId, msg.sender, userReward);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Get company information
     * @param _companyId Company ID
     */
    function getCompany(uint256 _companyId) external view returns (Company memory) {
        require(_companyId > 0 && _companyId <= _companyIdCounter.current(), "IsaacProtocol: Invalid company ID");
        return companies[_companyId];
    }

    /**
     * @dev Get program information
     * @param _programId Program ID
     */
    function getProgram(uint256 _programId) external view returns (Program memory) {
        require(_programId > 0 && _programId <= _programIdCounter.current(), "IsaacProtocol: Invalid program ID");
        return programs[_programId];
    }

    /**
     * @dev Get participation information
     * @param _participationId Participation ID
     */
    function getParticipation(uint256 _participationId) external view returns (Participation memory) {
        require(_participationId > 0 && _participationId <= _participationIdCounter.current(), "IsaacProtocol: Invalid participation ID");
        return participations[_participationId];
    }

    /**
     * @dev Get user's participation history
     * @param _userAddress User address
     */
    function getUserParticipations(address _userAddress) external view returns (uint256[] memory) {
        return userParticipations[_userAddress];
    }

    /**
     * @dev Get total number of companies
     */
    function getTotalCompanies() external view returns (uint256) {
        return _companyIdCounter.current();
    }

    /**
     * @dev Get total number of programs
     */
    function getTotalPrograms() external view returns (uint256) {
        return _programIdCounter.current();
    }

    /**
     * @dev Get total number of participations
     */
    function getTotalParticipations() external view returns (uint256) {
        return _participationIdCounter.current();
    }
}
