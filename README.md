# Isaac Protocol Smart Contracts

A comprehensive blockchain-based platform for AI robotics training, enabling companies to create programs, users to participate, and earn rewards based on performance scores.

## Overview

Isaac Protocol is a decentralized platform that connects companies offering robotics training programs with users who want to learn and earn rewards. The platform uses smart contracts to ensure transparent, secure, and automated reward distribution based on user performance.

## Key Features

### 🏢 **Company Management**
- **Admin-controlled registration**: Only platform administrators can register new companies
- **Company profiles**: Complete company information including name, description, website, and wallet address
- **Active/inactive status**: Companies can be deactivated by administrators

### 🎯 **Program Creation**
- **Company-owned programs**: Registered companies can create training programs
- **Action-based structure**: Programs consist of multiple actions with individual reward configurations
- **Flexible scheduling**: Programs have configurable start/end times and participant limits
- **Reward pool management**: Companies fund programs with ERC20 tokens

### 👥 **User Participation**
- **Score-based rewards**: Users earn rewards based on performance scores (0-100)
- **Attempt limits**: Configurable maximum attempts per action per user
- **Data storage**: Links to external performance data for verification
- **Participation tracking**: Complete history of user activities

### 💰 **Reward Distribution**
- **Automatic calculation**: Rewards calculated based on score percentage
- **Platform fees**: Configurable platform fee (default 2.5%)
- **Secure claiming**: Users must explicitly claim their rewards
- **One-time rewards**: Prevents double-claiming

## Contract Architecture

### Main Contract: `IsaacProtocol.sol`

```solidity
contract IsaacProtocol is Ownable, ReentrancyGuard {
    // Core functionality for the entire platform
}
```

### Key Structs

#### Company
```solidity
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
```

#### Program
```solidity
struct Program {
    uint256 programId;
    uint256 companyId;
    string title;
    string description;
    string modelUrl;
    Action[] actions;
    uint256 totalRewardPool;
    uint256 remainingRewardPool;
    bool isActive;
    uint256 startTimestamp;
    uint256 endTimestamp;
    uint256 maxParticipants;
    uint256 currentParticipants;
}
```

#### Action
```solidity
struct Action {
    uint256 actionId;
    string name;
    string description;
    uint256 rewardPerAction;
    uint256 maxAttemptsPerUser;
    bool isActive;
}
```

#### Participation
```solidity
struct Participation {
    uint256 participationId;
    uint256 programId;
    uint256 actionId;
    address userAddress;
    uint256 score;
    string dataUrl;
    uint256 rewardAmount;
    bool isRewarded;
    uint256 participationTimestamp;
}
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Hardhat

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd isaac-protocol-contracts
```

2. **Install dependencies**
```bash
npm install
```

3. **Compile contracts**
```bash
npm run compile
```

4. **Run tests**
```bash
npm test
```

## Deployment

### Local Development

1. **Start local blockchain**
```bash
npm run node
```

2. **Deploy contracts**
```bash
npm run deploy:local
```

### Production Deployment

1. **Configure network settings** in `hardhat.config.js`

2. **Update deployment parameters** in `scripts/deploy.js`:
   - `REWARD_TOKEN_ADDRESS`: Address of the ERC20 reward token
   - `TREASURY_WALLET`: Wallet address for platform fees
   - `PLATFORM_FEE_PERCENTAGE`: Platform fee in basis points

3. **Deploy**
```bash
npm run deploy --network <network-name>
```

## Usage Examples

### 1. Register a Company (Admin Only)

```javascript
await isaacProtocol.registerCompany(
    "Atlas Dynamics",
    "Leading robotics company specializing in industrial automation",
    "https://atlasdynamics.com",
    companyWalletAddress
);
```

### 2. Create a Program (Company)

```javascript
const actions = [
    {
        actionId: 1,
        name: "Move Object",
        description: "Move object from point A to point B",
        rewardPerAction: ethers.utils.parseEther("10"),
        maxAttemptsPerUser: 5,
        isActive: true
    }
];

await isaacProtocol.createProgram(
    "Robotic Arm Training",
    "Learn to control robotic arms with precision",
    "https://model.atlasdynamics.com/arm-training",
    actions,
    ethers.utils.parseEther("1000"), // Total reward pool
    startTimestamp,
    endTimestamp,
    100 // Max participants
);
```

### 3. Participate in Program (User)

```javascript
await isaacProtocol.participateInProgram(
    1, // programId
    1, // actionId
    85, // score (0-100)
    "https://data.example.com/performance-data"
);
```

### 4. Claim Reward (User)

```javascript
await isaacProtocol.claimReward(participationId);
```

## Security Features

### Access Control
- **Ownable**: Only contract owner can perform administrative functions
- **Company verification**: Only registered companies can create programs
- **User verification**: Users can only claim their own rewards

### Reentrancy Protection
- **ReentrancyGuard**: Prevents reentrancy attacks on reward claiming
- **NonReentrant modifier**: Applied to critical functions

### Input Validation
- **Score validation**: Scores must be between 0-100
- **Timestamp validation**: Program durations must be valid
- **Address validation**: All addresses must be non-zero
- **Amount validation**: All amounts must be positive

### State Management
- **Atomic operations**: All state changes are atomic
- **Event emission**: All important actions emit events for transparency
- **Immutable references**: Critical data cannot be modified after creation

## Gas Optimization

### Efficient Storage
- **Packed structs**: Optimized struct layouts
- **Counter patterns**: Efficient ID generation
- **Batch operations**: Reduced transaction costs

### Optimized Functions
- **View functions**: Separate read operations
- **Batch queries**: Multiple data retrieval in single call
- **Gas-efficient loops**: Optimized iteration patterns

## Testing

The contract includes comprehensive tests covering:

- ✅ Contract deployment and initialization
- ✅ Company registration and management
- ✅ Program creation and configuration
- ✅ User participation and scoring
- ✅ Reward calculation and distribution
- ✅ Access control and security
- ✅ Edge cases and error handling

Run tests with:
```bash
npm test
```

## Events

The contract emits events for all major operations:

- `CompanyRegistered`: When a new company is registered
- `ProgramCreated`: When a program is created
- `UserParticipated`: When a user participates in a program
- `RewardDistributed`: When rewards are distributed
- `PlatformFeeUpdated`: When platform fee is updated
- `TreasuryWalletUpdated`: When treasury wallet is updated

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Support

For questions and support, please contact the Isaac Protocol team or create an issue in the repository.