import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ContractTransactionReceipt } from "ethers/lib.commonjs/contract/wrappers";
import { IERC20 } from "../../typechain-types";
import hre, { ethers } from "hardhat";

describe.only("TradableNFT", () => {

    const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const GNO_ADDRESS = '0x6810e776880C02933D47DB1b9fc05908e5386b96';
    const userWithUSDC = '0x57757E3D981446D585Af0D9Ae4d7DF6D64647806';


    async function deployContractFixture() {
        const user = await ethers.getImpersonatedSigner(userWithUSDC);

        const MockAggregator = await ethers.getContractFactory("MockV3AggregatorV3");
        const mockAggregator = await MockAggregator.deploy();

        const TradableNFT = await hre.ethers.getContractFactory("TradableNFT");
        const tradableNFT = await TradableNFT.deploy(await mockAggregator.getAddress());
        const USDC = await ethers.getContractAt("IERC20", USDC_ADDRESS);
        const GNO = await ethers.getContractAt("IERC20", GNO_ADDRESS);

        return { tradableNFT, user, USDC, GNO };
    }

    it("deployed", async () => {
        const { tradableNFT, user } = await loadFixture(deployContractFixture);

        const balance = await tradableNFT.balanceOf(user);
        expect(balance).equals(0)
    })

    it("мок корректно отрабатывает", async () => {
        const { tradableNFT } = await loadFixture(deployContractFixture);

        expect(await tradableNFT.getLatestPrice()).to.be.equals(ethers.parseUnits("2500", 6));
    })

    it("Можно купить за ETH", async () => {
        const { tradableNFT, user } = await loadFixture(deployContractFixture);

        await tradableNFT.connect(user).buyNative({ value: ethers.parseEther("0.1") })
        const balance = await tradableNFT.balanceOf(user);
        expect(balance).equals(1)
    })
    it("При покупке за ETH минимальная ценна - 10$", async () => {
        const { tradableNFT, user } = await loadFixture(deployContractFixture);
        await expect(tradableNFT.connect(user).buyNative({ value: ethers.parseEther("0.000000001") })).to.be.revertedWithCustomError(tradableNFT, "NotEnoughFounds")
    })
    it("При покупке за ETH, если отправили ETH свыше 10$ остальное рефаундится", async () => {
        const { tradableNFT, user } = await loadFixture(deployContractFixture);
        await expect(tradableNFT.connect(user).buyNative({ value: ethers.parseEther("10") })).to.emit(tradableNFT, "newRefound")
            .withArgs(user.address, (amount: bigint) => amount >= ethers.parseEther("9"));
    })
    it("Можно купить за USDC", async () => {
        const { tradableNFT, user, USDC } = await loadFixture(deployContractFixture);

        await USDC.connect(user).approve(await tradableNFT.getAddress(), ethers.parseUnits("10", 6))
        await tradableNFT.connect(user).buy();
        const balance = await tradableNFT.balanceOf(user);

        expect(balance).equals(1)
    })
    it("При покупке за USDC списывается ровно 10$", async () => {
        const { tradableNFT, user, USDC } = await loadFixture(deployContractFixture);
        await USDC.connect(user).approve(await tradableNFT.getAddress(), ethers.parseUnits("10", 6))
        const balanceBefore = await USDC.connect(user).balanceOf(user);
        await tradableNFT.connect(user).buy();

        const balanceAfter = await USDC.connect(user).balanceOf(user);
        expect(balanceBefore).to.be.greaterThan(balanceAfter);
        expect(balanceBefore - balanceAfter).to.be.equals(ethers.parseUnits("10", 6));
    })
});