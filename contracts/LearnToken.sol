// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LearnToken is Ownable, ERC20 {
    error totalSupplyLimitOverDraft();

    constructor(
        address initialOwner,
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address[] memory stakeholders
    ) Ownable(initialOwner) ERC20(name, symbol) {
        require(
            stakeholders.length * initialSupply * 10 ** decimals() <=
                totalSupplyLimit(),
            totalSupplyLimitOverDraft()
        );

        for (uint8 i = 0; i < stakeholders.length; i++) {
            _mint(stakeholders[i], initialSupply * 10 ** decimals());
        }
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(
            totalSupply() + amount <= totalSupplyLimit(),
            totalSupplyLimitOverDraft()
        );

        _mint(to, amount);
    }

    function totalSupplyLimit() public view returns (uint256) {
        return 1_000_000 * 10 ** decimals();
    }
}
