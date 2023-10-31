// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.22 <0.9.0;

import "contracts/AuctionHouse_Coin.sol";
import "contracts/AuctionHouse_Item.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**

*/
contract AuctionHouse {
    address private admin;
    
    uint private fee;
    uint private collectedFees;

    AuctionHouseCoin coin;
    AuctionHouseItem nfts;

    mapping (address => bool) private managers; // true if the address is a manager (OR the admin address)
    mapping (address => uint) private balance;
    mapping (uint256 => AuctionItem) auctions;

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
        fee = SafeMath.div(25, 1000); // 2.5%
        coin = new AuctionHouseCoin();
    }

// todo add emits later
    event AuctionCreated(uint256 id);
    event AuctionCancelled(uint256 id);
    event AuctionEnded(uint256 id, bool forced);
    event BidPlaced(uint256 tokenId, uint256 oldBid, uint256 newBid);
    // event ItemClaimed(string message);
    event FeeChanged(uint fee);
    event PriceLowered(string message);

    /* General Use */
    
    function createItem(string memory uri) public returns (uint256) {
        return nfts.safeMint(uri);
    }

    function mintCoins(uint amnt) public {
        coin.mintToken(amnt);
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
        AuctionItem storage item = auctions[tokenId];
        require(item.tokenId != 0, "Auction does not exist");
        require(item.seller == msg.sender, "You are not the seller");
        require(newPrice > 0, "Price must be greater than 0");
        require(item.highestBidder == address(0), "Cannot lower price once bids have started");
        require(newPrice < item.highestBid, "New starting price must be lower than current price");
        item.highestBid = newPrice; // TODO check if PBR
    }

    function cancelAuction(uint256 tokenId) public {
        AuctionItem storage item = auctions[tokenId];
        require(item.tokenId != 0, "Auction does not exist");
        require(item.seller == msg.sender, "You are not the seller");
        // TODO END TIME VALIDATION. HOW!!
        
        nfts.transferFrom(address(this), msg.sender, item.tokenId);
        coin.transferFrom(address(this), item.highestBidder, item.highestBid);
        delete(auctions[tokenId]);
        emit AuctionCancelled(tokenId);
    }

    function forceEndAuction(uint256 tokenId) public {
        AuctionItem storage item = auctions[tokenId];
        require(item.tokenId != 0, "Auction does not exist");
        require(item.seller == msg.sender, "You are not the seller");
        require(item.highestBidder != address(0), "No bids have been placed, cannot end. You may cancel the auction instead");
        // TODO END TIME VALIDATION. HOW!!

        uint houseCut = SafeMath.mul(fee, item.highestBid);
        collectedFees = SafeMath.add(collectedFees, houseCut);
        nfts.transferFrom(address(this), item.highestBidder, item.tokenId);
        coin.transferFrom(address(this), item.seller, SafeMath.sub(item.highestBid, houseCut));
        delete(auctions[tokenId]);
        emit AuctionEnded(tokenId, true);
    }

    /* Admin Only */

    function changeAdmin(address newAdmin) private {
        require(msg.sender == admin, "Insufficient permission. You are not an admin.");
        managers[msg.sender] = false;
        admin = newAdmin;
        // an admin can be a manager
        managers[admin] = true;
    }

    function addManager(address addr) private {
        require(msg.sender == admin);
        managers[addr] = true;
    }

    function removeManager(address addr) private {
        require(msg.sender == admin);
        managers[addr] = false;
    }

    /* Admin or Manager */

    function getAdminBalance() public view returns (uint) {
        require(managers[msg.sender], "Insufficient permissions.");
        return collectedFees;
    }

    function withdrawFees() private {
        require(managers[msg.sender], "Insufficient permissions.");
        uint toWithdraw = getAdminBalance();
        require(toWithdraw > 0, "Empty balance. Nothing to withdraw");
        collectedFees = 0;
        coin.transferFrom(address(this), admin, toWithdraw);
    }

    function changeFee(uint _fee) private {
        require(managers[msg.sender], "Insufficient permissions.");
        fee = _fee;
        emit FeeChanged(fee);
    }

    /* Getters */

    function getTokenBalance() public view returns (uint) {
        return coin.balanceOf(msg.sender);
    }

}