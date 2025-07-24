// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const TradableNFTModule = buildModule("TradableNFTV5Module", (m) => {

    const owner: string = process.env.OWNER_ADDRESS_ETH_NETWORK as string;

    // ETH / USD Sepolia (ETH/USDC нет на тестнете)
    const aggregatorAddress = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
    const USDC_testnet = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
    const TradableNFT = m.contract("TradableNFT", [aggregatorAddress, USDC_testnet]);

    return { TradableNFT };
});

export default TradableNFTModule;
