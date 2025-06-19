// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const LucieTokenModule = buildModule("LucieTokenV3Module", (m) => {

    const owner: string = process.env.OWNER_ADDRESS_ETH_NETWORK as string;

    const LucieToken = m.contract("LucieToken", [owner]);

    return { LucieToken };
});

export default LucieTokenModule;
