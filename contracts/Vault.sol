// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Vault is Ownable {
    error NothingToDonate();
    error NothingToRefund();
    error AlreadyRefunded();
    error NotEnoughtContractBalance();

    constructor(address initialOwner) Ownable(initialOwner) {}

    mapping(address => uint256) public donates;

    function getAddressBalance(
        address _address
    ) external view returns (uint256) {
        return donates[_address];
    }

    function donate() external payable {
        require(msg.value != 0, NothingToDonate());
        donates[msg.sender] += msg.value;
    }

    function refund() external {
        require(donates[msg.sender] != 0, NothingToRefund());
        require(
            address(this).balance >= donates[msg.sender],
            NotEnoughtContractBalance()
        );

        uint256 refundAmount = donates[msg.sender];
        donates[msg.sender] = 0;
        payable(msg.sender).transfer(refundAmount);
    }

    function withdraw() external onlyOwner {
        require(address(this).balance > 0, NotEnoughtContractBalance());

        payable(msg.sender).transfer(address(this).balance);
    }
}
