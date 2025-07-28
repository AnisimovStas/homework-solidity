// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IStakeEngine} from "./IStakeEngine.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract MockMoneyFabric is IStakeEngine, Ownable {
    struct Holder {
        address _address;
        uint256 totalAmount;
        uint256 stakedReward;
    }

    mapping(address => Holder) private holders;
    address[] private holderAddresses;
    address private immutable ASSET;
    uint256 private immutable YEARLY_INTEREST_RATE;

    event NewDeposit(address from, uint256 amount);
    event NewWithdraw(address to, uint256 amount);
    event NewReward(address to, uint256 amount);

    constructor(
        address initialOwner,
        address _asset,
        uint256 _interestRate
    ) Ownable(initialOwner) {
        ASSET = _asset;
        YEARLY_INTEREST_RATE = _interestRate;
    }

    function getAsset() external view returns (address) {
        return ASSET;
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Amount should be over zero");

        IERC20(this.getAsset()).transferFrom(msg.sender, address(this), amount);

        Holder storage holder = holders[msg.sender];
        if (holder.totalAmount == 0) {
            holderAddresses.push(msg.sender);
        }

        holder.totalAmount += amount;

        emit NewDeposit(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        Holder storage holder = holders[msg.sender];
        require(holder.totalAmount >= amount, "not enough founds");

        holder.totalAmount -= amount;
        if (holder.totalAmount == 0) {
            uint256 holderIndex = 0;
            for (uint256 i = 0; i < holderAddresses.length; i++) {
                if (holder._address == msg.sender) {
                    holderIndex = i;
                }
            }

            holderAddresses[holderIndex] = holderAddresses[
                holderAddresses.length - 1
            ];
            holderAddresses.pop();

            delete holders[msg.sender];
        }

        IERC20(this.getAsset()).transfer(msg.sender, amount);

        emit NewWithdraw(msg.sender, amount);
    }

    function balanceOf(address holder) external view returns (uint256) {
        return holders[holder].totalAmount;
    }

    function stakedFor(address holder) external view returns (uint256) {
        return holders[holder].stakedReward;
    }

    function onlyOwnerOffchainStakeIncrementCall() external onlyOwner {
        uint256 dailyInterestRate = (YEARLY_INTEREST_RATE * 1e18) / 365 / 1e18;

        for (uint256 i = 0; i < holderAddresses.length; i++) {
            address _holderAddress = holderAddresses[i];
            Holder storage holder = holders[_holderAddress];
            uint256 stakeToAdd = (holder.totalAmount * dailyInterestRate) /
                1e18;

            holder.totalAmount += stakeToAdd;
            holder.stakedReward += stakeToAdd;
        }
    }
}
