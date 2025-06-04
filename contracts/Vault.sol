// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;


contract Vault {
    struct Donation {
        uint initialAmount;
        uint totalAmount;
        bool isRefunded;
    }

    mapping(address => Donation) public donates;
    constructor(){

    }

    function donate() payable external {
        require(msg.value > 0, "nothing to donate");
        donates[msg.sender].totalAmount += msg.value;
        if (donates[msg.sender].initialAmount == 0) {
            donates[msg.sender].initialAmount = msg.value;
        }
    }

    function refund() external {
        require(donates[msg.sender].initialAmount > 0, "nothing to refund");
        require(donates[msg.sender].isRefunded == false, "already refunded");

        donates[msg.sender].isRefunded = true;
        uint refundAmount = donates[msg.sender].totalAmount - donates[msg.sender].initialAmount;

        donates[msg.sender].totalAmount -= refundAmount;
        payable(msg.sender).transfer(refundAmount);
    }
}
