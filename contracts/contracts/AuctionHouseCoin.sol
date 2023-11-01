// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title 
/// @author 
/// @notice 
contract AuctionHouseCoin is ERC20 {

    constructor() ERC20("AuctionHouseCoin", "AUC") {
        _mint(msg.sender, 0);
    }

    function mintToken(uint amnt) public {
        require(amnt > 0, "Cannot mint <= 0");
        _mint(msg.sender, amnt);
    }

}