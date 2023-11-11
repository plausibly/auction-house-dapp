// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/// @title Template for an ERC-721 contract
/// @author plausibly
contract AuctionHouseItem is ERC721, ERC721URIStorage {
    uint256 private _nextTokenId;

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    /// @notice Mint tokens in bulk
    /// @param uri Array of URI metadata for minting
    function bulkMint(string[] memory uri) public {
        for (uint i = 0; i < uri.length; i++) {
            safeMint(uri[i]);
        }
    }

    /// @notice Mint an item for sender.
    /// @param uri data for the nft
    function safeMint(string memory uri) public {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
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