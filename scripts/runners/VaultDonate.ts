import hre from "hardhat";

async function main() {
    const vaultAddress = process.env.VAULT_ADDRESS || "";

    const vault = await hre.ethers.getContractAt("Vault", vaultAddress);

    await vault.donate({ value: hre.ethers.parseUnits("1.0", 16) });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});