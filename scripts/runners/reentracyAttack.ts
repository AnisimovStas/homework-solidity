import hre from "hardhat";

async function main() {
    const attackerAddress = process.env.ATTACKER_ADDRESS || "";;

    const attacker = await hre.ethers.getContractAt("Attacker", attackerAddress);

    await attacker.attack({ value: hre.ethers.parseUnits("100000", 9) });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});