// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.22 <0.9.0;

import "contracts/AuctionHouseCoin.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title Auction House
/// @author plausibly
contract AuctionHouse is IERC721Receiver {
    address public admin;

    bool internal lock;
    
    uint public feeBp; // Fee in basis points. Must divide by 10k when using operations
    uint256 public collectedFees;

    uint256 internal auctionId; // each auction has a unique id, increment this for each auction creation

    AuctionHouseCoin internal coin;

    mapping (address => bool) public managers; // indicates whether an address is a manager (or admin)
    mapping (uint256 => AuctionItem) public auctions; // maps auctionId to the auction item (if the auction exists)

    struct AuctionItem {
        address seller;
        address contractId;
        uint256 tokenId;
        uint endTime;
        uint256 highestBid; // starting price (if no bidder); otherwise its the highest bid
        address highestBidder;
    }

// todo add emits later
    event AuctionCreated(uint256 id);
    event AuctionCancelled(uint256 id);
    event AuctionEnded(uint256 id, bool forced);
    event BidPlaced(uint256 id, uint256 newBid);
    event ItemClaimed(uint256 id);
    event FeeChanged(uint fee);
    event PriceLowered(string message);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Insufficient permissions");
        _;
    }
    
    modifier onlyManagers() {
        require(managers[msg.sender], "Insufficient permissions");
        _;
    }

    modifier noReentry() {
        require(!lock, "No re-entry");
        lock = true;
        _;
        lock = false;
    }

    constructor(address _admin, uint _fee, AuctionHouseCoin _coin) {
        admin = _admin;
        managers[admin] = true;
        feeBp = _fee;
        coin = _coin;
        auctionId = 0;
    }

    /* General Use */

//TODO PLAN
    /// Required override
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external pure returns (bytes4) { 
        return IERC721Receiver.onERC721Received.selector;
    }

    function getHighestBidder(uint256 id) public view returns (address) {
        return auctions[id].highestBidder;
    }

    function claimItems(uint256 id) public {
        AuctionItem memory item = auctions[id];
        require(item.endTime != 0, "Auction does not exist");
        require(item.highestBidder != address(0), "No one bid on the item. There is nothing to claim");
        //TODO time validate
        //TODO handle expired auction no bids
        transferAndCompleteAuction(item);
    }
    
    /* Auction Control (Selling) */

    function createAuction(address contractAddress, uint256 tokenId, uint256 startPrice, uint endTime) public  {
        IERC721 nfts = IERC721(contractAddress);
        require(nfts.ownerOf(tokenId) == msg.sender, "Cannot auction item you do not own!");
        require(nfts.getApproved(tokenId) == address(this), "Contract is not approved to transfer NFT");
        require(startPrice > 0, "Starting price must be > 0");
        require(endTime > block.timestamp, "End time must be in the future");

        nfts.safeTransferFrom(msg.sender, address(this), tokenId);
        uint256 aucId = auctionId;
        auctionId++;
        auctions[aucId] = AuctionItem(msg.sender, contractAddress, tokenId, endTime, startPrice, address(0));
        emit AuctionCreated(aucId);
    }

    function lowerPrice(uint256 id, uint256 newPrice) public {
        AuctionItem memory item = auctions[id];
    
        require(item.endTime != 0, "Auction does not exist");
        require(item.seller == msg.sender, "You are not the seller");
        require(newPrice > 0, "Price must be greater than 0");
        require(item.highestBidder == address(0), "Cannot lower price once bids have started");
        require(newPrice < item.highestBid, "New starting price must be lower than current price");
    
        auctions[id].highestBid = newPrice;
    }

    function cancelAuction(uint256 id) public noReentry {
        AuctionItem memory item = auctions[id];
        require(item.endTime != 0, "Auction does not exist");
        require(item.seller == msg.sender, "You are not the seller");
        // TODO END TIME VALIDATION. HOW!!
        IERC721 nfts = IERC721(item.contractId);
        
        nfts.transferFrom(address(this), msg.sender, item.tokenId);
        coin.transferFrom(address(this), item.highestBidder, item.highestBid);
        delete(auctions[id]);
        emit AuctionCancelled(id);
    }

    function forceEndAuction(uint256 id) public {
        AuctionItem memory item = auctions[id];
        require(item.endTime != 0, "Auction does not exist");
        require(item.seller == msg.sender, "You are not the seller");
        require(item.highestBidder != address(0), "No bids have been placed, cannot end. You may cancel the auction instead");
        // TODO END TIME VALIDATION. HOW!!
        transferAndCompleteAuction(item);
    }

    function transferAndCompleteAuction(AuctionItem memory item) noReentry private {
        require(item.endTime != 0, "Auction does not exist");
        // this can be called by anyone if an auction has already ended, or if the seller is forcing an end
        require(item.seller == msg.sender, "You are not the seller");
        require(item.highestBidder != address(0), "No bids have been placed to complete this auction.");

        uint houseCut = item.highestBid * (feeBp / 10000);
        uint sellerCut = item.highestBid - houseCut;
        collectedFees += houseCut;
        IERC721 nfts = IERC721(item.contractId);
        nfts.transferFrom(address(this), item.highestBidder, item.tokenId);
        if (sellerCut > 0) {
            // the house could theoretically have 100% fee
            coin.transferFrom(address(this), item.seller, sellerCut);
        }

        delete(auctions[item.tokenId]);

        // TODO if time -> emit claim, else emit auctionended
    }

    /* Bidding */

    function placeBid(uint256 id, uint256 bidAmnt) public {
        AuctionItem storage item = auctions[id];
        require(item.endTime != 0, "Auction does not exist");
        require(coin.balanceOf(msg.sender) >= bidAmnt, "You do not have enough AUC to place this bid");
        // if there was a previous bid, the new bid should be strictly greater (otherwise highestBid is the startprice)
        require(bidAmnt >= item.highestBid || (item.highestBidder != address(0) && bidAmnt > item.highestBid), "Bid is too low");
        if (item.highestBidder != address(0)) {
            // refund the previous (highest) bid
            coin.transferFrom(address(this), item.highestBidder, item.highestBid);
        }
        coin.transferFrom(msg.sender, address(this), bidAmnt);
        item.highestBidder = msg.sender;
        item.highestBid = bidAmnt;
        emit BidPlaced(id, bidAmnt);
    }

    /* Admin Only */

    /// Replaces the admin address with a new one.
    /// @param newAdmin The address to set as admin
    function setAdmin(address newAdmin) onlyAdmin public {
        managers[msg.sender] = false;
        admin = newAdmin;
        // an admin can be a manager
        managers[admin] = true;
    }

    /// Adds a new manager
    /// @param addr Address to become manager
    function addManager(address addr) onlyAdmin public {
        managers[addr] = true; 
    }

    /// Removes a manager.
    /// @param addr Address to become manager
    function removeManager(address addr) onlyAdmin public {
        managers[addr] = false;
    }

    /* Admin or Manager */

    /// Withdraws the collected fees into the admin address
    function withdrawFees(uint256 amnt) onlyManagers public {
        require(collectedFees >= amnt, "Insufficient Balance to withdraw specified amount");
        collectedFees = collectedFees - amnt;
        coin.transferFrom(address(this), admin, amnt);
    }

    /// Changes the house fee
    /// @param _fee Fee in basis points (where 1% = 0.01 * 10,000 BP)
    function setFee(uint _fee) onlyManagers public {
        require(_fee >= 0 && _fee <= 10000, "Fee must be positive and cannot exceed 10,000 BP");
        feeBp = _fee;
        emit FeeChanged(feeBp);
    }
}