// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Vault is Ownable {
    error NothingToDonate();
    error NothingToRefund();
    error AlreadyRefunded();
    error NotEnoughtContractBalance();

    constructor(address initialOwner) Ownable(initialOwner) {}

    struct Donation {
        uint256 initialAmount;
        uint256 totalAmount;
        bool isRefunded;
    }

    mapping(address => Donation) public donates;
    uint256 private totalContractBalance;

    function getTotalContractBalance() external view returns (uint256) {
        return totalContractBalance;
    }

    function getAddressBalance(
        address _address
    ) external view returns (uint256) {
        return donates[_address].totalAmount;
    }

    function donate() public payable {
        if (msg.value == 0) revert NothingToDonate();
        donates[msg.sender].totalAmount += msg.value;
        totalContractBalance += msg.value;
        if (donates[msg.sender].initialAmount == 0) {
            donates[msg.sender].initialAmount = msg.value;
        }
    }

    function refund() external {
        if (donates[msg.sender].initialAmount == 0) revert NothingToRefund();
        if (donates[msg.sender].isRefunded == true) revert AlreadyRefunded();

        uint256 refundAmount = donates[msg.sender].initialAmount;

        if (refundAmount > totalContractBalance) {
            revert NotEnoughtContractBalance();
        }

        //Задеплоен контракт с уязмимостью, с кодом как в закомментированом коде ниже
        // totalContractBalance -= refundAmount;
        // payable(msg.sender).transfer(refundAmount);

        //   donates[msg.sender].isRefunded = true;
        // donates[msg.sender].totalAmount -= refundAmount;

        donates[msg.sender].isRefunded = true;
        donates[msg.sender].totalAmount -= refundAmount;

        totalContractBalance -= refundAmount;
        payable(msg.sender).transfer(refundAmount);
    }

    function withdraw() external onlyOwner {
        if (0 >= totalContractBalance) revert NotEnoughtContractBalance();

        uint256 balanceToSend = totalContractBalance;
        totalContractBalance = 0;

        payable(msg.sender).transfer(balanceToSend);
    }
}
