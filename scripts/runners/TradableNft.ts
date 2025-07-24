import hre, { ethers } from "hardhat";
import { IERC20 } from "../../typechain-types";

import { Wallet } from "ethers";


async function main() {
    const contractAddress = "0x0F0a3D85ca09eC7fBF6999185143528Bf3F25f88"
    const privateKey = process.env.PRIVATE_KEY as string;

    const signer = new Wallet(privateKey, ethers.provider);

    const tradableNFT = await hre.ethers.getContractAt("TradableNFT", contractAddress);


    await tradableNFT.connect(signer).buyNative({ value: ethers.parseEther("0.1") });


}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});