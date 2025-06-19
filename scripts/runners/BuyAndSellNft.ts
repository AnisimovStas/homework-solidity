import hre, { ethers } from "hardhat";

async function main() {
    const contractAddress = "0xE2fCd9cef7e8107637F3e08Fc943f6d863e4Ee88"
    const account1 = process.env.OWNER_ADDRESS_ETH_NETWORK as string;
    const account2 = process.env.EVE_ADDRESS_ETH_NETWORK as string;
    const signer1 = await hre.ethers.getSigner(account1);
    const signer2 = await hre.ethers.getSigner(account2);

    const token = await hre.ethers.getContractAt("LucieToken", contractAddress);

    await token.connect(signer1).placeSellOffer(1n, ethers.parseEther("0.02"));
    console.log("sell offer placed");

    const isTokenId1OnSale = await token.connect(signer1).sellOfferBook(1n);
    console.log(`token1 price: ${isTokenId1OnSale}`);

    await token.connect(signer1).setApprovalForAll(contractAddress, true);
    console.log("approved");

    try {
        await token.connect(signer2).buyFromOffer(1n, { value: ethers.parseEther("0.03") });
    } catch (error: any) {
        console.error("Transaction failed: ", error);
        if (error?.error?.message) {
            console.error("Revert reason: ", error.error.message);
        }
    }
    // await token.connect(signer1).placeSellOffer(1n, ethers.parseEther("0.02"));
    // await token.connect(signer2).buyFromOffer(1n, { value: ethers.parseEther("0.02") });
    // await token.connect(signer2).placeSellOffer(1n, ethers.parseEther("0.02"));
    // await token.connect(signer1).buyFromOffer(1n, { value: ethers.parseEther("0.02") });

    // await token.connect(signer1).placeSellOffer(2n, ethers.parseEther("0.02"));
    // await token.connect(signer2).buyFromOffer(2n, { value: ethers.parseEther("0.03") });

    // await token.connect(signer1).placeSellOffer(3n, ethers.parseEther("0.02"));
    // await token.connect(signer2).buyFromOffer(3n, { value: ethers.parseEther("0.03") });

    // await token.connect(signer1).placeSellOffer(4n, ethers.parseEther("0.02"));
    // await token.connect(signer2).buyFromOffer(4n, { value: ethers.parseEther("0.03") });

    // await token.connect(signer1).placeSellOffer(4n, ethers.parseEther("0.02"));
    // await token.connect(signer2).buyFromOffer(4n, { value: ethers.parseEther("0.03") });

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});