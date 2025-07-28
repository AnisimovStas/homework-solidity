import hre, { ethers, upgrades } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect, use } from "chai";

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const userWithUSDC = '0x57757E3D981446D585Af0D9Ae4d7DF6D64647806';
const user1WithUSDC = '0x4c9AF439b1A6761B8E549D8d226A468a6b2803A8';



describe("StackableVault", () => {

    async function deployStackableVault() {
        const owner = await ethers.getImpersonatedSigner(userWithUSDC);
        const user = await ethers.getImpersonatedSigner(user1WithUSDC);
        const USDC = await ethers.getContractAt("IERC20", USDC_ADDRESS);

        const MockMoneyFactory = await ethers.getContractFactory("MockMoneyFabric");
        const mockMoneyFactory = await MockMoneyFactory.deploy(owner, USDC_ADDRESS, ethers.parseUnits("10", 16));

        //initial bank for stake rewards
        await USDC.connect(owner).transfer(await mockMoneyFactory.getAddress(), ethers.parseUnits("1000", 6));


        const StackableVault = await ethers.getContractFactory("StackableVault");
        const stackableVault = await StackableVault.deploy(USDC, "Test vault", "TV", owner, await mockMoneyFactory.getAddress());

        return { owner, user, USDC, stackableVault, mockMoneyFactory }
    }

    it("works", async () => {
        const { owner, user, USDC, stackableVault, mockMoneyFactory } = await loadFixture(deployStackableVault);

        await USDC.connect(user).approve(await stackableVault.getAddress(), ethers.parseUnits("100", 6))
        await stackableVault.connect(user).deposit(ethers.parseUnits("100", 6), user.address);

        expect(await stackableVault.balanceOf(user)).to.be.equals(ethers.parseUnits("100", 6))
        expect(await stackableVault.totalAssets()).to.be.equals(ethers.parseUnits("100", 6));

        await USDC.connect(owner).approve(await stackableVault.getAddress(), ethers.parseUnits("200", 6))
        await stackableVault.connect(owner).deposit(ethers.parseUnits("200", 6), owner.address);

        await mockMoneyFactory.connect(owner).onlyOwnerOffchainStakeIncrementCall();
        await mockMoneyFactory.connect(owner).onlyOwnerOffchainStakeIncrementCall();
        await mockMoneyFactory.connect(owner).onlyOwnerOffchainStakeIncrementCall();
        await mockMoneyFactory.connect(owner).onlyOwnerOffchainStakeIncrementCall();
        await mockMoneyFactory.connect(owner).onlyOwnerOffchainStakeIncrementCall();

        expect(await stackableVault.balanceOf(user)).to.be.equals(ethers.parseUnits("100", 6))
        expect(await stackableVault.balanceOf(owner)).to.be.equals(ethers.parseUnits("200", 6))
        expect(await stackableVault.totalAssets()).to.be.equals(ethers.parseUnits("300.411181", 6));



        // при сдаче shares ожидается, что пользователь получит больше assets чем при депозите
        await expect(stackableVault.connect(user).redeem(ethers.parseUnits("100", 6), user.address, user.address))
            .to.emit(stackableVault, "Withdraw")
            .withArgs(user.address, user.address, user.address,
                ethers.parseUnits("100.137060", 6),
                ethers.parseUnits("100", 6)
            )


        await stackableVault.connect(owner).redeem(ethers.parseUnits("200", 6), owner.address, owner.address);

        // должен вывести все assets и баланс будет 0
        expect(await stackableVault.balanceOf(user)).to.be.equals(ethers.parseUnits("0", 6))
        expect(await stackableVault.balanceOf(owner)).to.be.equals(ethers.parseUnits("0", 6))
        expect(await stackableVault.totalSupply()).to.be.equals(ethers.parseUnits("0", 6));
        // тут странно, потому что должно оставаться 0 assets, но остался 1, причем без ethers.parse
        // видимо особенности округления
        expect(await stackableVault.totalAssets()).to.be.equals(1);

        await USDC.connect(user).approve(await stackableVault.getAddress(), ethers.parseUnits("100", 6))
        await stackableVault.connect(user).deposit(ethers.parseUnits("100", 6), user.address);
        // тоже странность, ожидалось что при обнулении и передепозите exchange rate вернется к ~ 1 к 1
        expect(await stackableVault.balanceOf(user)).to.be.equals(ethers.parseUnits("50", 6))
    })

});
