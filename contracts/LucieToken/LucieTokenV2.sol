// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./LucieTokenV1.sol";

import {ERC721BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";

contract LucieTokenV2 is LucieTokenV1, ERC721BurnableUpgradeable {
    error URINotDefined();

    uint8 internal counter;
    mapping(uint256 tokenId => string uri) private nfts;

    ///@custom:oz-upgrades-validate-as-initializer
    function initializeV2() public reinitializer(2) onlyOwner {
        __LucieTokenV1_init();
        __ERC721Burnable_init();
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
            4
        ] = "https://brown-accepted-mastodon-617.mypinata.cloud/ipfs/bafybeicnqfjwhampv5vshdwuzoavmeb342mzxncvtjvqhlq23u55nbf2nq/4.json";
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(LucieTokenV1, ERC721Upgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(
        uint256 tokenId
    )
        public
        view
        virtual
        override(LucieTokenV1, ERC721Upgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override(LucieTokenV1, ERC721Upgradeable) {
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public virtual override(LucieTokenV1, ERC721Upgradeable) {
        super.safeTransferFrom(from, to, tokenId, data);
    }

    function safeMint(
        address to,
        uint256 tokenId,
        string memory uri
    ) public payable override onlyOwner {
        super.safeMint(to, tokenId, uri);
    }

    function burn(uint256 tokenId) public override(ERC721BurnableUpgradeable) {
        address owner = ownerOf(tokenId);
        require(owner == msg.sender, NotNFTOwner());
        uint256 refoundAmount = (getMintPrice() * 90) / 100;
        delete sellOfferBook[tokenId];

        ERC721BurnableUpgradeable.burn(tokenId);
        (bool sent, ) = owner.call{value: refoundAmount}("");
        if (!sent) revert FailedWithdraw();
    }

    function safeMintWithAutoIncrement() public payable returns (uint256) {
        uint256 tokenId = counter;
        require(bytes(nfts[tokenId]).length != 0, URINotDefined());
        require(msg.value >= super.getMintPrice(), NotEnoughFunds());

        string memory uri = nfts[tokenId];

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);

        emit TokenMinted(msg.sender, tokenId, msg.value, block.timestamp, uri);
        counter++;
        return tokenId;
    }
}
