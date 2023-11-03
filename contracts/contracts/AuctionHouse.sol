// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.22 <0.9.0;

import "contracts/AuctionHouseCoin.sol";
import "contracts/AuctionHouseItem.sol";

/// @title Auction House
/// @author plausibly
contract AuctionHouse is IERC721Receiver {
    address private admin;
    
    uint private feeBp; // Fee in basis points. Must divide by 10k when using operations
    uint private collectedFees;

    AuctionHouseCoin private coin;
    AuctionHouseItem private nfts;

    mapping (address => bool) private managers; // indicates whether an address is a manager (or admin)
    mapping (uint256 => AuctionItem) private auctions; // maps tokenId to the auction item (if the auction exists)
   
    struct AuctionItem {
        address seller;
        uint256 tokenId;
        uint endTime;
        uint256 highestBid; // starting price (if no bidder); otherwise its the highest bid
        address highestBidder;
    }
    
    constructor(uint _fee, AuctionHouseCoin _coin, AuctionHouseItem _nfts) {
        admin = msg.sender;
        managers[admin] = true;
        feeBp = _fee;
        coin = _coin;
        nfts = _nfts;
    }

// todo add emits later
    event AuctionCreated(uint256 id);
    event AuctionCancelled(uint256 id);
    event AuctionEnded(uint256 id, bool forced);
    event BidPlaced(uint256 tokenId, uint256 newBid);
    event ItemClaimed(uint256 tokenId);
    event FeeChanged(uint fee);
    event PriceLowered(string message);

    /* General Use */

//TODO SECURITY CONSIDERATIONS
//TODO PLAN
    /// Required override (TODO auction?)
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4) { 
        return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)")); //TODO fix this later
    }

    /// Checks if the address is a manager.
    /// @param addr Address to check
    function isManager(address addr) public view returns (bool) {
        return managers[addr];
    }

    /// Gets the current house fee in basis points
    function getCurrentFee() public view returns (uint) {
        return feeBp;
    }

    /// Gets the admin address that will eventually consume the fees
    function getAdminAddress() public view returns (address) {
        return admin;
    }

    function claimItems(uint256 tokenId) public {
        AuctionItem memory item = auctions[tokenId];
        require(item.endTime != 0, "Auction does not exist");
        require(item.highestBidder != address(0), "No one bid on the item. There is nothing to claim");
        //TODO time validate
        //TODO handle expired auction no bids
        transferAndCompleteAuction(item);
    }
    
    /* Auction Control (Selling) */

    function createAuction(uint256 tokenId, uint256 startPrice, uint endTime) public {
        require(nfts.ownerOf(tokenId) == msg.sender, "Cannot auction item you do not own!");
        require(startPrice > 0, "Starting price must be > 0");
        require(endTime > block.timestamp, "End time must be in the future");

        nfts.safeTransferFrom(msg.sender, address(this), tokenId);
        auctions[tokenId] = AuctionItem(msg.sender, tokenId, endTime, startPrice, address(0));
        emit AuctionCreated(tokenId);
    }

    function lowerPrice(uint256 tokenId, uint256 newPrice) public {
        AuctionItem memory item = auctions[tokenId];
    
        require(item.endTime != 0, "Auction does not exist");
        require(item.seller == msg.sender, "You are not the seller");
        require(newPrice > 0, "Price must be greater than 0");
        require(item.highestBidder == address(0), "Cannot lower price once bids have started");
        require(newPrice < item.highestBid, "New starting price must be lower than current price");
    
        auctions[tokenId].highestBid = newPrice;
    }

    function cancelAuction(uint256 tokenId) public {
        AuctionItem memory item = auctions[tokenId];
        require(item.endTime != 0, "Auction does not exist");
        require(item.seller == msg.sender, "You are not the seller");
        // TODO END TIME VALIDATION. HOW!!
        
        nfts.transferFrom(address(this), msg.sender, item.tokenId);
        coin.transferFrom(address(this), item.highestBidder, item.highestBid);
        delete(auctions[tokenId]);
        emit AuctionCancelled(tokenId);
    }

    function forceEndAuction(uint256 tokenId) public {
        AuctionItem memory item = auctions[tokenId];
        require(item.endTime != 0, "Auction does not exist");
        require(item.seller == msg.sender, "You are not the seller");
        require(item.highestBidder != address(0), "No bids have been placed, cannot end. You may cancel the auction instead");
        // TODO END TIME VALIDATION. HOW!!
        transferAndCompleteAuction(item);
    }

    function transferAndCompleteAuction(AuctionItem memory item) private {
        require(item.endTime != 0, "Auction does not exist");
        // this can be called by anyone if an auction has already ended, or if the seller is forcing an end
        require(item.seller == msg.sender, "You are not the seller");
        require(item.highestBidder != address(0), "No bids have been placed to complete this auction.");

        uint houseCut = item.highestBid * (feeBp / 10000);
        uint sellerCut = item.highestBid - houseCut;
        collectedFees += houseCut;
        nfts.transferFrom(address(this), item.highestBidder, item.tokenId);
        if (sellerCut > 0) {
            // the house could theoretically have 100% fee
            coin.transferFrom(address(this), item.seller, sellerCut);
        }

        delete(auctions[item.tokenId]);

        // TODO if time -> emit claim, else emit auctionended
    }

    /* Bidding */

    function placeBid(uint256 tokenId, uint256 bidAmnt) public {
        AuctionItem memory item = auctions[tokenId];
        require(item.endTime != 0, "Auction does not exist");
        require(coin.balanceOf(msg.sender) >= bidAmnt, "You do not have enough AUC to place this bid");
        // if there is no bidder, it is ok to match the highest price (since it is the starting price)
        require(bidAmnt > item.highestBid || (item.highestBidder == address(0x0) && bidAmnt >= item.highestBid), "Bid is too low");
        if (item.highestBidder != address(0x0)) {
            // refund the previous (highest) bid
            coin.transferFrom(address(this), item.highestBidder, item.highestBid);
        }
        coin.transferFrom(msg.sender, address(this), bidAmnt);
        item.highestBidder = msg.sender;
        item.highestBid = bidAmnt;
        emit BidPlaced(tokenId, bidAmnt);
    }

    /* Admin Only */

    /// Replaces the admin address with a new one.
    /// @param newAdmin The address to set as admin
    function setAdmin(address newAdmin) public {
        require(msg.sender == admin, "Insufficient permissions");
        managers[msg.sender] = false;
        admin = newAdmin;
        // an admin can be a manager
        managers[admin] = true;
    }

    /// Adds a new manager
    /// @param addr Address to become manager
    function addManager(address addr) public {
        require(msg.sender == admin, "Insufficient permissions");
        managers[addr] = true; 
    }

    /// Removes a manager.
    /// @param addr Address to become manager
    function removeManager(address addr) public {
        require(msg.sender == admin, "Insufficient permissions");
        managers[addr] = false;
    }

    /* Admin or Manager */

    /// Gets the total fees collected by the house that has yet to be withdrawn
    function getFeesCollected() public view returns (uint) {
        require(managers[msg.sender], "Insufficient permissions");
        return collectedFees;
    }

    /// Withdraws the collected fees into the admin address
    function withdrawFees() public {
        require(managers[msg.sender], "Insufficient permissions");
        uint toWithdraw = getFeesCollected();
        require(toWithdraw > 0, "Empty balance. Nothing to withdraw");
        collectedFees = 0;
        coin.transferFrom(address(this), admin, toWithdraw);
    }

    /// Changes the house fee
    /// @param _fee Fee in basis points (where 1% = 0.01 * 10,000 BP)
    function setFee(uint _fee) public {
        require(managers[msg.sender], "Insufficient permissions");
        require(_fee >= 0 && _fee <= 10000, "Fee must be positive and cannot exceed 10,000 BP");
        feeBp = _fee;
        emit FeeChanged(feeBp);
    }
}