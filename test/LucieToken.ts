import hre, { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { getAccountBalance, setAccountBalance } from "./utils";


describe("LucieToken", () => {

    async function deployLucieTokenContractFixture() {
        const [owner, user] = await hre.ethers.getSigners();
        const LucieToken = await hre.ethers.getContractFactory("LucieToken");
        const lucieToken = await LucieToken.deploy(owner.address);

        return { lucieToken, owner, user };
    }


    describe("Place sell order", () => {
        it("Should place sell order", async () => {
            const { lucieToken, owner } = await loadFixture(deployLucieTokenContractFixture);

            await lucieToken.safeMint(owner, 1, "test", { value: ethers.parseEther("0.1") });

            await lucieToken.placeSellOffer(1, ethers.parseEther("1.0"))

            expect(await lucieToken.sellOfferBook(1)).equal(ethers.parseEther("1.0"));
        })
    });

    describe("Buy", () => {
        it("Should buy selling token", async () => {
            const { lucieToken, owner, user } = await loadFixture(deployLucieTokenContractFixture);

            console.log(`lucie token ${await lucieToken.getAddress()}`);
            console.log(`owner ${await owner.getAddress()}`);
            console.log(`user ${await user.getAddress()}`);

            await lucieToken.safeMint(owner, 1, "test", { value: ethers.parseEther("0.1") });

            await lucieToken.connect(owner).placeSellOffer(1, ethers.parseEther("1.0"));
            await lucieToken.connect(owner).approve(user, 1);
            await lucieToken.connect(user).buyFromOffer(1, { value: ethers.parseEther("1.0") })

            expect(await lucieToken.sellOfferBook(1)).equal(0);
        })
    });

});