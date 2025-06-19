// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract LucieToken is ERC721, ERC721URIStorage, Ownable {
    uint256 private mintPrice = 100_000 gwei;
    error NotEnoughFunds();
    error FailedWithdraw();
    error NotNFTOwner();
    error AlreadySelling();
    error TokenNotOnSell();

    mapping(uint256 tokenId => uint256 price) public sellOfferBook;

    event SellOfferPlaced(
        address owner,
        uint256 indexed tokenId,
        uint256 price,
        uint256 timestamp,
        string tokenURI
    );

    event TokenBuyed(
        address from,
        address to,
        uint256 indexed tokenId,
        uint256 price,
        uint256 timestamp,
        string tokenURI
    );
    event TokenMinted(
        address to,
        uint256 indexed tokenId,
        uint256 price,
        uint256 timestamp,
        string tokenURI
    );

    constructor(
        address initialOwner
    ) Ownable(initialOwner) ERC721("LucieToken", "LT") {}

    function safeMint(
        address to,
        uint256 tokenId,
        string memory uri
    ) public payable {
        require(msg.value >= mintPrice, NotEnoughFunds());

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        emit TokenMinted(to, tokenId, msg.value, block.timestamp, uri);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public override(ERC721, IERC721) {
        sellOfferBook[tokenId] = 0;
        super.safeTransferFrom(from, to, tokenId, data);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override(ERC721, IERC721) {
        sellOfferBook[tokenId] = 0;
        super.transferFrom(from, to, tokenId);
    }

    function placeSellOffer(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, NotNFTOwner());
        require(!isTokenOnSell(tokenId), AlreadySelling());

        sellOfferBook[tokenId] = price;

        emit SellOfferPlaced(
            msg.sender,
            tokenId,
            price,
            block.timestamp,
            super.tokenURI(tokenId)
        );
    }

    function buyFromOffer(uint256 tokenId) external payable {
        require(isTokenOnSell(tokenId), TokenNotOnSell());
        uint256 price = sellOfferBook[tokenId];
        require(msg.value >= price, NotEnoughFunds());

        address seller = ownerOf(tokenId);

        safeTransferFrom(ownerOf(tokenId), msg.sender, tokenId, "");

        (bool sent, ) = payable(seller).call{value: price}("");
        if (!sent) revert FailedWithdraw();

        emit TokenBuyed(
            seller,
            msg.sender,
            tokenId,
            price,
            block.timestamp,
            super.tokenURI(tokenId)
        );
    }

    function getMintPrice() external view returns (uint256) {
        return mintPrice;
    }

    function changeMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }

    function withdraw() external onlyOwner {
        require(address(this).balance > 0, NotEnoughFunds());
        uint256 contractBalance = address(this).balance;

        (bool success, ) = payable(owner()).call{value: contractBalance}("");
        if (!success) revert FailedWithdraw();
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

    function isTokenOnSell(uint256 tokenId) private view returns (bool) {
        return sellOfferBook[tokenId] != 0;
    }
}
