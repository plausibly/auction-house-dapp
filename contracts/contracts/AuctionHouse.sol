// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.22 <0.9.0;

import "contracts/AuctionHouseCoin.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title Auction House
/// @author plausibly
/// @notice Contains functionality to auction and bid on ERC-721 digital items
contract AuctionHouse {
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
        uint256 highestBid; // starting price (if no bidder); otherwise its the highest bid.
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
    event PriceLowered(uint256 id, uint256 newPrice);

    /// @notice Ensures that an auction exists in the mapping, and is not archived. Optionally,
    /// can verify if the sender is the seller.
    /// @param id the auction id for the mapping lookup
    /// @param enforceSeller whether or not to check if the seller sent the request
    modifier validAuction(uint256 id, bool enforceSeller) {
        AuctionItem memory item = auctions[id];
        require(item.seller != address(0) && !item.archived, "Auction is not valid");
        require(!enforceSeller || item.seller == msg.sender, "You are not the seller");
        _;
    }

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

    /// @notice Construct an AuctionHouse
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

    /// @notice Trigger a claim for an auction that has ended. This will send the item to the highest bidder, and the bid to the seller.
    /// @param id auction id
    function claimItems(uint256 id) validAuction(id, false) noReentry public {
        AuctionItem memory item = auctions[id];
        require(item.endTime <= block.timestamp, "Auction is still running");
        require(item.highestBidder != address(0), "No bidder on this auction. Nothing to claim");
        IERC721 nfts = IERC721(item.contractId);

        nfts.transferFrom(address(this), item.highestBidder, item.tokenId);
        uint256 houseCut = calculateHouseCut(item.highestBid);
        collectedFees += houseCut;

        if (houseCut < item.highestBid) {
            // the house could theoretically have 100% fee
            uint256 sellerCut = item.highestBid - houseCut;
            coin.approve(address(this), sellerCut);
            coin.transferFrom(address(this), item.seller, sellerCut);
        }

        auctions[id].archived = true;
        emit ItemClaimed(id);
    }

    /* Auction Control (Selling) */

    /// @notice Create an auction with the provided details. Sends the ERC-721 item to the house for auctioning.
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

        nfts.transferFrom(msg.sender, address(this), tokenId);
        uint256 aucId = auctionId;
        auctionId++;
        auctions[aucId] = AuctionItem(msg.sender, contractAddress, tokenId, endTime, startPrice, address(0), false);
        emit AuctionCreated(aucId);
    }

    /// @notice Lowers the starting price of an existing auction if bids have not been started.
    /// @param id auction id
    /// @param newPrice the price to lower to
    function lowerPrice(uint256 id, uint256 newPrice) validAuction(id, true) public {
        AuctionItem storage item = auctions[id];

        require(newPrice > 0, "Price must be greater than 0");
        require(item.highestBidder == address(0), "Cannot lower price once bids have started");
        require(item.endTime > block.timestamp, "Cannot lower price once auction has ended");
        require(newPrice < item.highestBid, "New starting price must be lower than current price");
    
        item.highestBid = newPrice;
        emit PriceLowered(id, newPrice);
    }

    /// @notice Cancels a running auction. Refunds potential buyer and the seller.
    /// @param id auction id
    function cancelAuction(uint256 id) validAuction(id, true) noReentry public {
        AuctionItem memory item = auctions[id];
        // cannot cancel auction if time has unded UNLESS there were no bids
        require(item.endTime > block.timestamp || item.highestBidder == address(0), "Cannot cancel auction if it has already ended");

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

    /// @notice Ends a running auction. This will trigger payment to the seller, and item sent to buyer.
    /// @param id auction id
    function forceEndAuction(uint256 id) validAuction(id, true) public {
        AuctionItem memory item = auctions[id];
        require(item.highestBidder != address(0), "No bids have been placed, cannot end. You may cancel the auction instead");
        
        IERC721 nfts = IERC721(item.contractId);
        nfts.transferFrom(address(this), item.highestBidder, item.tokenId);

        uint256 houseCut = calculateHouseCut(item.highestBid);
        collectedFees += houseCut;

        if (houseCut < item.highestBid) {
            // the house could theoretically have 100% fee
            uint256 sellerCut = item.highestBid - houseCut;
            coin.approve(address(this), sellerCut);
            coin.transferFrom(address(this), item.seller, sellerCut);
        }

        auctions[id].archived = true;
        emit AuctionEnded(id);
    }

    /// @notice Places a bid on the provided auction with the amount. Reverts if the bid is not higher than the previous bid.  
    /// The old bidder will be refunded, and the new bid will be sent to the house.
    /// @param id Auction Id
    /// @param bidAmnt amount to bid
    function placeBid(uint256 id, uint256 bidAmnt) validAuction(id, false) noReentry public {
        AuctionItem storage item = auctions[id];

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

    /// @notice Replaces the admin address with a new one.
    /// @param newAdmin The address to set as admin
    function setAdmin(address newAdmin) onlyAdmin public {
        managers[msg.sender] = false;
        admin = newAdmin;
        // an admin can be a manager
        managers[admin] = true;
    }

    /// @notice Adds a new manager
    /// @param addr Address to become manager
    function addManager(address addr) onlyAdmin public {
        managers[addr] = true; 
    }

    /// @notice Removes a manager.
    /// @param addr Address to become manager
    function removeManager(address addr) onlyAdmin public {
        managers[addr] = false;
    }

    /* Admin or Manager */

    /// @notice Withdraws an amount of AUC from the contract into the admin address
    /// @param amnt amount to withdraw
    function withdrawFees(uint256 amnt) onlyManagers public {
        require(collectedFees >= amnt, "Insufficient Balance to withdraw specified amount");
        collectedFees = collectedFees - amnt;
        coin.approve(address(this), amnt);
        coin.transferFrom(address(this), admin, amnt);
    }

    /// @notice Changes the house fee
    /// @param _fee Fee in basis points (where 1% = 0.01 * 10,000 BP)
    function setFee(uint _fee) onlyManagers public {
        require(_fee >= 0 && _fee <= 10000, "Fee must be positive and cannot exceed 10,000 BP");
        feeBp = _fee;
        emit FeeChanged(feeBp);
    }

    /// @notice Helper function to compute the house cut (fees) based on amnt
    /// @param amnt Amount to apply fee to
    /// @return The house cut taken from amount
    function calculateHouseCut(uint256 amnt) private view returns(uint256) {
        return amnt * feeBp / 10000;
    }
}