// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract PasswordKeeper is Ownable, EIP712 {
    using ECDSA for bytes32;
    string private password = "init";
    uint256 private nonce;

    constructor(address owner) Ownable(owner) EIP712("PasswordKeeper", "1") {}

    function getPassword() external view onlyOwner returns (string memory) {
        return password;
    }

    function getNonce() public view returns (uint256) {
        return nonce;
    }

    function incrementNonce() private {
        nonce = nonce + 1;
    }

    function setPassword(
        string calldata newPassword,
        bytes calldata signature,
        uint256 deadline
    ) external {
        require(block.timestamp < deadline, "Deadline over");
        address signer = validateSignature(deadline, signature);

        require(signer == owner(), "Invalid signature");

        password = newPassword;
        incrementNonce();
    }

    function validateSignature(
        uint256 deadline,
        bytes memory signature
    ) internal view returns (address) {
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256(
                    "SetPassword(address executor,address owner,uint256 nonce,uint256 deadline)"
                ),
                msg.sender,
                owner(),
                getNonce(),
                deadline
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        return ECDSA.recover(digest, signature);
    }
}
