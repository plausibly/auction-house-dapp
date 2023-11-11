// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/// @title Template for an ERC-721 contract
/// @author plausibly
contract AuctionHouseItem is ERC721, ERC721URIStorage {
    uint256 private _nextTokenId;

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    /// @notice Mint an auction item for sender.
    /// @param uri data for the nft
    function safeMint(string memory uri) public returns (uint256){
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }

    /// @notice Get the metadata URI for the provided token
    /// @param tokenId token to check
    /// @return URI for the metadata
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /// @dev Required solidity override
    /// @param interfaceId id
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}