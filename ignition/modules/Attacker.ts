// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const AttackerModule = buildModule("AttackerV2Module", (m) => {

    const attacker = m.contract("Attacker", ["0xA66E127395E16A1788fD766a0221d76b8206DBcF"]);

    return { attacker };
});

export default AttackerModule;
