import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { getAccountBalance, setAccountBalance } from "./utils";


describe.only("LearnToken", () => {

    async function deployLearnTokenContractFixture(stakeholdersCount: number) {
        let accounts = await hre.ethers.getSigners();;
        accounts = accounts.splice(0, stakeholdersCount);


        const owner = accounts.length ? accounts[0] : (await hre.ethers.getSigners())[0];
        const name = "Learn token";
        const symbol = "LRT";
        const initialSupplyPerUser = 100_000;
        const stakeholders: string[] = accounts.map(acc => acc.address);
        const LearnToken = await hre.ethers.getContractFactory("LearnToken");
        const learnToken = await LearnToken.deploy(owner.address, name, symbol, initialSupplyPerUser, stakeholders);

        return { learnToken, owner, stakeholders, accounts };
    }


    describe("Deployment", () => {
        it("Should be deployed with correct init data", async () => {
            const { learnToken } = await deployLearnTokenContractFixture(5);
            expect(await learnToken.getAddress).exist
            expect(await learnToken.name()).equal("Learn token");
            expect(await learnToken.symbol()).equal("LRT");
            const expectedInitSupply = 500_000n * 10n ** 18n;
            expect(await learnToken.totalSupply()).equal(expectedInitSupply);

        })
        it("Should set totalSupply to zero with empty stakeholders", async () => {
            const { learnToken } = await deployLearnTokenContractFixture(0);
            expect(await learnToken.totalSupply()).equals(0);
        })
        it("Should revert contract deploy that overdraft totalSupply limit", async () => {
            await expect(
                deployLearnTokenContractFixture(11)
            ).to.be.rejectedWith(/totalSupplyLimitOverDraft/i);
        })
    });

    describe("mint", () => {
        it("Should mint token at owner call", async () => {
            const { learnToken, accounts } = await deployLearnTokenContractFixture(2);
            const [owner, user] = accounts;
            await learnToken.connect(owner).mint(user, 300_000n * 10n ** 18n);
            const userBalance = await learnToken.balanceOf(user.address);
            const expectedBalance = 400_000n * 10n ** 18n;
            expect(userBalance).equals(expectedBalance)
        })
        it("Should mint token only from owner call", async () => {
            const { learnToken, accounts } = await deployLearnTokenContractFixture(2);
            const [_, user] = accounts;
            await expect(
                learnToken.connect(user).mint(user, 300_000n)
            ).to.be.rejectedWith(/OwnableUnauthorizedAccount/i);
        })
        it("Should not mint token over total supply limit", async () => {
            const { learnToken, owner } = await deployLearnTokenContractFixture(2);
            await expect(
                learnToken.connect(owner).mint(owner, 3_000_000n * 10n ** 18n)
            ).to.be.rejectedWith(/totalSupplyLimitOverDraft/i);
        })
    });


})