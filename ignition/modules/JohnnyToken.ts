// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const JohnnyTokenModule = buildModule("JohnnyTokenModule", (m) => {

    const owner: string = process.env.OWNER_ADDRESS_ETH_NETWORK as string;

    const JohnnyToken = m.contract("JohnnyToken", [owner]);

    return { JohnnyToken };
});

export default JohnnyTokenModule;
