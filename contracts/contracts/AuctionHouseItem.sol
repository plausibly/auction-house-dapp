// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract AuctionHouseItem is ERC721, ERC721URIStorage {
    uint256 private _nextTokenId;

    constructor() ERC721("AuctionHouseItem", "AUCItem") {}

    /// Mint an auction item for sender.
    /// @param uri data for the nft
    function safeMint(string memory uri) public returns (uint256){
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }

    function myBalance() public view returns (uint256) {
        return this.balanceOf(msg.sender);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}