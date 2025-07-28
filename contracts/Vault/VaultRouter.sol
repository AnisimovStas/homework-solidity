// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IStakeEngine} from "./IStakeEngine.sol";

contract VaultRouter is Ownable {
    struct Vault {
        address currency;
        address _address;
    }

    Vault[] private supportedVaults;

    constructor(address owner) Ownable(owner) {}

    function getSupportedVaults() external view returns (Vault[] memory) {
        return supportedVaults;
    }

    function addVault(address _address, address currency) external onlyOwner {
        Vault memory vault = Vault(currency, _address);
        supportedVaults.push(vault);
    }

    function removeVault(address _address) external onlyOwner {
        if (supportedVaults.length == 0) {
            return;
        }

        if (supportedVaults.length == 1) {
            if (supportedVaults[0]._address != _address) {
                return;
            } else {
                supportedVaults.pop();
                return;
            }
        }

        uint256 vaultId = type(uint256).max;

        for (uint256 i = 0; i < supportedVaults.length; i++) {
            Vault memory vault = supportedVaults[i];
            if (vault._address == _address) {
                vaultId = i;
            }
        }

        if (vaultId == type(uint256).max) {
            return;
        }

        supportedVaults[vaultId] = supportedVaults[supportedVaults.length - 1];
        supportedVaults.pop();
    }

    function getApproveAddress(
        address assetAddress
    ) external view returns (address) {
        for (uint256 i = 0; i < supportedVaults.length; i++) {
            Vault memory vault = supportedVaults[i];
            if (vault.currency == assetAddress) {
                return vault._address;
            }
        }
        return address(0);
    }
}
