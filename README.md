# Contract Plan
<details>
<summary> Click to expand smart contract plan </summary>

| Variables | |  |  
| -------- | -------- | -------- |  
| admin | address | The address for the house admin|  
| lock | bool | Locking variable to prevent re-entrancy attacks|
| feeBp | uint | The fee to charge on succesful sales. Represented in basis points |
| collectedFees | uint256 | The total collected fees available for withdrawal by managers |
| auctionId | uint256 | Incremental variable used to generate new IDs for each auction created|
| coin | address | The address of the ERC-20 contract for AUC |
| managers | mapping | Maps an address to a boolean, indicating whether they are a manager. |
| auctions | mapping | Maps an auction id to the auction item struct |

###

| Auction Item Struct |  |  |  
| --- | --------- | ------------ |  
| seller | address | The address of the seller |  
| contractId | address | The ERC-721 contract address of the item being sold |
| tokenId | uint256 | The specific token id (within the ERC-721 contract) of the item being sold|
| endTime | uint256 | The end time of the auction, specified in epoch seconds |
| highestBid | uint256 | The bidding amount. If there is no bidder, the starting price |
| highestBidder | address | The highest bidder, or 0x0 for no bids|
| archived | bool | Whether or not the auction has ended and items were claimed |

###

| Functions |  |  |  
| -------- | -------- | -------- |  
| constructor | (admin: address, fee: uint, AuctionHouseCoin: coin) | Creates an auction house object with the specified values. Sets default admin address, fee and AUC contract |  
| claimItems | (id: uint256) | Trigger an item claim for an auction. Item/AUC sent to respective buyer/seller |
| createAuction | (contractAddress: address, tokenId: uint256, startPrice: uint256, endTime: uint256) | Allows a seller to create an auction for an ERC-721 token |
| lowerPrice | (id: uint256, newPrice: uint256) | Allows the seller to lower an auction price if no bids have been placed yet |
| forceEndAuction | (id: uint256) | Allows the seller to end an auction, completes any potential sales |
| cancelAuction | (id: uint256) | Allows the seller to cancel an auction, refunds items to everyone |
| placeBid | (id: uint256, bidAmnt: uint256) | Place a bid on an auction item, replacing the old bid (if it is a valid bid) |
| setAdmin | (newAdmin: address) | Allows the administrator to replace the admin address |
| addManager | (addr: address)| Allows the administrator to add an address to management |
| removeManager | (addr: address) | Allows the administrator to remove an address from management |
| withdrawFees | (amnt: uint256) | Allows management/admins to withdraw collected fees into the admin address|
| setFee | (fee: uint) | Allows management/admin to update the house fee |
| calculateHouseCut | (amnt: uint256) | Applies the house fee to the provided amount and returns the computed value |

###
| Events | | |  
| -------- | -------- | -------- |  
| AuctionCreated | (id: uint256) | Indicates that a new auction has been created, with the ID mapped to the auction struct |  
| AuctionCancelled | (id: uint256) | Indicates that an auction was cancelled (refunded items) by the seller |
| AuctionEnded | (id: uint256) | Indicates that an auction was ended (items sold to bidder) by the seller |
| BidPlaced | (id: uint256, newBid: uint256) | Indicates a new bid being placed on a specific auction, with the bid amount |
| ItemClaimed | (id: uint256) | Indicates that items were claimed for an auction that had ended by time |
| FeeChanged | (fee: uint) | Indicates that the fee has changed for auction sales  |
| PriceLowered | (id: uint256, newPrice: uint256) | Indicates the starting price has decreased by the seller for an item |

</details>

# Auction House Dapp

This dApp allows users to participate in [English Auctions](https://en.wikipedia.org/wiki/English_auction).

A seller can:

- **auction digital item (ERC721)**: sends item to auction house with starting price in Auction House Coin (ERC20) with symbol AUC, and auction end time. Users can create a new digital item or send an existing one. To keep it simple, AUC can be minted by anyone.
- **cancel auction**: bids no longer allowed, item returns to seller. Cannot cancel after auction end time.
- **end auction**: item sent to highest bidder, AUC sent to seller. Auctions can be ended before time runs out.
- **lower starting price**: starting price is lowered.

A buyer can:

- **place bid**: sends AUC to auction house for an auction. If the auction is not new, and is higher bid than the previous, send the AUC of the old bid back to the old bidder. Cannot place bid after auction has ended.
- **claim item**: item sent to highest bidder, AUC sent to seller. Claim can occur only after auction ends.

An admin can:

- **set fee**: set a fee (default 2.5%) for all successful auctions. Fees are sent to the auction contract
- **change admin**: change the admin address
- **withdraw fees**: withdraw fees collected to admin address
- **add/remove managers**: add/remove managers, who can set fess and withdraw fees to admin address

## Tech Stack 

![Contract](./media/tech.png)
