import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-solhint";
import "@openzeppelin/hardhat-upgrades"
import "@nomicfoundation/hardhat-verify";
import "hardhat-tracer";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-storage-layout";


import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
    solidity: "0.8.28",

    gasReporter: {
        enabled: true,
    },
    networks: {
        Sepolia: {
            url: process.env.SEPOLIA_URL || "",
            accounts: [process.env.PRIVATE_KEY as string, process.env.EVE_PRIVATE_KEY as string],
        },
        SepoliaAsEve: {
            url: process.env.SEPOLIA_URL || "",
            accounts: process.env.EVE_PRIVATE_KEY ? [process.env.EVE_PRIVATE_KEY] : [],
        },
        hardhat: {
            forking: {
                url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` || "",
                blockNumber: 22839956
            },
            initialBaseFeePerGas: 0
        },
    },
    etherscan: {
        // Your API key for Etherscan
        // Obtain one at https://etherscan.io/ 
        apiKey: process.env.ETHERSCAN_API_KEY || "",
    },
    sourcify: {
        // Disabled by default
        // Doesn't need an API key
        enabled: true
    }
};

export default config;
