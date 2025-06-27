// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721URIStorageUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract LucieTokenV1 is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable
{
    uint256 private mintPrice;
    mapping(uint256 tokenId => uint256 price) public sellOfferBook;

    error NotEnoughFunds();
    error FailedWithdraw();
    error NotNFTOwner();
    error AlreadySelling();
    error TokenNotOnSell();

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

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function initialize() public initializer {
        __ERC721_init("LucieToken", "LT");
        __ERC721URIStorage_init();
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        mintPrice = 100_000 gwei;
    }

    function safeMint(
        address to,
        uint256 tokenId,
        string memory uri
    ) public payable virtual {
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
    ) public override(ERC721Upgradeable, IERC721) {
        sellOfferBook[tokenId] = 0;
        super.safeTransferFrom(from, to, tokenId, data);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override(ERC721Upgradeable, IERC721) {
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

    function getMintPrice() public view returns (uint256) {
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
    )
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function isTokenOnSell(uint256 tokenId) private view returns (bool) {
        return sellOfferBook[tokenId] != 0;
    }
}
