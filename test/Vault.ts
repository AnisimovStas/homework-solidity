import hre from "hardhat";
import {loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {expect} from "chai";
import {getAccountBalance, setAccountBalance} from "./utils";


describe("Vault", () => {

    async function deployVaultContractFixture() {
        const [owner, user] = await hre.ethers.getSigners();

        const Vault = await hre.ethers.getContractFactory("Vault");
        const vault = await Vault.deploy();

        return {vault, owner, user};
    }

    describe("Deployment", () => {
    });
    describe("Donate", () => {
        it("should write donates to mapping", async () => {
            const {vault, user} = await loadFixture(deployVaultContractFixture);
            await vault.connect(user).donate({value: hre.ethers.parseEther("1.0")});
            const donated = await vault.donates(user.address);
            expect(donated.totalAmount).to.equal(hre.ethers.parseEther("1.0"));
        })

        it("shouldn't receive more that user balance", async () => {
                const {vault, user} = await loadFixture(deployVaultContractFixture);
                await setAccountBalance(user.address, "0.5");
                await expect(
                    vault.connect(user).donate({value: hre.ethers.parseEther("1.0")})
                ).to.be.rejectedWith(/sender doesn't have enough funds/i);
            }
        )
        it("shouldn't increase initial amount on not first donation", async () => {
            const {vault, user} = await loadFixture(deployVaultContractFixture);
            await vault.connect(user).donate({value: hre.ethers.parseEther("1.0")});
            await vault.connect(user).donate({value: hre.ethers.parseEther("1.0")});
            const donated = await vault.donates(user.address);
            expect(donated.totalAmount).to.not.equal(donated.initialAmount);
        });
        it("shouldn't accept 0 value donations", async () => {
            const {vault, user} = await loadFixture(deployVaultContractFixture);
            await expect(
                vault.connect(user).donate({value: hre.ethers.parseEther("0.0")})
            ).to.be.rejectedWith(/nothing to donate/i);
        });
    });
    describe("Refund", () => {
        it("should refund donated amount to user", async () => {
            const {vault, user} = await loadFixture(deployVaultContractFixture);
            await vault.connect(user).donate({value: hre.ethers.parseEther("1.0")})
            const balanceBeforeRefund = await getAccountBalance(user.address);

            await vault.connect(user).refund();
            const balanceAfterRefund = await getAccountBalance(user.address);

            expect(balanceBeforeRefund).to.be.not.equal(balanceAfterRefund);
        })
        it("should refund only initial amount", async () => {
            const {vault, user} = await loadFixture(deployVaultContractFixture);
            await vault.connect(user).donate({value: hre.ethers.parseEther("1.0")})
            await vault.connect(user).donate({value: hre.ethers.parseEther("1.0")})
            await vault.connect(user).refund();

            const userDonation = await vault.donates(user.address);

            expect(userDonation.totalAmount).to.equal(userDonation.initialAmount)
        });
        it("shouldn't allow refund 0 value donations", async () => {
            const {vault, user} = await loadFixture(deployVaultContractFixture);
            await expect(
                vault.connect(user).refund()
            ).to.be.rejectedWith(/nothing to refund/i);
        });
        it("should refund only once", async () => {
            const {vault, user} = await loadFixture(deployVaultContractFixture);
            await vault.connect(user).donate({value: hre.ethers.parseEther("1.0")})
            await vault.connect(user).refund()
            await expect(
                vault.connect(user).refund()
            ).to.be.rejectedWith(/already refunded/i);
        });
    });


})