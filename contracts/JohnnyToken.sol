// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract JohnnyToken is ERC721, ERC721URIStorage, Ownable {
    uint256 private mintPrice = 100_000 gwei;
    error NotEnoughFunds();
    error FailedWithdraw();

    constructor(
        address initialOwner
    ) Ownable(initialOwner) ERC721("JohnnyToken", "JT") {}

    function safeMint(
        address to,
        uint256 tokenId,
        string memory uri
    ) public payable {
        require(msg.value >= mintPrice, NotEnoughFunds());

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function getMintPrice() external view returns (uint256) {
        return mintPrice;
    }

    function changeMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }

    function withdraw() external onlyOwner {
        require(address(this).balance > 0, NotEnoughFunds());

        bool sent = payable(owner()).send(address(this).balance);
        require(sent, FailedWithdraw());
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
