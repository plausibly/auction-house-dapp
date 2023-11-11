// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.22 <0.9.0;

import "contracts/AuctionHouseCoin.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title Auction House.
/// @author plausibly
/// Contains functionality to auction and bid on ERC-721 digital items
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
        address contractId; // address to corresponding ERC-721 contract
        uint256 tokenId;
        uint256 endTime; // end time, seconds since epoch
        uint256 highestBid; // starting price (if no bidder); otherwise its the highest bid
        address highestBidder; 
        bool archived; // wheter the auction has ended and items are claimed
    }

// todo add emits later
    event AuctionCreated(uint256 id);
    event AuctionCancelled(uint256 id);
    event AuctionEnded(uint256 id);
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

    /// Construct an AuctionHouse
    /// @param _admin The admin address
    /// @param _fee The starting fee
    /// @param _coin The address of the ERC-20 contract used as the currency for the house
    constructor(address _admin, uint _fee, AuctionHouseCoin _coin) {
        admin = _admin;
        managers[admin] = true;
        feeBp = _fee;
        coin = _coin;
        auctionId = 0;
    }

    /* General Use */

//TODO PLAN

    /// Required override for solidity ERC-721 receiver
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external pure returns (bytes4) { 
        return IERC721Receiver.onERC721Received.selector;
    }

    /// Trigger a claim for an auction that has ended. This will send the item to the highest bidder,
    /// and the bid to the seller.
    /// @param id auction id
    function claimItems(uint256 id) public {
        AuctionItem memory item = auctions[id];
        // bid of 0 indicates the mapping returned nothing
        require(item.highestBid != 0 && !item.archived, "Auction is not valid");
        require(item.endTime >= block.timestamp, "Auction is still running");
        IERC721 nfts = IERC721(item.contractId);

        if (item.highestBidder != address(0)) {
            nfts.transferFrom(address(this), item.highestBidder, item.tokenId);
            uint houseCut = item.highestBid * (feeBp / 10000);
            uint sellerCut = item.highestBid - houseCut;
            collectedFees += houseCut;
            if (sellerCut > 0) {
                // the house could theoretically have 100% fee
                coin.approve(address(this), sellerCut);
                coin.transferFrom(address(this), item.seller, sellerCut);
            }
        } else {
            // no bids, refund item
            nfts.transferFrom(address(this), item.seller, item.tokenId);
        }

        auctions[id].archived = true;
    }

    /* Auction Control (Selling) */

    /// Create an auction with the provided details. Sends the ERC-721 item to the house for auctioning.
    /// @param contractAddress Address of ERC-721 contract with the auctioned item
    /// @param tokenId TokenID of the item being auctioned
    /// @param startPrice The starting price for bids
    /// @param endTime The auction end date
    function createAuction(address contractAddress, uint256 tokenId, uint256 startPrice, uint256 endTime) public {
        IERC721 nfts = IERC721(contractAddress);
        require(nfts.ownerOf(tokenId) == msg.sender, "Cannot auction item you do not own!");
        require(nfts.getApproved(tokenId) == address(this), "Contract is not approved to transfer NFT");
        require(startPrice > 0, "Starting price must be > 0");
        require(endTime > block.timestamp, "End time must be in the future");

        nfts.safeTransferFrom(msg.sender, address(this), tokenId);
        uint256 aucId = auctionId;
        auctionId++;
        auctions[aucId] = AuctionItem(msg.sender, contractAddress, tokenId, endTime, startPrice, address(0), false);
        emit AuctionCreated(aucId);
    }

    /// Lowers the starting price of an existing auction if bids have not been started.
    /// @param id auction id
    /// @param newPrice the price to lower to
    function lowerPrice(uint256 id, uint256 newPrice) public {
        AuctionItem storage item = auctions[id];
    
        require(item.highestBid != 0 && !item.archived, "Auction is not valid");
        require(item.seller == msg.sender, "You are not the seller");
        require(newPrice > 0, "Price must be greater than 0");
        require(item.highestBidder == address(0), "Cannot lower price once bids have started");
        require(item.endTime > block.timestamp, "Cannot lower price once auction has ended");
        require(newPrice < item.highestBid, "New starting price must be lower than current price");
    
        item.highestBid = newPrice;
    }

    /// Cancels a running auction. Refunds potential buyer and the seller.
    /// @param id auction id
    function cancelAuction(uint256 id) public noReentry {
        AuctionItem memory item = auctions[id];
        require(item.highestBid != 0 && !item.archived, "Auction is not valid");
        require(item.seller == msg.sender, "You are not the seller");
        require(item.endTime > block.timestamp, "Cannot cancel auction if it has already ended");

        IERC721 nfts = IERC721(item.contractId);
        
        // refund items
        nfts.transferFrom(address(this), msg.sender, item.tokenId);

        if(item.highestBidder != address(0)) {
            coin.approve(address(this), item.highestBid);
            coin.transferFrom(address(this), item.highestBidder, item.highestBid);
        }

        auctions[id].archived = true;
        emit AuctionCancelled(id);
    }

    /// Ends a running auction. This will trigger payment to the seller, and item sent to buyer.
    /// @param id auction id
    function forceEndAuction(uint256 id) public {
        AuctionItem memory item = auctions[id];
        require(item.highestBid != 0 && !item.archived, "Auction is not valid");
        require(item.seller == msg.sender, "You are not the seller");
        require(item.highestBidder != address(0), "No bids have been placed, cannot end. You may cancel the auction instead");
        require(item.endTime > block.timestamp, "Cannot end auction if the time has ended");
        
        uint houseCut = item.highestBid * (feeBp / 10000);
        uint sellerCut = item.highestBid - houseCut;
        collectedFees += houseCut;
        IERC721 nfts = IERC721(item.contractId);
        nfts.transferFrom(address(this), item.highestBidder, item.tokenId);
        if (sellerCut > 0) {
            // the house could theoretically have 100% fee
            coin.approve(address(this), sellerCut);
            coin.transferFrom(address(this), item.seller, sellerCut);
        }

        auctions[id].archived = true;
        emit AuctionEnded(id);
    }

    /// Places a bid on the provided auction with the amount. Reverts if the bid is not higher than the previous bid. 
    /// The old bidder will be refunded, and the new bid will be sent to the house.
    /// @param id Auction Id
    /// @param bidAmnt amount to bid
    function placeBid(uint256 id, uint256 bidAmnt) noReentry public {
        AuctionItem storage item = auctions[id];
        require(item.highestBid != 0 && !item.archived, "Auction is not valid");
        require(item.endTime > block.timestamp, "Cannot bid on auction that has ended");
        require(coin.balanceOf(msg.sender) >= bidAmnt, "You do not have enough AUC to place this bid");
        // if there was a previous bid, the new bid should be strictly greater (otherwise highestBid is the startprice)
        require(bidAmnt > item.highestBid || (item.highestBidder == address(0) && bidAmnt >= item.highestBid), "Bid is too low");
        if (item.highestBidder != address(0)) {
            // refund the previous (highest) bid
            coin.approve(address(this), item.highestBid);
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

    /// Withdraws an amount of AUC from the contract into the admin address
    /// @param amnt amount to withdraw
    function withdrawFees(uint256 amnt) onlyManagers public {
        require(collectedFees >= amnt, "Insufficient Balance to withdraw specified amount");
        collectedFees = collectedFees - amnt;
        coin.approve(address(this), amnt);
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