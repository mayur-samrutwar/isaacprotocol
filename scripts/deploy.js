import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log("Deploying Isaac Protocol...");

    // Get signers
    const [deployer, treasuryWallet] = await ethers.getSigners();
    
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    // Deploy MockERC20 token first
    console.log("\nDeploying MockERC20 token...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const rewardToken = await MockERC20.deploy(
        "Isaac Token",
        "ISAAC",
        ethers.parseEther("1000000") // 1M tokens
    );
    await rewardToken.waitForDeployment();
    console.log("MockERC20 deployed to:", await rewardToken.getAddress());

    // Configuration parameters
    const PLATFORM_FEE_PERCENTAGE = 250; // 2.5% in basis points

    // Deploy the main contract
    console.log("\nDeploying Isaac Protocol...");
    const IsaacProtocol = await ethers.getContractFactory("IsaacProtocol");
    const isaacProtocol = await IsaacProtocol.deploy(
        await rewardToken.getAddress(),
        treasuryWallet.address,
        PLATFORM_FEE_PERCENTAGE
    );

    await isaacProtocol.waitForDeployment();

    console.log("Isaac Protocol deployed to:", await isaacProtocol.getAddress());
    console.log("Reward Token:", await rewardToken.getAddress());
    console.log("Treasury Wallet:", treasuryWallet.address);
    console.log("Platform Fee:", PLATFORM_FEE_PERCENTAGE, "basis points");

    // Verify deployment
    console.log("\nVerifying deployment...");
    const totalCompanies = await isaacProtocol.getTotalCompanies();
    const totalPrograms = await isaacProtocol.getTotalPrograms();
    const totalParticipations = await isaacProtocol.getTotalParticipations();

    console.log("Total Companies:", totalCompanies.toString());
    console.log("Total Programs:", totalPrograms.toString());
    console.log("Total Participations:", totalParticipations.toString());

    // Save deployment info to file
    const deploymentInfo = {
        network: "hardhat",
        isaacProtocol: await isaacProtocol.getAddress(),
        rewardToken: await rewardToken.getAddress(),
        treasuryWallet: treasuryWallet.address,
        deployer: deployer.address,
        platformFee: PLATFORM_FEE_PERCENTAGE,
        deploymentTime: new Date().toISOString()
    };

    const envPath = path.join(__dirname, "..", ".env.local");
    let envContent = "";
    
    // Read existing .env.local if it exists
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, "utf8");
    }

    // Add or update contract addresses
    const lines = envContent.split('\n');
    const newLines = [];
    let foundIsaacProtocol = false;
    let foundRewardToken = false;

    for (const line of lines) {
        if (line.startsWith('NEXT_PUBLIC_ISAAC_PROTOCOL_ADDRESS=')) {
            newLines.push(`NEXT_PUBLIC_ISAAC_PROTOCOL_ADDRESS=${await isaacProtocol.getAddress()}`);
            foundIsaacProtocol = true;
        } else if (line.startsWith('NEXT_PUBLIC_REWARD_TOKEN_ADDRESS=')) {
            newLines.push(`NEXT_PUBLIC_REWARD_TOKEN_ADDRESS=${await rewardToken.getAddress()}`);
            foundRewardToken = true;
        } else if (line.trim() !== '') {
            newLines.push(line);
        }
    }

    // Add new addresses if not found
    if (!foundIsaacProtocol) {
        newLines.push(`NEXT_PUBLIC_ISAAC_PROTOCOL_ADDRESS=${await isaacProtocol.getAddress()}`);
    }
    if (!foundRewardToken) {
        newLines.push(`NEXT_PUBLIC_REWARD_TOKEN_ADDRESS=${await rewardToken.getAddress()}`);
    }

    // Write back to .env.local
    fs.writeFileSync(envPath, newLines.join('\n') + '\n');

    console.log("\nContract addresses saved to .env.local:");
    console.log(`NEXT_PUBLIC_ISAAC_PROTOCOL_ADDRESS=${await isaacProtocol.getAddress()}`);
    console.log(`NEXT_PUBLIC_REWARD_TOKEN_ADDRESS=${await rewardToken.getAddress()}`);

    console.log("\nDeployment completed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
