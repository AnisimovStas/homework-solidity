import hre, { ethers } from "hardhat";

async function main() {
    const contractAddress = "0xE2fCd9cef7e8107637F3e08Fc943f6d863e4Ee88"
    const owner = process.env.OWNER_ADDRESS_ETH_NETWORK as string;

    const johnnyToken = await hre.ethers.getContractAt("LucieToken", contractAddress);

    await johnnyToken.safeMint(owner, 1, "https://brown-accepted-mastodon-617.mypinata.cloud/ipfs/bafybeicnqfjwhampv5vshdwuzoavmeb342mzxncvtjvqhlq23u55nbf2nq/1.json", { value: ethers.parseEther("0.0001") });
    await johnnyToken.safeMint(owner, 2, "https://brown-accepted-mastodon-617.mypinata.cloud/ipfs/bafybeicnqfjwhampv5vshdwuzoavmeb342mzxncvtjvqhlq23u55nbf2nq/2.json", { value: ethers.parseEther("0.0001") });
    await johnnyToken.safeMint(owner, 3, "https://brown-accepted-mastodon-617.mypinata.cloud/ipfs/bafybeicnqfjwhampv5vshdwuzoavmeb342mzxncvtjvqhlq23u55nbf2nq/3.json", { value: ethers.parseEther("0.0001") });
    await johnnyToken.safeMint(owner, 4, "https://brown-accepted-mastodon-617.mypinata.cloud/ipfs/bafybeicnqfjwhampv5vshdwuzoavmeb342mzxncvtjvqhlq23u55nbf2nq/4.json", { value: ethers.parseEther("0.0001") });

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});