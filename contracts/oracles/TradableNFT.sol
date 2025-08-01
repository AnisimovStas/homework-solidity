// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AggregatorV3Interface} from "./AggregatorV3Interface.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

contract TradableNFT is ERC721 {
    uint256 counter;
    AggregatorV3Interface internal priceFeed;
    uint256 private constant NFTPrice = 10 * 10 ** 6;

    address internal usdcAddress;

    constructor(
        address aggregatorAddress,
        address _usdcAddress
    ) ERC721("NFToken", "NFT") {
        // ETH / USD Sepolia (ETH/USDC нет на тестнете)
        //0x694AA1769357215DE4FAC081bf1f309aDC325306
        priceFeed = AggregatorV3Interface(aggregatorAddress);

        // DI local test / testnet / mainnet
        usdcAddress = _usdcAddress;
    }

    event newRefound(address to, uint256 amount);
    error NotEnoughFounds();

    function buy() external {
        IERC20(usdcAddress).transferFrom(msg.sender, address(this), NFTPrice);

        _safeMint(msg.sender, counter);
        counter++;
    }

    function buyNative() external payable {
        uint256 price = uint256(getLatestPrice());

        require(msg.value >= price, NotEnoughFounds());

        _safeMint(msg.sender, counter);
        counter++;

        uint refoundAmount = msg.value - price;
        if (refoundAmount > 0) {
            (bool sent, ) = payable(msg.sender).call{value: refoundAmount}("");
            require(sent, "Failed to send Ether");
            emit newRefound(msg.sender, refoundAmount);
        }
    }

    function getLatestPrice() public view returns (int256) {
        (
            uint80 roundID,
            int256 price,
            uint256 startedAt,
            uint256 timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        int256 chainlinkFixedDecimals = 10 ** 8;
        int256 usdcDecimals = 1e6;

        return (price / chainlinkFixedDecimals) * usdcDecimals;
    }
}
