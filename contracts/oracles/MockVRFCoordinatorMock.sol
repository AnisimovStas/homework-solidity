// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";

contract MockVRFCoordinatorMock is VRFCoordinatorV2_5Mock {
    constructor() VRFCoordinatorV2_5Mock(0, 0, 0) {}
}
