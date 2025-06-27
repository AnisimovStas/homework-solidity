// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./LucieTokenV1.sol";

contract LucieTokenV2 is LucieTokenV1 {
    error URINotDefined();

    uint8 internal counter;
    mapping(uint256 tokenId => string uri) private nfts;

    function initializeV2() public reinitializer(2) {
        counter = 1;
        nfts[
            1
        ] = "https://brown-accepted-mastodon-617.mypinata.cloud/ipfs/bafybeicnqfjwhampv5vshdwuzoavmeb342mzxncvtjvqhlq23u55nbf2nq/1.json";
        nfts[
            2
        ] = "https://brown-accepted-mastodon-617.mypinata.cloud/ipfs/bafybeicnqfjwhampv5vshdwuzoavmeb342mzxncvtjvqhlq23u55nbf2nq/2.json";
        nfts[
            3
        ] = "https://brown-accepted-mastodon-617.mypinata.cloud/ipfs/bafybeicnqfjwhampv5vshdwuzoavmeb342mzxncvtjvqhlq23u55nbf2nq/3.json";
        nfts[
            3
        ] = "https://brown-accepted-mastodon-617.mypinata.cloud/ipfs/bafybeicnqfjwhampv5vshdwuzoavmeb342mzxncvtjvqhlq23u55nbf2nq/4.json";
    }

    function safeMint(
        address to,
        uint256 tokenId,
        string memory uri
    ) public payable override onlyOwner {
        super.safeMint(to, tokenId, uri);
    }

    function safeMintWithAutoIncrement() public payable {
        uint256 tokenId = counter;
        require(bytes(nfts[tokenId]).length != 0, URINotDefined());
        require(msg.value >= super.getMintPrice(), NotEnoughFunds());

        string memory uri = nfts[tokenId];

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);

        emit TokenMinted(msg.sender, tokenId, msg.value, block.timestamp, uri);
        counter++;
    }
}
