// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Auction House Coin
/// @author 
/// @notice 
contract AuctionHouseCoin is ERC20 {

    constructor() ERC20("AuctionHouseCoin", "AUC") { }

    /// Mints provided amount ERC-20 token for the sender
    /// @param amnt amount to mint
    function mintToken(uint amnt) public {
        require(amnt > 0, "Cannot mint <= 0");
        _mint(msg.sender, amnt);
    }

    /// Returns the balance of the sender
    function myBalance() public view returns (uint256) { // REMOVE THIS
        return this.balanceOf(msg.sender);
    }
}