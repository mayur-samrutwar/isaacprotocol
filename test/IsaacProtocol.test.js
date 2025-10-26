import { expect } from "chai";
import { ethers } from "hardhat";

describe("IsaacProtocol", function () {
    let isaacProtocol;
    let rewardToken;
    let owner;
    let company1;
    let company2;
    let user1;
    let user2;
    let treasuryWallet;

    beforeEach(async function () {
        [owner, company1, company2, user1, user2, treasuryWallet] = await ethers.getSigners();

        // Deploy mock ERC20 token
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        rewardToken = await MockERC20.deploy("Isaac Token", "ISAAC", ethers.parseEther("1000000"));
        await rewardToken.waitForDeployment();

        // Deploy IsaacProtocol
        const IsaacProtocol = await ethers.getContractFactory("IsaacProtocol");
        isaacProtocol = await IsaacProtocol.deploy(
            await rewardToken.getAddress(),
            treasuryWallet.address,
            250 // 2.5% platform fee
        );
        await isaacProtocol.waitForDeployment();

        // Transfer tokens to companies for testing
        await rewardToken.transfer(company1.address, ethers.parseEther("10000"));
        await rewardToken.transfer(company2.address, ethers.parseEther("10000"));
    });

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await isaacProtocol.owner()).to.equal(owner.address);
        });

        it("Should set the correct reward token", async function () {
            expect(await isaacProtocol.rewardToken()).to.equal(rewardToken.address);
        });

        it("Should set the correct treasury wallet", async function () {
            expect(await isaacProtocol.treasuryWallet()).to.equal(treasuryWallet.address);
        });

        it("Should set the correct platform fee", async function () {
            expect(await isaacProtocol.platformFeePercentage()).to.equal(250);
        });
    });

    describe("Company Registration", function () {
        it("Should allow owner to register a company", async function () {
            await isaacProtocol.registerCompany(
                "Test Company",
                "A test company for robotics training",
                "https://testcompany.com",
                company1.address
            );

            const company = await isaacProtocol.getCompany(1);
            expect(company.name).to.equal("Test Company");
            expect(company.walletAddress).to.equal(company1.address);
            expect(company.isActive).to.be.true;
        });

        it("Should not allow non-owner to register a company", async function () {
            await expect(
                isaacProtocol.connect(company1).registerCompany(
                    "Test Company",
                    "A test company",
                    "https://test.com",
                    company1.address
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should not allow duplicate company registration", async function () {
            await isaacProtocol.registerCompany(
                "Test Company",
                "A test company",
                "https://test.com",
                company1.address
            );

            await expect(
                isaacProtocol.registerCompany(
                    "Another Company",
                    "Another test company",
                    "https://another.com",
                    company1.address
                )
            ).to.be.revertedWith("IsaacProtocol: Company already registered");
        });
    });

    describe("Program Creation", function () {
        beforeEach(async function () {
            // Register companies first
            await isaacProtocol.registerCompany(
                "Test Company 1",
                "First test company",
                "https://test1.com",
                company1.address
            );
            await isaacProtocol.registerCompany(
                "Test Company 2",
                "Second test company",
                "https://test2.com",
                company2.address
            );
        });

        it("Should allow registered company to create a program", async function () {
            const actions = [
                {
                    actionId: 1,
                    name: "Move Object",
                    description: "Move object from point A to point B",
                    rewardPerAction: ethers.parseEther("10"),
                    maxAttemptsPerUser: 5,
                    isActive: true
                },
                {
                    actionId: 2,
                    name: "Press Button",
                    description: "Press a specific button",
                    rewardPerAction: ethers.parseEther("5"),
                    maxAttemptsPerUser: 3,
                    isActive: true
                }
            ];

            const totalRewardPool = ethers.parseEther("1000");
            const startTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
            const endTime = startTime + 86400; // 24 hours later

            // Approve token transfer
            await rewardToken.connect(company1).approve(isaacProtocol.address, totalRewardPool);

            await isaacProtocol.connect(company1).createProgram(
                "Robotics Training Program",
                "Learn to control robotic arms",
                "https://model.example.com",
                actions,
                totalRewardPool,
                startTime,
                endTime,
                100
            );

            const program = await isaacProtocol.getProgram(1);
            expect(program.title).to.equal("Robotics Training Program");
            expect(program.companyId).to.equal(1);
            expect(program.totalRewardPool).to.equal(totalRewardPool);
            expect(program.isActive).to.be.true;
        });

        it("Should not allow unregistered address to create program", async function () {
            const actions = [{
                actionId: 1,
                name: "Test Action",
                description: "Test",
                rewardPerAction: ethers.parseEther("10"),
                maxAttemptsPerUser: 5,
                isActive: true
            }];

            await expect(
                isaacProtocol.connect(user1).createProgram(
                    "Test Program",
                    "Test",
                    "https://test.com",
                    actions,
                    ethers.parseEther("100"),
                    Math.floor(Date.now() / 1000) + 3600,
                    Math.floor(Date.now() / 1000) + 86400,
                    10
                )
            ).to.be.revertedWith("IsaacProtocol: Not a registered company");
        });
    });

    describe("User Participation", function () {
        beforeEach(async function () {
            // Setup: Register company and create program
            await isaacProtocol.registerCompany(
                "Test Company",
                "Test company",
                "https://test.com",
                company1.address
            );

            const actions = [{
                actionId: 1,
                name: "Move Object",
                description: "Move object",
                rewardPerAction: ethers.parseEther("10"),
                maxAttemptsPerUser: 5,
                isActive: true
            }];

            const totalRewardPool = ethers.parseEther("1000");
            const startTime = Math.floor(Date.now() / 1000) + 1; // 1 second from now
            const endTime = startTime + 86400; // 24 hours later

            await rewardToken.connect(company1).approve(isaacProtocol.address, totalRewardPool);
            await isaacProtocol.connect(company1).createProgram(
                "Test Program",
                "Test program",
                "https://model.com",
                actions,
                totalRewardPool,
                startTime,
                endTime,
                100
            );

            // Wait for program to start
            await ethers.provider.send("evm_increaseTime", [2]);
            await ethers.provider.send("evm_mine");
        });

        it("Should allow user to participate in program", async function () {
            await isaacProtocol.connect(user1).participateInProgram(
                1, // programId
                1, // actionId
                85, // score
                "https://data.example.com"
            );

            const participation = await isaacProtocol.getParticipation(1);
            expect(participation.userAddress).to.equal(user1.address);
            expect(participation.score).to.equal(85);
            expect(participation.rewardAmount).to.equal(ethers.parseEther("8.5")); // 85% of 10 tokens
        });

        it("Should not allow participation with invalid score", async function () {
            await expect(
                isaacProtocol.connect(user1).participateInProgram(
                    1,
                    1,
                    150, // Invalid score > 100
                    "https://data.com"
                )
            ).to.be.revertedWith("IsaacProtocol: Invalid score");
        });

        it("Should not allow participation outside program duration", async function () {
            // Move time beyond program end
            await ethers.provider.send("evm_increaseTime", [86401]);
            await ethers.provider.send("evm_mine");

            await expect(
                isaacProtocol.connect(user1).participateInProgram(
                    1,
                    1,
                    85,
                    "https://data.com"
                )
            ).to.be.revertedWith("IsaacProtocol: Outside program duration");
        });
    });

    describe("Reward Distribution", function () {
        beforeEach(async function () {
            // Setup: Register company, create program, and participate
            await isaacProtocol.registerCompany(
                "Test Company",
                "Test company",
                "https://test.com",
                company1.address
            );

            const actions = [{
                actionId: 1,
                name: "Move Object",
                description: "Move object",
                rewardPerAction: ethers.parseEther("10"),
                maxAttemptsPerUser: 5,
                isActive: true
            }];

            const totalRewardPool = ethers.parseEther("1000");
            const startTime = Math.floor(Date.now() / 1000) + 1;
            const endTime = startTime + 86400;

            await rewardToken.connect(company1).approve(isaacProtocol.address, totalRewardPool);
            await isaacProtocol.connect(company1).createProgram(
                "Test Program",
                "Test program",
                "https://model.com",
                actions,
                totalRewardPool,
                startTime,
                endTime,
                100
            );

            await ethers.provider.send("evm_increaseTime", [2]);
            await ethers.provider.send("evm_mine");

            await isaacProtocol.connect(user1).participateInProgram(
                1,
                1,
                90,
                "https://data.com"
            );
        });

        it("Should allow user to claim reward", async function () {
            const initialBalance = await rewardToken.balanceOf(user1.address);
            const treasuryInitialBalance = await rewardToken.balanceOf(treasuryWallet.address);

            await isaacProtocol.connect(user1).claimReward(1);

            const finalBalance = await rewardToken.balanceOf(user1.address);
            const treasuryFinalBalance = await rewardToken.balanceOf(treasuryWallet.address);

            // User should receive 90% of 10 tokens = 9 tokens
            // Platform fee = 2.5% of 9 tokens = 0.225 tokens
            // User receives = 9 - 0.225 = 8.775 tokens
            const expectedUserReward = ethers.parseEther("8.775");
            const expectedPlatformFee = ethers.parseEther("0.225");

            expect(finalBalance.sub(initialBalance)).to.equal(expectedUserReward);
            expect(treasuryFinalBalance.sub(treasuryInitialBalance)).to.equal(expectedPlatformFee);

            const participation = await isaacProtocol.getParticipation(1);
            expect(participation.isRewarded).to.be.true;
        });

        it("Should not allow claiming reward twice", async function () {
            await isaacProtocol.connect(user1).claimReward(1);

            await expect(
                isaacProtocol.connect(user1).claimReward(1)
            ).to.be.revertedWith("IsaacProtocol: Already rewarded");
        });

        it("Should not allow other users to claim someone else's reward", async function () {
            await expect(
                isaacProtocol.connect(user2).claimReward(1)
            ).to.be.revertedWith("IsaacProtocol: Not your participation");
        });
    });

    describe("Admin Functions", function () {
        beforeEach(async function () {
            await isaacProtocol.registerCompany(
                "Test Company",
                "Test company",
                "https://test.com",
                company1.address
            );
        });

        it("Should allow owner to update platform fee", async function () {
            await isaacProtocol.updatePlatformFee(500); // 5%
            expect(await isaacProtocol.platformFeePercentage()).to.equal(500);
        });

        it("Should not allow platform fee > 10%", async function () {
            await expect(
                isaacProtocol.updatePlatformFee(1500) // 15%
            ).to.be.revertedWith("IsaacProtocol: Platform fee too high");
        });

        it("Should allow owner to update treasury wallet", async function () {
            await isaacProtocol.updateTreasuryWallet(user1.address);
            expect(await isaacProtocol.treasuryWallet()).to.equal(user1.address);
        });

        it("Should allow owner to deactivate company", async function () {
            await isaacProtocol.deactivateCompany(1);
            const company = await isaacProtocol.getCompany(1);
            expect(company.isActive).to.be.false;
        });
    });
});
