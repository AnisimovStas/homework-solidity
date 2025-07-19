// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const RaffleModule = buildModule("RaffleV2Module", (m) => {

    const owner: string = process.env.OWNER_ADDRESS_ETH_NETWORK as string;

    // ETH / USD Sepolia (ETH/USDC нет на тестнете)
    const aggregatorAddress = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
    const USDC_testnet = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"

    const vrfCoordinator = "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B"
    const subscriptionId = 76482035905147946080443718857765951218106157896856620379996330619835719868147n;
    const keyHash = "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae";
    const Raffle = m.contract("Raffle", [vrfCoordinator, subscriptionId, keyHash]);

    return { Raffle };
});

export default RaffleModule; 
