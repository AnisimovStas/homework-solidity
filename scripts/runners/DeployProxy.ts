import hre, { ethers, upgrades } from "hardhat";

async function main() {
    const LucieTokenV1 = await ethers.getContractFactory("LucieTokenV1");
    const tokenV1 = await upgrades.deployProxy(LucieTokenV1, [], {
        initializer: "initialize",
        kind: "uups",
    });
    await tokenV1.waitForDeployment();
    const LucieTokenV2 = await ethers.getContractFactory("LucieTokenV2");

    await upgrades.upgradeProxy(
        await tokenV1.getAddress(),
        LucieTokenV2,
        {
            call: { fn: "initializeV2", args: [] },
        }
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});