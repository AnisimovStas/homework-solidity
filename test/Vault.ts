import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { getAccountBalance, setAccountBalance } from "./utils";


describe("Vault", () => {

    async function deployVaultContractFixture() {
        const [owner, user] = await hre.ethers.getSigners();

        const Vault = await hre.ethers.getContractFactory("Vault");
        const vault = await Vault.deploy(owner);

        return { vault, owner, user };
    }

    describe("Deployment", () => {
    });

    describe("Balance", () => {
        it("should have 0 balance on deploy", async () => {
            const { vault } = await loadFixture(deployVaultContractFixture);

            expect(await vault.getTotalContractBalance()).to.equal(hre.ethers.parseEther("0.0"));
        });

        it("should return correct balance after donation", async () => {
            const { vault, user } = await loadFixture(deployVaultContractFixture);
            await vault.connect(user).donate({ value: hre.ethers.parseEther("1.0") });
            await vault.connect(user).donate({ value: hre.ethers.parseEther("1.0") });
            await vault.connect(user).refund();
            expect(await vault.getTotalContractBalance()).to.equal(hre.ethers.parseEther("1.0"));
        });
    })

    describe("Donate", () => {
        it("should write donates to mapping", async () => {
            const { vault, user } = await loadFixture(deployVaultContractFixture);
            await vault.connect(user).donate({ value: hre.ethers.parseEther("1.0") });
            const donated = await vault.donates(user.address);
            expect(donated.totalAmount).to.equal(hre.ethers.parseEther("1.0"));
        })

        it("shouldn't receive more that user balance", async () => {
            const { vault, user } = await loadFixture(deployVaultContractFixture);
            await setAccountBalance(user.address, "0.5");
            await expect(
                vault.connect(user).donate({ value: hre.ethers.parseEther("1.0") })
            ).to.be.rejectedWith(/sender doesn't have enough funds/i);
        }
        )
        it("shouldn't increase initial amount on not first donation", async () => {
            const { vault, user } = await loadFixture(deployVaultContractFixture);
            await vault.connect(user).donate({ value: hre.ethers.parseEther("1.0") });
            await vault.connect(user).donate({ value: hre.ethers.parseEther("1.0") });
            const donated = await vault.donates(user.address);
            expect(donated.totalAmount).to.not.equal(donated.initialAmount);
        });
        it("shouldn't accept 0 value donations", async () => {
            const { vault, user } = await loadFixture(deployVaultContractFixture);
            await expect(
                vault.connect(user).donate({ value: hre.ethers.parseEther("0.0") })
            ).to.be.rejectedWith(/NothingToDonate/i);
        });
    });
    describe("Refund", () => {
        it("should refund donated amount to user", async () => {
            const { vault, user } = await loadFixture(deployVaultContractFixture);
            await vault.connect(user).donate({ value: hre.ethers.parseEther("1.0") })
            const balanceBeforeRefund = await getAccountBalance(user.address);

            await vault.connect(user).refund();
            const balanceAfterRefund = await getAccountBalance(user.address);

            expect(balanceBeforeRefund).to.be.not.equal(balanceAfterRefund);
        })
        it("should refund only initial amount", async () => {
            const { vault, user } = await loadFixture(deployVaultContractFixture);
            await vault.connect(user).donate({ value: hre.ethers.parseEther("1.0") })
            await vault.connect(user).donate({ value: hre.ethers.parseEther("1.0") })
            await vault.connect(user).refund();

            const userDonation = await vault.donates(user.address);

            expect(userDonation.totalAmount).to.equal(userDonation.initialAmount)
        });
        it("shouldn't allow refund 0 value donations", async () => {
            const { vault, user } = await loadFixture(deployVaultContractFixture);
            await expect(
                vault.connect(user).refund()
            ).to.be.rejectedWith(/NothingToRefund/i);
        });
        it("should refund only once", async () => {
            const { vault, user } = await loadFixture(deployVaultContractFixture);
            await vault.connect(user).donate({ value: hre.ethers.parseEther("1.0") })
            await vault.connect(user).refund()
            await expect(
                vault.connect(user).refund()
            ).to.be.rejectedWith(/AlreadyRefunded/i);
        });
        it("should n't refund over total contract balance", async () => {
            const { vault, owner, user } = await loadFixture(deployVaultContractFixture);
            await vault.connect(user).donate({ value: hre.ethers.parseEther("1.0") })
            await vault.connect(owner).withdraw();

            await expect(
                vault.connect(user).refund()
            ).to.be.rejectedWith(/NotEnoughtContractBalance/i);
        });
    });
    describe("Withdraw", () => {
        it("should withdraw total contract balance", async () => {
            const { vault, owner, user } = await loadFixture(deployVaultContractFixture);
            await vault.connect(user).donate({ value: hre.ethers.parseEther("1.0") });
            await vault.connect(owner).withdraw();
            const contractBalance = await vault.getTotalContractBalance();
            expect(contractBalance).to.be.equals(0);
        });
        it("shouldn't allow withdraw by not owner", async () => {
            const { vault, user } = await loadFixture(deployVaultContractFixture);
            await vault.connect(user).donate({ value: hre.ethers.parseEther("1.0") });
            await expect(vault.connect(user).withdraw()).to.be.rejected;
        });
        it("shouldn't withdraw 0 value contract balance ", async () => {
            const { vault, owner } = await loadFixture(deployVaultContractFixture);

            await expect(vault.connect(owner).withdraw()).to.be.rejectedWith(/NotEnoughtContractBalance/i)
        })
    });
    it("should allow address check donated amount", async () => {
        const { vault, user } = await loadFixture(deployVaultContractFixture);
        await vault.connect(user).donate({ value: hre.ethers.parseEther("1.0") });
        const donated = await vault.getAddressBalance(user.address);

        expect(donated).to.equal(hre.ethers.parseEther("1.0"));
    });
    // it("should allow reentrancy attack (vulnerable)", async () => {
    //     const { vault, owner } = await loadFixture(deployVaultContractFixture);
    //     const [_, __, bob, eve] = await hre.ethers.getSigners();

    //     // Bob делает пожертвование
    //     await vault.connect(bob).donate({ value: hre.ethers.parseEther("1.0") });

    //     // Деплой контракта-атаки от имени Eve~
    //     const AttackFactory = await hre.ethers.getContractFactory("Attacker", eve);
    //     const attack = await AttackFactory.deploy(vault.target); // или vault.address
    //     await attack.waitForDeployment();

    //     // Eve атакует, отправив 1 ETH
    //     await attack.connect(eve).attack({ value: hre.ethers.parseEther("1.0") });

    //     // Проверка: атака украла баланс (Attack contract получил > 1 ETH)
    //     const attackBalance = await hre.ethers.provider.getBalance(await attack.getAddress());
    //     const vaultBalance = await hre.ethers.provider.getBalance(vault.target);

    //     console.log("Attack contract balance (ETH):", hre.ethers.formatEther(attackBalance));
    //     console.log("Vault contract balance (ETH):", hre.ethers.formatEther(vaultBalance));

    //     // Attack contract должен получить как минимум 2 ETH (своё + чужое)
    //     expect(attackBalance).to.be.greaterThan(hre.ethers.parseEther("2.0"));
    //     expect(vaultBalance).to.be.lessThan(hre.ethers.parseEther("1.0"));
    // });


})