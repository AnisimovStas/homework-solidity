// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const LearnTokenModule = buildModule("LearnTokenModule", (m) => {

    const owner: string = process.env.OWNER_ADDRESS_ETH_NETWORK as string;
    const name = "Learn token";
    const symbol = "LRT";
    const initialSupplyPerUser = 100_000;
    const stakeholders: string[] = [process.env.OWNER_ADDRESS_ETH_NETWORK as string, process.env.EVE_ADDRESS_ETH_NETWORK as string]
    const learnToken = m.contract("LearnToken", [owner, name, symbol, initialSupplyPerUser, stakeholders]);

    return { learnToken };
});

export default LearnTokenModule;
