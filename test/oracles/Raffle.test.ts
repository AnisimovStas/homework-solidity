import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { IERC20 } from "../../typechain-types";
import hre, { ethers } from "hardhat";
describe.only("Raffle", () => {


    const useradr1 = '0x57757E3D981446D585Af0D9Ae4d7DF6D64647806';
    const useradr2 = '0x8664720b49bdF66dc8dD48616C5395C95D16C47b';
    const useradr3 = '0x9430801EBAf509Ad49202aaBC5F5Bc6fd8A3dAf8';
    const useradr4 = '0x56Eddb7aa87536c09CCc2793473599fD21A8b17F';
    const useradr5 = '0x28C6c06298d514Db089934071355E5743bf21d60';



    async function deployRaffleContractFixture() {
        const user1 = await ethers.getImpersonatedSigner(useradr1);
        const user2 = await ethers.getImpersonatedSigner(useradr2);
        const user3 = await ethers.getImpersonatedSigner(useradr3);
        const user4 = await ethers.getImpersonatedSigner(useradr4);
        const user5 = await ethers.getImpersonatedSigner(useradr5);


        const linkHolder = await ethers.getImpersonatedSigner("0xF977814e90dA44bFA03b6295A0616a897441aceC");

        const VRFCoordinatorV2MockFactory = await ethers.getContractFactory("MockVRFCoordinatorMock");
        const vrfCoordinatorV2Mock = await VRFCoordinatorV2MockFactory.deploy();
        await vrfCoordinatorV2Mock.waitForDeployment();

        const tx = await vrfCoordinatorV2Mock.connect(linkHolder).createSubscription();
        const recipient = await tx.wait();

        const event = recipient?.logs.map(log => vrfCoordinatorV2Mock.interface.parseLog(log))[0];
        const subId = event?.args[0];

        await vrfCoordinatorV2Mock.connect(linkHolder).fundSubscription(subId, ethers.parseEther("10"));

        const Raffle = await ethers.getContractFactory("Raffle");
        const raffle = await Raffle.deploy(
            await vrfCoordinatorV2Mock.getAddress(),
            subId,
            "0x8077df514608a09f83e4e8d300645594e5d7234665448ba83f51a50f842bd3d9" // keyHash
        );
        await raffle.waitForDeployment();
        // Добавляем consumer
        await vrfCoordinatorV2Mock.connect(linkHolder).addConsumer(subId, await raffle.getAddress());

        return { raffle, vrfCoordinatorV2Mock, subId, user1, user2, user3, user4, user5 };
    }




    it("Для участия пользователь должен внести 0.001ETH", async () => {
        const { raffle, user1 } = await loadFixture(deployRaffleContractFixture);


        console.log(await ethers.provider.getBalance(user1));


        await raffle.connect(user1).participate({ value: ethers.parseEther("0.001") });

        const participators = await raffle.getParticipators();

        expect(participators[0]).to.be.equals(user1.address);

    });
    it("Пользователь не может внести меньше 0.001ETH", async () => {
        const { raffle, user1 } = await loadFixture(deployRaffleContractFixture);

        await expect(raffle.connect(user1).participate({ value: ethers.parseEther("0.00001") })).to.be.revertedWithCustomError(raffle, "NotEnoughFounds")
    });
    it("Сумма свыше 0.001ETH будет отправлена обратно пользователю", async () => {
        const { raffle, user1 } = await loadFixture(deployRaffleContractFixture);

        await expect(raffle.connect(user1).participate({ value: ethers.parseEther("1") })).to.emit(raffle, "NewRefund").withArgs(user1.address, ethers.parseEther("0.999"));



    });
    it("Когда количество участников достигает 5, начинается определение победителя, который получает х5", async () => {
        const { raffle, vrfCoordinatorV2Mock, user1, user2, user3, user4, user5 } = await loadFixture(deployRaffleContractFixture);
        await raffle.connect(user1).participate({ value: ethers.parseEther("0.001") });
        await raffle.connect(user2).participate({ value: ethers.parseEther("0.001") });
        await raffle.connect(user3).participate({ value: ethers.parseEther("0.001") });
        await raffle.connect(user4).participate({ value: ethers.parseEther("0.001") });
        await raffle.connect(user5).participate({ value: ethers.parseEther("0.001") });

        const tx = await vrfCoordinatorV2Mock.fulfillRandomWords(1, await raffle.getAddress());
        const recipient = await tx.wait();

        const event = recipient?.logs.map(log => raffle.interface.parseLog(log))[0];
        const expectedPrice = ethers.parseEther("0.005");

        expect(event?.name).to.be.equals("WinnerSelected");
        expect(event?.args[1]).to.be.equals(expectedPrice);
    })

    it("После проведенного розыгрыша, новое участие в контракте ресетит розыгрыш", async () => {
        const { raffle, vrfCoordinatorV2Mock, user1, user2, user3, user4, user5 } = await loadFixture(deployRaffleContractFixture);
        await raffle.connect(user1).participate({ value: ethers.parseEther("0.001") });
        await raffle.connect(user2).participate({ value: ethers.parseEther("0.001") });
        await raffle.connect(user3).participate({ value: ethers.parseEther("0.001") });
        await raffle.connect(user4).participate({ value: ethers.parseEther("0.001") });
        await raffle.connect(user5).participate({ value: ethers.parseEther("0.001") })
        await vrfCoordinatorV2Mock.fulfillRandomWords(1, await raffle.getAddress());

        //new round
        await raffle.connect(user3).participate({ value: ethers.parseEther("0.001") });

        const participators = await raffle.getParticipators();

        expect(participators[0]).to.be.equals(user3.address);
        expect(participators.length).to.be.equals(1);

    })

});