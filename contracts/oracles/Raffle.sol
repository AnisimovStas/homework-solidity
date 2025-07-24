// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract Raffle is VRFConsumerBaseV2Plus {
    address[] public participators;
    uint256 public participatePrice = 0.001 ether;
    uint8 constant participatorsCapacity = 5;
    bool raffleInProgress;

    uint256 public s_subscriptionId;
    bytes32 public s_keyHash;
    uint32 public callbackGasLimit = 100000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 1;
    uint256 public requestId;
    mapping(uint256 => bool) raffleResultMap;

    error NotEnoughFounds();
    error RaffleInProgress();
    error TransferFailed();
    error RaffleOver();

    event NewParticipant(address participant);
    event NewRefund(address to, uint256 amount);
    event WinnerSelected(address winner, uint256 prize);
    event RandomnessRequested(uint256 requestId);

    constructor(
        address _vrfCoordinator,
        uint256 subscriptionId,
        bytes32 keyHash
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        s_subscriptionId = subscriptionId;
        s_keyHash = keyHash;
    }

    receive() external payable {}

    function participate() external payable {
        require(!raffleInProgress, RaffleInProgress());
        require(msg.value >= participatePrice, NotEnoughFounds());
        participators.push(msg.sender);

        emit NewParticipant(msg.sender);

        uint256 refundAmount = msg.value - participatePrice;
        if (refundAmount > 0) {
            (bool sent, ) = payable(msg.sender).call{value: refundAmount}("");
            require(sent, TransferFailed());
            emit NewRefund(msg.sender, refundAmount);
        }

        if (participators.length == participatorsCapacity) {
            startRaffle();
        }
    }

    function getParticipators() public view returns (address[] memory) {
        return participators;
    }

    function startRaffle() internal {
        raffleInProgress = true;
        requestId = requestRandomWords();
        emit RandomnessRequested(requestId);
    }

    function requestRandomWords() internal returns (uint256) {
        return
            s_vrfCoordinator.requestRandomWords(
                VRFV2PlusClient.RandomWordsRequest({
                    keyHash: s_keyHash,
                    subId: s_subscriptionId,
                    requestConfirmations: requestConfirmations,
                    callbackGasLimit: callbackGasLimit,
                    numWords: numWords,
                    extraArgs: VRFV2PlusClient._argsToBytes(
                        VRFV2PlusClient.ExtraArgsV1({nativePayment: true})
                    )
                })
            );
    }

    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] calldata randomWords
    ) internal override {
        require(!raffleResultMap[_requestId], RaffleOver());
        raffleResultMap[_requestId] = true;

        uint256 winnerIndex = randomWords[0] % participatorsCapacity;
        address winner = participators[winnerIndex];
        uint256 prize = participatePrice * participatorsCapacity;

        (bool success, ) = payable(winner).call{value: prize}("");
        require(success, TransferFailed());

        emit WinnerSelected(winner, prize);
        resetRaffle();
    }

    function resetRaffle() internal {
        participators = new address[](0);

        raffleInProgress = false;
    }
}
