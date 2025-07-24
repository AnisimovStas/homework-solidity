// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {AggregatorV3Interface} from "./AggregatorV3Interface.sol";

contract MockV3AggregatorV3 is AggregatorV3Interface {
    function latestRoundData()
        external
        view
        override
        returns (uint80, int256, uint256, uint256, uint80)
    {
        int256 mockPrice = 2_500 * 1e8;

        return (0, mockPrice, 0, 0, 0);
    }
}
