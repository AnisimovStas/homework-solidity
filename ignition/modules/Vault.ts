// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const VaultModule = buildModule("VaultModule", (m) => {

    const vault = m.contract("Vault", [process.env.OWNER_ADDRESS_ETH_NETWORK as string]);

    return { vault };
});

export default VaultModule;
