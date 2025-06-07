import hre from "hardhat";

async function main() {
    const vaultAddress = process.env.VAULT_ADDRESS || "";

    const vault = await hre.ethers.getContractAt("Vault", vaultAddress);

    await vault.withdraw();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});