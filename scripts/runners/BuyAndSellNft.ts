import hre, { ethers } from "hardhat";
import { generateRandomPrice, waitForNextBlock } from "../../test/utils";
async function main() {
    const contractAddress = "0xE2fCd9cef7e8107637F3e08Fc943f6d863e4Ee88"
    const account1 = process.env.OWNER_ADDRESS_ETH_NETWORK as string;
    const account2 = process.env.EVE_ADDRESS_ETH_NETWORK as string;
    const signer1 = await hre.ethers.getSigner(account1);
    const signer2 = await hre.ethers.getSigner(account2);

    const token = await hre.ethers.getContractAt("LucieToken", contractAddress);

    // const currentOwners = [{ tokenId: 2, seller: signer2, buyer: signer1, price: ethers.parseEther("0.03") }]


    // await currentOwners.forEach(async (run) => {
    for (let i = 1; i < 4; i++) {
        const tokenId = i;
        const sellerAdr = await token.ownerOf(tokenId);
        const seller = await hre.ethers.getSigner(sellerAdr);
        const buyerAdr = sellerAdr == account1 ? account2 : account1;

        const buyer = await hre.ethers.getSigner(buyerAdr);
        const price = ethers.parseEther(generateRandomPrice());


        console.log(`🚀 Start selling process:Token ID: ${tokenId}Seller Address: ${sellerAdr} Buyer Address: ${buyerAdr} Price: ${price} ETH`);
        await token.connect(seller).placeSellOffer(tokenId, price);
        console.log(`✅ Sell offer placed: Token ID: ${tokenId} Price: ${price} ETH Seller: ${sellerAdr}`);

        await token.connect(seller).approve(buyer, tokenId);
        console.log(`✅ Approval granted Seller: ${sellerAdr} Buyer: ${buyerAdr} Token ID: ${tokenId}`);

        console.log("⏳ Waiting for the next block...");
        await waitForNextBlock()
        await waitForNextBlock()
        console.log("🆕 New block mined, proceeding to purchase...");
        await token.connect(buyer).buyFromOffer(tokenId, { value: price });
        console.log(`🎉 NFT transferred: Token ID: ${tokenId} From: ${sellerAdr} To: ${buyerAdr} Price Paid: ${price} ETH`);

    }

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});