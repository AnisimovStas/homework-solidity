// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IStakeEngine} from "./IStakeEngine.sol";

contract StackableVault is ERC4626, Ownable {
    struct supportedAsset {
        address assetAddress;
        address stakeEngineAddress;
    }

    address private stakeEngine;

    constructor(
        IERC20 asset_,
        string memory name,
        string memory symbol,
        address initialOwner,
        address engineAddress
    ) ERC4626(asset_) ERC20(name, symbol) Ownable(initialOwner) {
        stakeEngine = engineAddress;
        IERC20(asset()).approve(stakeEngine, type(uint256).max);
    }

    function totalAssets() public view override returns (uint256) {
        return IStakeEngine(stakeEngine).balanceOf(address(this));
    }

    function deposit(
        uint256 assets,
        address receiver
    ) public override returns (uint256) {
        uint256 shares = super.deposit(assets, receiver);

        IERC20(asset()).approve(stakeEngine, assets);
        IStakeEngine(stakeEngine).deposit(assets);

        return shares;
    }

    function mint(
        uint256 shares,
        address receiver
    ) public override returns (uint256) {
        uint256 assets = super.mint(shares, receiver);

        IStakeEngine(stakeEngine).deposit(assets);

        return assets;
    }

    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) public override returns (uint256) {
        uint256 maxAssets = maxWithdraw(owner);
        if (assets > maxAssets) {
            revert ERC4626ExceededMaxWithdraw(owner, assets, maxAssets);
        }

        IStakeEngine(stakeEngine).withdraw(assets);

        uint256 shares = previewWithdraw(assets);
        _withdraw(_msgSender(), receiver, owner, assets, shares);

        return shares;
    }

    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) public override returns (uint256) {
        uint256 maxShares = maxRedeem(owner);
        if (shares > maxShares) {
            revert ERC4626ExceededMaxRedeem(owner, shares, maxShares);
        }

        uint256 assets = previewRedeem(shares);

        IStakeEngine(stakeEngine).withdraw(assets);
        _withdraw(_msgSender(), receiver, owner, assets, shares);

        return assets;
    }
}
