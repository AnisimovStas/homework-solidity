import hre, { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { getAccountBalance, setAccountBalance } from "./utils";


describe("JohnnyToken", () => {

    async function deployJohnnyTokenContractFixture() {
        const [owner, user] = await hre.ethers.getSigners();
        const JohnnyToken = await hre.ethers.getContractFactory("JohnnyToken");
        const johnnyToken = await JohnnyToken.deploy(owner.address);

        return { johnnyToken, owner, user };
    }


    describe("Deployment", () => {
        it("Should be deployed with correct init data", async () => {
            const { johnnyToken } = await loadFixture(deployJohnnyTokenContractFixture);

            expect(await johnnyToken.getAddress).exist
            expect(await johnnyToken.getMintPrice()).equal(ethers.parseEther("0.0001"))
        })

    });

    describe("safeMint", () => {
        it("Should mint new token for any user", async () => {
            const { johnnyToken, user } = await loadFixture(deployJohnnyTokenContractFixture);
            await setAccountBalance(user.address, "1.0");
            await johnnyToken.connect(user).safeMint(user.address, 1, "exampe.com", { value: ethers.parseEther("0.0001") });

            expect(await johnnyToken.balanceOf(user.address)).equals(1);
            expect(await johnnyToken.ownerOf(1)).equals(user.address);
        })
        it("Should throw NotEnoughFunds for zero value msg", async () => {
            const { johnnyToken, user } = await loadFixture(deployJohnnyTokenContractFixture);
            await expect(
                johnnyToken.connect(user).safeMint(user.address, 1, "exampe.com")
            ).to.be.rejectedWith(/NotEnoughFunds/i)
        })
        it("Should throw NotEnoughFunds after changing price", async () => {
            const { johnnyToken, owner, user } = await loadFixture(deployJohnnyTokenContractFixture);
            await johnnyToken.connect(owner).changeMintPrice(ethers.parseEther("1.0"))
            await expect(
                johnnyToken.connect(user).safeMint(user.address, 1, "exampe.com")
            ).to.be.rejectedWith(/NotEnoughFunds/i)
        })

    });
    describe("getMintPrice", () => {

        it("Should return correct mint price", async () => {
            const { johnnyToken } = await loadFixture(deployJohnnyTokenContractFixture);
            expect(await johnnyToken.getMintPrice()).equals(ethers.parseEther("0.0001"));

        })
        it("Should return correct mint price after changing price", async () => {
            const { johnnyToken, owner } = await loadFixture(deployJohnnyTokenContractFixture);
            await johnnyToken.connect(owner).changeMintPrice(ethers.parseEther("1.0"));
            expect(await johnnyToken.getMintPrice()).equals(ethers.parseEther("1.0"));

        })
    });

    describe("withdraw", () => {
        it("Should return mint fee to owner", async () => {
            const { johnnyToken, owner, user } = await loadFixture(deployJohnnyTokenContractFixture);
            const ownerBalanceBefore = await getAccountBalance(owner.address);
            await johnnyToken.connect(user).safeMint(user.address, 1, "exampe.com", { value: ethers.parseEther("1.0") });
            await johnnyToken.connect(owner).withdraw();
            const ownerBalanceAfter = await getAccountBalance(owner.address);
            expect(ownerBalanceBefore).lessThan(ownerBalanceAfter);
        })
        it("Should throw  NotEnoughFunds with zero balance contract", async () => {
            const { johnnyToken, owner } = await loadFixture(deployJohnnyTokenContractFixture);
            await expect(
                johnnyToken.connect(owner).withdraw()
            ).to.be.rejectedWith(/NotEnoughFunds/i)
        })
    });
    describe("tokenURI", () => {
        it("Should return tokenURI", async () => {
            const { johnnyToken, user } = await loadFixture(deployJohnnyTokenContractFixture);
            await johnnyToken.connect(user).safeMint(user.address, 1, "exampe.com", { value: ethers.parseEther("1.0") });
            expect(await johnnyToken.tokenURI(1)).equals("exampe.com")
        })

    });
    describe("supportsInterface", () => {
        it("should support ERC721 and ERC721Metadata interfaces", async function () {
            const { johnnyToken, user } = await loadFixture(deployJohnnyTokenContractFixture);


            // ERC721 interfaceId: 0x80ac58cd
            expect(await johnnyToken.supportsInterface("0x80ac58cd")).to.equal(true);

            // ERC721Metadata interfaceId: 0x5b5e139f
            expect(await johnnyToken.supportsInterface("0x5b5e139f")).to.equal(true);

            // ERC721Enumerable interfaceId: 0x780e9d63 (should be false)
            expect(await johnnyToken.supportsInterface("0x780e9d63")).to.equal(false);

            // Random interfaceId (should be false)
            expect(await johnnyToken.supportsInterface("0x12345678")).to.equal(false);
        });
    });
})