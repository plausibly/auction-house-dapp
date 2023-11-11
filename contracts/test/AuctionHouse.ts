import { expect } from "chai";
import { ethers } from "hardhat";
import { AuctionHouse, AuctionHouseCoin, AuctionHouseItem } from "../typechain-types";
import { AddressLike, ContractRunner } from "ethers";

describe("General Tests", () => {
    let house: AuctionHouse;
    let coin: AuctionHouseCoin;

    const permError = "Insufficient permissions";

    beforeEach("Should deploy auction house", async () => {
        const [admin] = await ethers.getSigners();
        // each test case in isolation, deploy again for each case
        const coinFactory = await ethers.getContractFactory("AuctionHouseCoin");
        coin = await coinFactory.deploy();
        await coin.waitForDeployment();
        let houseFactory = await ethers.getContractFactory("AuctionHouse");
        house = await houseFactory.deploy(await admin.getAddress(), 250, await coin.getAddress());
        await house.waitForDeployment();
    });

    it("Should setup defaults properly", async () => {
        const [admin] = await ethers.getSigners();
        const adminAddress = await admin.getAddress();
        expect(await house.admin()).to.equal(adminAddress);
        expect(await house.collectedFees()).to.equal(0);
        expect(await house.feeBp()).to.equal(250);
        // no initial items, or coins exist 
        expect(await coin.balanceOf(adminAddress)).to.equal(0);
    });

    it("Admin can change admin", async () => {
        const [old, addr1] = await ethers.getSigners();
        const newAdmin = await addr1.getAddress();
        const oldAdmin = await old.getAddress();

        expect(await house.admin()).to.equal(oldAdmin);
        expect(await house.managers(oldAdmin)).to.be.true;
        await house.setAdmin(newAdmin);
        expect(await house.admin()).to.equal(newAdmin);
        expect(await house.managers(newAdmin)).to.be.true;

        // old admin should lose permissions
        expect(await house.managers(oldAdmin)).to.be.false;
        await expect(house.setAdmin(oldAdmin)).to.be.revertedWith(permError);
        // ensure old admin loses managerial perms too
        await expect(house.setFee(1)).to.be.revertedWith(permError);
    });

    it("Admin can add and remove managers", async () => {
        const [admin, addr] = await ethers.getSigners();

        expect(await house.managers(await addr.getAddress())).to.be.false;
    
        await house.addManager(await addr.getAddress());
        expect(await house.managers(await addr.getAddress())).to.be.true;
        await house.removeManager(await addr.getAddress());
        expect(await house.managers(await addr.getAddress())).to.be.false;
    });

    it("Admin and managers can manage fees", async () => {
        const [admin, addr, addr2] = await ethers.getSigners();
        const manager = house.connect(addr);
        const user = house.connect(addr2);

        // admins are managers (but managers arent admin)
        expect(await house.managers(await admin.getAddress())).to.be.true;
        await expect(house.withdrawFees(2)).to.be.revertedWith("Insufficient Balance to withdraw specified amount");
        expect(await house.setFee(22)).to.not.be.revertedWith(permError);
        expect(await house.feeBp()).to.be.equal(22);

        await house.addManager(addr);
        // manager
        expect(await manager.managers(await addr.getAddress())).to.be.true;
        expect(await manager.collectedFees()).to.equal(0);
        await expect(manager.withdrawFees(2)).to.be.revertedWith("Insufficient Balance to withdraw specified amount");
        await expect(manager.setFee(1)).to.not.be.revertedWith(permError);
        expect(await manager.feeBp()).to.be.equal(1);

        // users should not have access
        expect(await user.managers(await user.getAddress())).to.be.false;
        await expect(user.withdrawFees(2)).to.be.revertedWith(permError);
        await expect(user.setFee(22)).to.be.revertedWith(permError);

    });

    it("Fee is bounded within 0 and 10,000 basis points", async () => {
        await expect(house.setFee(0)).to.not.be.revertedWith(permError);
        expect(await house.feeBp()).to.be.equal(0);
        await expect(house.setFee(10000)).to.not.be.revertedWith(permError);
        expect(await house.feeBp()).to.be.equal(10000);

        await expect(house.setFee(10001)).to.be.revertedWith("Fee must be positive and cannot exceed 10,000 BP");
        // uint rejection
        await expect(house.setFee(-1)).to.be.eventually.rejectedWith(TypeError);
        expect(await house.feeBp()).to.be.equal(10000);
    });

    it("Non-admins cannot access admin-only functions", async () => {
        const [admin, addr, addr2] = await ethers.getSigners();
        const [manager, user] = [house.connect(addr), house.connect(addr2)];
        await house.addManager(await addr.getAddress());
        expect(await house.managers(await addr.getAddress())).to.be.true;

        // input to use, shouldnt matter as all calls should be rejected
        const addrToTest = await addr2.getAddress();

        // both managers and normal users should not have admin access
        await expect(manager.addManager(addrToTest)).to.be.revertedWith(permError);
        await expect(manager.removeManager(addrToTest)).to.be.revertedWith(permError);
        await expect(manager.setAdmin(addrToTest)).to.be.revertedWith(permError);

        await expect(user.addManager(addrToTest)).to.be.revertedWith(permError);
        await expect(user.removeManager(addrToTest)).to.be.revertedWith(permError);
        await expect(user.setAdmin(addrToTest)).to.be.revertedWith(permError);
    });

    it("Anyone can mint coins and view balance", async () => {
        const [admin, addr, addr2] = await ethers.getSigners();
        const [adminAddr, uAddr] = [await admin.getAddress(), await addr.getAddress(), await addr2.getAddress()];
        expect(await coin.balanceOf(adminAddr)).to.equal(0);
        expect(await coin.balanceOf(uAddr)).to.equal(0);
        let userSender = coin.connect(addr);
        await userSender.mintToken(500); // as user
        await coin.mintToken(100000); // as admin
        expect(await coin.balanceOf(adminAddr)).to.equal(100000);
        expect(await coin.balanceOf(uAddr)).to.equal(500);
    });
});

describe("Auctioning Behaviour", () => {
    let house: AuctionHouse;
    let coin: AuctionHouseCoin;
    let nft: AuctionHouseItem;

    before("Deploy auction house and setup data", async () => {
        // mint some tokens and items for addresses
        // approve the house to use auc/items
        // tests will then verify auctioning behaviour for these items
        const [admin, addr, addr2, addr3] = await ethers.getSigners();
        
        // deploy and setup contracts using admin
        const coinFactory = await ethers.getContractFactory("AuctionHouseCoin");
        const nftFactory = await ethers.getContractFactory("AuctionHouseItem");
        coin = await coinFactory.deploy();
        nft = await nftFactory.deploy("Test123", "ABC");
        await coin.waitForDeployment();
        await nft.waitForDeployment();
        let houseFactory = await ethers.getContractFactory("AuctionHouse");
        house = await houseFactory.deploy(await admin.getAddress(), 250, await coin.getAddress());
        await house.waitForDeployment();

        // different msg.senders
        const [user1, user2] = [nft.connect(addr), nft.connect(addr2)];

        // ensure house can move their items
        const houseAddress = house.getAddress();
 
        // mint some items to start, ensure house has approval to move them
        // user 1 has id 0,..,4
        for (let i = 0; i < 5; i++) {
            await user1.safeMint("");
            await user1.approve(houseAddress, i);

        }
        // user 2 has id 5,..,9
        for (let i = 5; i < 10; i++) {
            await user2.safeMint("");
            await user2.approve(houseAddress, i);
        }
        
        // verify setup worked
        expect(await user1.myBalance()).to.equal(5);
        expect(await user2.myBalance()).to.equal(5);
    });

    it("Should not be able to create auction for invalid items", async () => {
        const [admin, addr] = await ethers.getSigners();
        const user1 = house.connect(addr);
        const nftAddress = await nft.getAddress();
        const endTime = Math.floor(new Date("January 01, 2019").getTime() /  1000); // epoch
        await expect(user1.createAuction(nftAddress, 6, 1000, 1)).to.be.revertedWith("Cannot auction item you do not own!");
        await expect(user1.createAuction(nftAddress, 0, 1000, endTime)).to.be.revertedWith("End time must be in the future");
        await expect(user1.createAuction(nftAddress, 0, 0, 1)).to.be.revertedWith("Starting price must be > 0");
        await expect(user1.createAuction(nftAddress, 99999, 1000, 1)).to.be.reverted;
        expect(await nft.balanceOf(addr)).to.equal(5);
    });

    it("Should be able to auction items owned", async () => {
        const [admin, addr] = await ethers.getSigners();

        const hUser1 = house.connect(addr);
        const nftUser1 = nft.connect(addr);
        const itemsOwned = await nftUser1.myBalance();
        const startPrice = BigInt(0.005 * 10**18);
        const endTime = Math.floor(new Date("January 01, 3053").getTime() /  1000); // epoch

        await expect(hUser1.createAuction(await nft.getAddress(), 0, startPrice, endTime)).to
        .emit(hUser1, "AuctionCreated").withArgs(0);

        // item sent to house, no longer owned by user
        expect(await nftUser1.myBalance()).to.be.equal(itemsOwned - BigInt(1));
        expect(await nft.balanceOf(house.getAddress())).to.be.equal(BigInt(1));

        const auctionData = await house.auctions(0);
        // verify auction struct
        expect(auctionData.seller).to.equal(await addr.getAddress());
        expect(auctionData.contractId).to.equal(await nftUser1.getAddress());
        expect(auctionData.tokenId).to.equal(0);
        expect(auctionData.endTime).to.equal(endTime);
        expect(auctionData.highestBid).to.equal(startPrice);
        expect(auctionData.highestBidder).to.equal("0x0000000000000000000000000000000000000000");
    });

    it("Should not be able to manipulate auctions that don't exist or arent owned by you", async () => {
        const [admin, addr, addr2] = await ethers.getSigners();
        // invalid ownership, or non-existant item
        const user2 = house.connect(addr2);
        await expect(user2.lowerPrice(0, 1)).to.be.revertedWith("You are not the seller");
        await expect(user2.lowerPrice(9999, 1)).to.be.reverted;
        await expect(user2.cancelAuction(0)).to.be.revertedWith("You are not the seller");;
        await expect(user2.forceEndAuction(0)).to.be.revertedWith("You are not the seller");;

        // no auction is running
        await expect(user2.lowerPrice(6, 1)).to.be.reverted;
        await expect(user2.lowerPrice(6, 1)).to.be.reverted;
        await expect(user2.cancelAuction(6)).to.be.reverted;
        await expect(user2.forceEndAuction(6)).to.be.reverted;
    });

    it("Should not be able to make invalid bids", async () => {
        const [admin, addr, addr2] = await ethers.getSigners();

        const user2 = house.connect(addr2);
        const user2coin = coin.connect(addr2);

        await expect(user2.placeBid(3, 1)).to.be.revertedWith("Auction is not valid");
        await expect(user2.placeBid(999, 1)).to.be.revertedWith("Auction is not valid");
        await expect(user2.placeBid(0, 1)).to.be.revertedWith("You do not have enough AUC to place this bid");
        await user2coin.mintToken(BigInt(5 * 10**18));
        await expect(user2.placeBid(0, 1)).to.be.revertedWith("Bid is too low");
    });

    it("Should be able to place bids with sufficient AUC", async () => {
        const [admin, addr, addr2, addr3] = await ethers.getSigners();
        const user2Coin = coin.connect(addr2);
        const user3Coin = coin.connect(addr3);
        const user2 = house.connect(addr2);
        const user3 = house.connect(addr3);

        const mintedAmtUser2 = BigInt(5 * 10**18);
        const bidAmt = BigInt(0.005 * 10**18); // bid the exact starting price
        await user2Coin.approve(await house.getAddress(), bidAmt);
        await expect(user2.placeBid(0, bidAmt)).to.emit(user2, "BidPlaced").withArgs(0, bidAmt);
        expect(await coin.balanceOf(addr2.getAddress())).to.be.equal(BigInt(mintedAmtUser2 - bidAmt));

        // verify auction struct updated
        let aucData = await house.auctions(0);
        expect(aucData.highestBid).to.equal(bidAmt);
        expect(aucData.highestBidder).to.equal(await addr2.getAddress());
        
        const mintedAmtUser3 = BigInt(0.1 * 10**18);
        await user3Coin.mintToken(mintedAmtUser3)
        await user3Coin.approve(await house.getAddress(), mintedAmtUser3);
        
        // match the previous bid (should be rejected)
        await expect(user3.placeBid(0, bidAmt)).to.be.rejectedWith("Bid is too low");
        expect(await user3Coin.myBalance()).to.equal(mintedAmtUser3);
        // auction remains unchanged
        aucData = await house.auctions(0);
        expect(aucData.highestBidder).to.equal(await addr2.getAddress());

        // place larger bid
        await expect(user3.placeBid(0, mintedAmtUser3)).to.emit(user3, "BidPlaced").withArgs(0, mintedAmtUser3);
        // refund old bidder, take new higher bid
        expect(await user3Coin.myBalance()).to.equal(0);
        expect(await user2Coin.myBalance()).to.equal(mintedAmtUser2);

        // auction reflects new bidder
        aucData = await house.auctions(0);
        expect(aucData.highestBidder).to.equal(await addr3.getAddress());
        expect(aucData.highestBid).to.equal(mintedAmtUser3);
    });

    it("Should not be able to modify running auction", async () => {
        const [admin, addr] = await ethers.getSigners();
        const hUser1 = house.connect(addr);
        await expect(hUser1.lowerPrice(0, 1)).to.be.revertedWith("Cannot lower price once bids have started");
    });
    
    it("Should be able to force end auction", async () => {
        const [admin, addr] = await ethers.getSigners();
        const auctionData = await house.auctions(0);
        const sHouse = house.connect(addr);

        const oldBal = await coin.balanceOf(await addr.getAddress());

        await expect(sHouse.forceEndAuction(0)).to.emit(house, "AuctionEnded").withArgs(0);
        
        // nft sent to buyer
        expect(await nft.ownerOf(0)).to.equal(auctionData.highestBidder);

        // bid sent to seller (minus fee) TODO fix
        const fee = await house.feeBp();

        // const bidMinusFee = BigInt(Number(auctionData.highestBid) * (1 - 0.025));

        // expect(await coin.balanceOf(auctionData.seller)).to.equal(auctionData.highestBid);

        // expect(await house.collectedFees()).to.not.equal(0);

    });

    it("Should be able to cancel auction", async () => {
        const [admin, addr] = await ethers.getSigners();
        const hUser1 = house.connect(addr);
        const nftAddress = await nft.getAddress();
        const adminAddress = await admin.getAddress();
        const houseAddress = await house.getAddress();

        const endTime = Math.floor(new Date("January 01, 3029").getTime() /  1000);

        await hUser1.createAuction(nftAddress, 1, 999, endTime); // auction id = 1
        await hUser1.createAuction(nftAddress, 2, 999, endTime); // auction id = 2

        expect(await nft.ownerOf(1)).to.equal(houseAddress);
        expect(await nft.ownerOf(2)).to.equal(houseAddress);

        await expect(hUser1.cancelAuction(1)).to.emit(hUser1, "AuctionCancelled").withArgs(1);
        expect(await nft.ownerOf(1)).to.equal(await addr.getAddress());

        // place bid on auction id 2 before its cancelled
        const bidAmt = BigInt(9 * 10**18);
        const oldBal = await coin.balanceOf(adminAddress);
        coin.mintToken(bidAmt);
        coin.approve(houseAddress, bidAmt);
        await house.placeBid(1, bidAmt);
        expect(await coin.balanceOf(adminAddress)).to.equal(BigInt(bidAmt - oldBal));

        await expect(hUser1.cancelAuction(2)).to.emit(hUser1, "AuctionCancelled").withArgs(2);
        expect(await nft.ownerOf(2)).to.equal(await addr.getAddress());
        expect(await coin.balanceOf(adminAddress)).to.equal(oldBal);
    });

    it("Should be able to lower auction price", async () => {
        const [admin, addr] = await ethers.getSigners();
        const hUser1 = house.connect(addr);
        const nftAddress = await nft.getAddress();
        
        await hUser1.createAuction(nftAddress, 1, BigInt(1 * 10**18), Date.now() + 99999999); // auction id = 3

        const newPrice = BigInt(0.5 * 10**18);
        await expect(hUser1.lowerPrice(1, newPrice)).to.not.be.reverted;

        const aucData = await hUser1.auctions(3);
        expect(aucData.highestBid).to.equal(newPrice);
    });

    it("Should be able to claim items after an auction has ended", async () => {

    });
});