import hre, { ethers, upgrades } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const userWithUSDC = '0x57757E3D981446D585Af0D9Ae4d7DF6D64647806';

describe("MockMoneyFabric", () => {

    async function deployMockMoneyFactory() {
        const owner = await ethers.getImpersonatedSigner(userWithUSDC);
        const USDC = await ethers.getContractAt("IERC20", USDC_ADDRESS);

        const MockMoneyFactory = await ethers.getContractFactory("MockMoneyFabric");
        const mockMoneyFactory = await MockMoneyFactory.deploy(owner, USDC_ADDRESS, ethers.parseUnits("10", 16));

        //initial bank for stake rewards
        await USDC.connect(owner).transfer(await mockMoneyFactory.getAddress(), ethers.parseUnits("1000", 6));

        return { owner, USDC, mockMoneyFactory }
    }


    it("works", async () => {
        const { owner, USDC, mockMoneyFactory } = await loadFixture(deployMockMoneyFactory);

        // able to deposit 
        await USDC.connect(owner).approve(await mockMoneyFactory.getAddress(), ethers.parseUnits("100", 6));
        await mockMoneyFactory.connect(owner).deposit(ethers.parseUnits("100", 6));


        expect(await mockMoneyFactory.balanceOf(owner)).to.be.equals(ethers.parseUnits("100", 6))
        expect(await mockMoneyFactory.stakedFor(owner)).to.be.equals(ethers.parseUnits("0", 6))

        //increate users balance
        await mockMoneyFactory.connect(owner).onlyOwnerOffchainStakeIncrementCall();
        await mockMoneyFactory.connect(owner).onlyOwnerOffchainStakeIncrementCall();
        await mockMoneyFactory.connect(owner).onlyOwnerOffchainStakeIncrementCall();
        await mockMoneyFactory.connect(owner).onlyOwnerOffchainStakeIncrementCall();

        expect(await mockMoneyFactory.balanceOf(owner)).to.be.greaterThan(ethers.parseUnits("100", 6))
        expect(await mockMoneyFactory.balanceOf(owner)).to.be.lessThan(ethers.parseUnits("101", 6))
        expect(await mockMoneyFactory.stakedFor(owner)).to.be.greaterThan(ethers.parseUnits("0", 6))

        const balance = await mockMoneyFactory.balanceOf(owner);

        //able to withdraw over initial balance
        await expect(mockMoneyFactory.connect(owner).withdraw(balance)).to.emit(mockMoneyFactory, "NewWithdraw").withArgs(owner.address, balance)

    })

});
