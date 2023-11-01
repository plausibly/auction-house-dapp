// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.22 <0.9.0;

import "contracts/AuctionHouseCoin.sol";
import "contracts/AuctionHouseItem.sol";

/// @title Auction House
/// @author plausibly
contract AuctionHouse {
    address private admin;
    
    uint private fee;
    uint private collectedFees;

    AuctionHouseCoin private coin;
    AuctionHouseItem private nfts;

    mapping (address => bool) private managers; // indicates whether an address is a manager (or admin)
    mapping (uint256 => AuctionItem) private auctions; // maps tokenId to the auction item (if the auction exists)

    uint256[] runningAuctions;
   
    struct AuctionItem {
        address seller;
        uint256 tokenId;
        uint endTime;
        uint highestBid; // starting price (if no bidder); otherwise its the highest bid
        address highestBidder;
    }
    
    constructor() {
        admin = msg.sender;
        managers[admin] = true;
        fee = uint(25) / 1000;
        coin = new AuctionHouseCoin();
        nfts = new AuctionHouseItem();
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
    
    function createItem(string memory uri) public returns (uint256) {
        return nfts.safeMint(uri);
    }

    function mintCoins(uint amnt) public {
        coin.mintToken(amnt);
    }

    function getTokenBalance() public view returns (uint) {
        return coin.balanceOf(msg.sender);
    }

    function getItemsOwned() public view returns (uint) {
        return nfts.balanceOf(msg.sender);
    }

    function isManager(address addr) public view returns (bool) {
        return managers[addr];
    }

    function getCurrentFee() public view returns (uint) {
        return fee;
    }

    function getAdminAddress() public view returns (address) {
        return admin;
    }

    function claimItems(uint256 tokenId) public {
        AuctionItem memory item = auctions[tokenId];
        require(item.tokenId != 0, "Auction does not exist");
        require(item.highestBidder != address(0), "No one bid on the item. There is nothing to claim");
        //TODO time validate
        //TODO handle expired auction no bids
        transferAndCompleteAuction(item);
    }
    
    /* Auction Control (Selling) */

    function createAuction(uint256 tokenId, uint startPrice, uint endTime) public {
        require(nfts.ownerOf(tokenId) == msg.sender, "Cannot auction item you do not own!");
        require(startPrice > 0, "Starting price must be > 0");
        require(endTime > block.timestamp, "End time must be in the future");

        auctions[tokenId] = AuctionItem(msg.sender, tokenId, endTime, startPrice, address(0));
        nfts.safeTransferFrom(msg.sender, address(this), tokenId);
        emit AuctionCreated(tokenId);
    }

    function lowerPrice(uint256 tokenId, uint newPrice) public {
        AuctionItem memory item = auctions[tokenId];
    
        require(item.tokenId != 0, "Auction does not exist");
        require(item.seller == msg.sender, "You are not the seller");
        require(newPrice > 0, "Price must be greater than 0");
        require(item.highestBidder == address(0), "Cannot lower price once bids have started");
        require(newPrice < item.highestBid, "New starting price must be lower than current price");
    
        auctions[tokenId].highestBid = newPrice;
    }

    function cancelAuction(uint256 tokenId) public {
        AuctionItem memory item = auctions[tokenId];
        require(item.tokenId != 0, "Auction does not exist");
        require(item.seller == msg.sender, "You are not the seller");
        // TODO END TIME VALIDATION. HOW!!
        
        nfts.transferFrom(address(this), msg.sender, item.tokenId);
        coin.transferFrom(address(this), item.highestBidder, item.highestBid);
        delete(auctions[tokenId]);
        emit AuctionCancelled(tokenId);
    }

    function forceEndAuction(uint256 tokenId) public {
        AuctionItem memory item = auctions[tokenId];
        require(item.tokenId != 0, "Auction does not exist");
        require(item.seller == msg.sender, "You are not the seller");
        require(item.highestBidder != address(0), "No bids have been placed, cannot end. You may cancel the auction instead");
        // TODO END TIME VALIDATION. HOW!!
        transferAndCompleteAuction(item);
    }

    function transferAndCompleteAuction(AuctionItem memory item) private {
        require(item.tokenId != 0, "Auction does not exist");
        // this can be called by anyone if an auction has already ended, or if the seller is forcing an end
        require(item.seller == msg.sender, "You are not the seller");
        require(item.highestBidder != address(0), "No bids have been placed to complete this auction.");

        uint houseCut = fee * item.highestBid;
        collectedFees += houseCut;
        // todo use safe transfer from???
        nfts.transferFrom(address(this), item.highestBidder, item.tokenId);
        coin.transferFrom(address(this), item.seller, item.highestBid - houseCut);
        delete(auctions[item.tokenId]);

        // TODO if time -> emit claim, else emit auctionended
    }

    /* Bidding */

    function placeBid(uint256 tokenId, uint bidAmnt) public {
        require(coin.balanceOf(msg.sender) >= bidAmnt, "You do not have enough AUC to place this bid");
        AuctionItem memory item = auctions[tokenId];
        require(item.tokenId != 0, "Auction does not exist");
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

    function setAdmin(address newAdmin) public {
        require(msg.sender == admin, "Insufficient permissions");
        managers[msg.sender] = false;
        admin = newAdmin;
        // an admin can be a manager
        managers[admin] = true;
    }

    function addManager(address addr) public {
        require(msg.sender == admin, "Insufficient permissions");
        managers[addr] = true; 
    }

    function removeManager(address addr) public {
        require(msg.sender == admin, "Insufficient permissions");
        managers[addr] = false;
    }

    /* Admin or Manager */

    function getFeesCollected() public view returns (uint) {
        require(managers[msg.sender], "Insufficient permissions");
        return collectedFees;
    }

    function withdrawFees() public {
        require(managers[msg.sender], "Insufficient permissions");
        uint toWithdraw = getFeesCollected();
        require(toWithdraw > 0, "Empty balance. Nothing to withdraw");
        collectedFees = 0;
        coin.transferFrom(address(this), admin, toWithdraw);
    }

    function setFee(uint _fee) public {
        require(managers[msg.sender], "Insufficient permissions");
        fee = _fee;
        emit FeeChanged(fee);
    }
}