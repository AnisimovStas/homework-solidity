import hre from "hardhat";

export async function setAccountBalance(address: string, newBalanceInETH: string) {
    const hexBalance = "0x" + hre.ethers.parseEther(newBalanceInETH).toString(16);
    await hre.network.provider.send("hardhat_setBalance", [
        address,
        hexBalance,
    ]);
}

export async function getAccountBalance(address: string) {
    return await hre.ethers.provider.getBalance(address);
}

