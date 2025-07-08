import hre, { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { getAccountBalance, setAccountBalance } from "./utils";
import { Wallet } from "ethers";
import { IERC20 } from "../typechain-types";


describe.only("ProxySwap", () => {

    const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';


    async function deployProxySwapContractFixture() {
        const [owner] = await hre.ethers.getSigners();

        const whaleAddress = '0x57757E3D981446D585Af0D9Ae4d7DF6D64647806';
        const whale = await hre.ethers.getImpersonatedSigner(whaleAddress);
        const ProxySwap = await hre.ethers.getContractFactory("ProxySwap");
        const WETH = await ethers.getContractAt("IERC20", WETH_ADDRESS);
        const USDC = await ethers.getContractAt("IERC20", USDC_ADDRESS);
        const proxySwap = await ProxySwap.connect(owner).deploy({
            maxFeePerGas: hre.ethers.parseUnits("50", "gwei"),
            maxPriorityFeePerGas: hre.ethers.parseUnits("2", "gwei")
        });

        return { proxySwap, owner, whale, WETH, USDC };
    }


    it("Should be deployed with correct init data", async () => {
        const { proxySwap } = await loadFixture(deployProxySwapContractFixture);

        expect(proxySwap.getAddress).exist
        expect(await proxySwap.getProxyFee()).equal("2")
    })
    it("should swapExactInput", async () => {
        const { proxySwap, owner, whale, WETH, USDC } = await loadFixture(deployProxySwapContractFixture);
        const WETHbalanceBefore = await WETH.balanceOf(whale.address);
        const USDCbalanceBefore = await USDC.balanceOf(whale.address);
        const profitBefore = await proxySwap.connect(owner).getProfit(WETH.getAddress());


        // Даю 3000$, хочу получить минимум 1 ETH на выходе
        const amountOutMin = ethers.parseEther("1");
        const amountIn = ethers.parseUnits("3000", 6);

        await USDC.connect(whale).approve(proxySwap.getAddress(), amountIn);
        const tx = await proxySwap.connect(whale).swapExactInput(USDC.getAddress(), amountIn, WETH.getAddress(), amountOutMin);

        const recipient = await tx.wait();
        const event = recipient.logs
            .find(log => log?.fragment?.name === 'swapExactInputExecuted');
        const swapFee = event?.args[6];
        const actualAmountOut = event?.args[5];

        const WETHbalanceAfter = await WETH.balanceOf(whale.address);
        const USDCbalanceAfter = await USDC.balanceOf(whale.address);
        const profitAfter = await proxySwap.connect(owner).getProfit(WETH.getAddress());


        expect(WETHbalanceBefore + ethers.parseEther("1") < WETHbalanceAfter);

        // тк ETH ~2500$, а закидываю 3000$, ожидаю получить больше 1.1 ETH
        expect(actualAmountOut).greaterThanOrEqual(ethers.parseEther("1.1"));

        expect(USDCbalanceBefore > USDCbalanceAfter);
        expect(profitBefore + swapFee).eqls(profitAfter)

    })

    it("should swapExactOutput", async () => {
        const { proxySwap, owner, whale, WETH, USDC } = await loadFixture(deployProxySwapContractFixture);
        const WETHbalanceBefore = await WETH.balanceOf(whale.address);
        const USDCbalanceBefore = await USDC.balanceOf(whale.address);

        // Готов получить именно 2000$, неважно сколько ETH потребуется
        const amountInMax = ethers.parseEther("1"); // но больше 1 ETH не отдам
        const amountOut = ethers.parseUnits("2000", 6);

        const profitBefore = await proxySwap.connect(owner).getProfit(WETH.getAddress());

        await WETH.connect(whale).approve(proxySwap.getAddress(), amountInMax);
        const tx = await proxySwap.connect(whale).swapExactOutput(
            WETH.getAddress(),
            amountInMax,
            USDC.getAddress(),
            amountOut
        );
        const receipt = await tx.wait();
        const profitAfter = await proxySwap.connect(owner).getProfit(WETH.getAddress());

        const event = receipt.logs
            .find(log => log?.fragment?.name === 'swapExactOutputExecuted');


        const eventArgs = event?.args;
        const swapFee = eventArgs[6];
        const refound = event[7];
        const WETHbalanceAfter = await WETH.balanceOf(whale.address);
        const USDCbalanceAfter = await USDC.balanceOf(whale.address);

        expect(WETHbalanceBefore > WETHbalanceAfter);
        expect(USDCbalanceBefore + ethers.parseUnits("2000", 6) < USDCbalanceAfter);

        expect(profitBefore + swapFee).eq(profitAfter);
        expect(refound).equals
    })

})
