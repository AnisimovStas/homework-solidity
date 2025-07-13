import hre, { ethers, upgrades } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";


describe("PasswordKeeper", () => {

    async function deployPasswordKeeper() {
        const [owner, user] = await ethers.getSigners();
        const PasswordKeeper = await ethers.getContractFactory("PasswordKeeper");
        const passwordKeeper = await PasswordKeeper.deploy(owner);

        return { owner, user, passwordKeeper }
    }


    it("show password only to owner", async () => {
        const { owner, user, passwordKeeper } = await loadFixture(deployPasswordKeeper);
        expect(await passwordKeeper.connect(owner).getPassword()).to.be.equals("init");
        await expect(passwordKeeper.connect(user).getPassword()).to.be.rejectedWith(/Ownable/);
    })

    it("change password with correct signature", async () => {
        const { owner, user, passwordKeeper } = await loadFixture(deployPasswordKeeper);

        const nonce = await passwordKeeper.getNonce();
        const deadline = await getDeadline(3600);
        const signArgs = {
            executor: user.address,
            owner: owner.address,
            nonce,
            deadline
        }
        const { domain, types, value } = generateSignArguments(signArgs, await passwordKeeper.getAddress());
        const signature = await owner.signTypedData(domain, types, value);

        const newPassword = "secret1"

        await passwordKeeper.connect(user).setPassword(newPassword, signature, deadline);

        const password = await passwordKeeper.connect(owner).getPassword();
        expect(password).to.be.equals(newPassword);
    })

    it("X dont change password with incorrect signature", async () => {
        const { owner, user, passwordKeeper } = await loadFixture(deployPasswordKeeper);

        const nonce = await passwordKeeper.getNonce();
        const deadline = await getDeadline(3600);
        const signArgs = {
            executor: user.address,
            owner: user.address,
            nonce,
            deadline
        }
        const { domain, types, value } = generateSignArguments(signArgs, await passwordKeeper.getAddress());
        const signature = await owner.signTypedData(domain, types, value);

        const newPassword = "secret1"

        await expect(passwordKeeper.setPassword(newPassword, signature, deadline)
        ).to.be.revertedWith(/Invalid signature/);
    })

    it("X cant use same signature twice", async () => {
        const { owner, user, passwordKeeper } = await loadFixture(deployPasswordKeeper);

        const nonce = await passwordKeeper.getNonce();
        const deadline = await getDeadline(3600);
        const signArgs = {
            executor: user.address,
            owner: owner.address,
            nonce,
            deadline
        }
        const { domain, types, value } = generateSignArguments(signArgs, await passwordKeeper.getAddress());
        const signature = await owner.signTypedData(domain, types, value);


        const newPassword = "secret1"

        await passwordKeeper.connect(user).setPassword(newPassword, signature, deadline);
        await expect(passwordKeeper.connect(user).setPassword(newPassword, signature, deadline)).to.be.rejectedWith(/Invalid signature/);
    })

    it("X signature is invalid after deadline", async () => {
        const { owner, user, passwordKeeper } = await loadFixture(deployPasswordKeeper);

        const nonce = await passwordKeeper.getNonce();
        const deadline = await getDeadline(-3600);
        const signArgs = {
            executor: user.address,
            owner: owner.address,
            nonce,
            deadline
        }
        const { domain, types, value } = generateSignArguments(signArgs, await passwordKeeper.getAddress());
        const signature = await owner.signTypedData(domain, types, value);

        const newPassword = "secret1"

        await expect(passwordKeeper.connect(user).setPassword(newPassword, signature, deadline)).to.be.rejectedWith(/Deadline over/);
    })
    it("X cant execute with fraud deadline", async () => {
        const { owner, user, passwordKeeper } = await loadFixture(deployPasswordKeeper);

        const nonce = await passwordKeeper.getNonce();
        const deadline = await getDeadline(-3600);
        const fraudDeadline = await getDeadline(3600);
        const signArgs = {
            executor: user.address,
            owner: owner.address,
            nonce,
            deadline
        }
        const { domain, types, value } = generateSignArguments(signArgs, await passwordKeeper.getAddress());
        const signature = await owner.signTypedData(domain, types, value);

        const newPassword = "secret1"

        await expect(passwordKeeper.connect(user).setPassword(newPassword, signature, fraudDeadline)).to.be.rejectedWith(/Invalid signature/);
    })

    it("possible to get password without getter", async () => {
        const { passwordKeeper } = await loadFixture(deployPasswordKeeper);
        const address = await passwordKeeper.getAddress();
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

        //npx hardhat check
        const slot = await provider.getStorage(address, 3);
        const bytes = ethers.getBytes(slot);
        console.log(bytes);

        const filteredBytesWithDescriptor = bytes.filter(byte => byte != 0);
        console.log(filteredBytesWithDescriptor);
        const filteredBytes = filteredBytesWithDescriptor.slice(0, filteredBytesWithDescriptor.length - 1)

        const pass = new TextDecoder().decode(filteredBytes);

        expect(pass).to.equal("init");
    })

});

async function getDeadline(secondsFromNow: number): Promise<number> {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const block = await provider.getBlock("latest") as { timestamp: number };
    return block.timestamp + secondsFromNow
}

function generateSignArguments(args: any, contractAddress: string): { domain: any; types: any; value: any; } {
    const types = {
        SetPassword: [
            { name: "executor", type: "address" },
            { name: "owner", type: "address" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
        ],
    };

    const domain = {
        name: "PasswordKeeper",
        version: "1",
        chainId: 31337,
        verifyingContract: contractAddress,
    };

    const value = {
        executor: args.executor,
        owner: args.owner,
        nonce: args.nonce,
        deadline: args.deadline
    };
    return { domain, types, value };
}
