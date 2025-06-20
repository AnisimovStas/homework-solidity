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

export async function waitForNextBlock() {
    return new Promise<number>((resolve) => {
        hre.ethers.provider.once("block", (blockNumber: number) => {
            resolve(blockNumber);
        });
    });
}

export function generateRandomPrice(min = 0.0001, max = 0.1): string {
    const randomValue = Math.random() * (max - min) + min;
    // Округляем до 6 знаков после запятой
    return randomValue.toFixed(6);
}

