// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IStakeEngine {
    function getAsset() external view returns (address);

    function deposit(uint256 amount) external;

    function withdraw(uint256 amount) external;

    function balanceOf(address holder) external view returns (uint256);

    function stakedFor(address holder) external view returns (uint256);

    function onlyOwnerOffchainStakeIncrementCall() external;
}
