import { expect } from "chai";
import { ethers } from "hardhat";
import { AuctionHouse } from "../typechain-types";

const permError = "Insufficient permissions";

describe("General Tests", () => {
    let house: AuctionHouse;

    beforeEach("Should deploy auction house", async () => {
        // each test runs in isolation, deploy the contract for each one
        house = await ethers.deployContract("AuctionHouse");
    });

    it("Should setup defaults properly", async () => {
        const [admin] = await ethers.getSigners();
        expect(await house.getAdminAddress()).to.equal(await admin.getAddress());
        expect(await house.getFeesCollected()).to.equal(0);
        expect(await house.getNumberOfItems()).to.equal(0);
        expect(await house.getTokenBalance()).to.equal(0);
        expect(await house.getCurrentFee()).to.equal(250);
    })

    it("Admin can change admin", async () => {
        const [old, addr1] = await ethers.getSigners();
        const newAdmin = await addr1.getAddress();
        const oldAdmin = await old.getAddress();

        expect(await house.getAdminAddress()).to.equal(oldAdmin);
        await house.setAdmin(newAdmin);
        expect(await house.getAdminAddress()).to.equal(newAdmin);

        // old admin should lose permissions
        await expect(house.setAdmin(oldAdmin)).to.be.revertedWith(permError);
        // ensure old admin loses managerial perms too
        await expect(house.getFeesCollected()).to.be.revertedWith(permError);
    });

    it("Admin can add and remove managers", async () => {
        const [admin, addr] = await ethers.getSigners();

        expect(await house.isManager(await addr.getAddress())).to.be.false;
    
        await house.addManager(await addr.getAddress());
        expect(await house.isManager(await addr.getAddress())).to.be.true;
        await house.removeManager(await addr.getAddress());
        expect(await house.isManager(await addr.getAddress())).to.be.false;
    });

    it("Admin and managers can manage fees", async () => {
        const [admin, addr, addr2] = await ethers.getSigners();
        const manager = house.connect(addr);
        const user = house.connect(addr2);

        // admins are managers (but managers arent admin)
        expect(await house.isManager(await admin.getAddress())).to.be.true;
        expect(await house.getFeesCollected()).to.equal(0);
        expect(house.withdrawFees()).to.be.revertedWith("Empty balance. Nothing to withdraw");
        expect(await house.setFee(22)).to.not.be.revertedWith(permError);
        expect(await house.getCurrentFee()).to.be.equal(22);

        await house.addManager(addr);
        // manager
        expect(await manager.isManager(await addr.getAddress())).to.be.true;
        expect(await manager.getFeesCollected()).to.equal(0);
        await expect(manager.withdrawFees()).to.be.revertedWith("Empty balance. Nothing to withdraw");
        await expect(manager.setFee(22)).to.not.be.revertedWith(permError);
        expect(await manager.getCurrentFee()).to.be.equal(22); // todo restore fee

        // users should not have access
        expect(await user.isManager(await user.getAddress())).to.be.false;
        await expect(user.getFeesCollected()).to.be.revertedWith(permError);
        await expect(user.withdrawFees()).to.be.revertedWith(permError);
        await expect(user.setFee(22)).to.be.revertedWith(permError);

    });

    it("Fee is bounded within 0 and 10,000 basis points", async () => {
        expect(await house.setFee(0)).to.not.be.revertedWith(permError);
        expect(await house.getCurrentFee()).to.be.equal(0);
        expect(await house.setFee(10000)).to.not.be.revertedWith(permError);
        expect(await house.getCurrentFee()).to.be.equal(10000);

        await expect(house.setFee(10001)).to.be.revertedWith("Fee must be positive and cannot exceed 10,000 BP");
        // uint rejection
        await expect(house.setFee(-1)).to.be.eventually.rejectedWith(TypeError);
        expect(await house.getCurrentFee()).to.be.equal(10000);
    });

    it("Non-admins cannot access admin-only functions", async () => {
        const [admin, addr, addr2] = await ethers.getSigners();
        const [manager, user] = [house.connect(addr), house.connect(addr2)];
        await house.addManager(await addr.getAddress());
        expect(await house.isManager(await addr.getAddress())).to.be.true;

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
        const senderAddr1 = house.connect(addr);
        const senderAddr2 = house.connect(addr2);

        expect(await house.getTokenBalance()).to.equal(0);
        expect(await senderAddr1.getTokenBalance()).to.equal(0);
        expect(await senderAddr2.getTokenBalance()).to.equal(0);
        await senderAddr1.mintCoins(BigInt(1000));
        await house.mintCoins(BigInt(500));
        expect(await senderAddr1.getTokenBalance()).to.equal(1000);
        expect(await house.getTokenBalance()).to.equal(500);
        expect(await senderAddr2.getTokenBalance()).to.equal(0);
    });

    it("Items can be minted", async () => {
        expect(await house.getNumberOfItems()).to.be.equal(0);
        const data = "ipfs://bafkreiax7oz6q6xrzum6uwudsdc52d2thhpli762mx6ob2d3n4ld3m7m24";
        const tokenId = (await house.mintItem(data)).value;
        expect(tokenId).to.equal(0);
        const tokenUri = await house.getItemMetadata(tokenId);
        expect(tokenUri).to.equal(data);
        expect(await house.getNumberOfItems()).to.be.equal(1);
    });
});

describe("Auctioning Behaviour", () => {
    let house: AuctionHouse, user1: AuctionHouse, user2: AuctionHouse, user3: AuctionHouse;

    before("Deploy auction house and setup data", async () => {
        // mint some tokens and items for addresses
        // tests will then verify auctioning behaviour for these items
        house = await ethers.deployContract("AuctionHouse");

        const [admin, addr, addr2, addr3] = await ethers.getSigners();

        [user1, user2, user3] = [house.connect(addr), house.connect(addr2), house.connect(addr3)];

        // user 1 has id 0,..,4
        for (let i = 0; i < 5; i++) {
            user1.mintItem("");
        }
        // user 2 has id 5,..,9
        for (let i = 0; i < 10; i++) {
            user2.mintItem("");
        }
    });

    it("Should not be able to create auction for invalid items", async () => {
        await expect(user1.createAuction(6, 1000, 1)).to.be.revertedWith("Cannot auction item you do not own!");
        await expect(user1.createAuction(0, 1000, 1)).to.be.revertedWith("End time must be in the future");
        await expect(user1.createAuction(0, 0, 1)).to.be.revertedWith("Starting price must be > 0");
        await expect(user1.createAuction(99999, 1000, 1)).to.be.reverted;
    });

    it("Should be able to auction items owned", async () => {
        const itemsOwned = (await user1.getNumberOfItems());
        
        await expect(user1.createAuction(0, 350, Date.now() + 9999)).to.not.be.reverted;

        // item sent to house, no longer owned by user
        expect(await user1.getNumberOfItems()).to.be.equal(itemsOwned - BigInt(1));
        //todo verify events
    });

    it("Should not be able to manipulate auctions that don't exist or arent owned by you", async () => {
        // invalid ownership, or non-existant item
        await expect(user2.lowerPrice(0, 1)).to.be.reverted;
        await expect(user2.lowerPrice(9999, 1)).to.be.reverted;
        await expect(user2.cancelAuction(0)).to.be.reverted;
        await expect(user2.forceEndAuction(0)).to.be.reverted;
        await expect(user2.forceEndAuction(0)).to.be.reverted;

        // owner of item, but no auction is running
        await expect(user2.lowerPrice(6, 1)).to.be.reverted;
        await expect(user2.lowerPrice(6, 1)).to.be.reverted;
        await expect(user2.cancelAuction(6)).to.be.reverted;
        await expect(user2.forceEndAuction(6)).to.be.reverted;
        await expect(user2.forceEndAuction(6)).to.be.reverted;    
    });

    it("Should not be able to make invalid bids", async () => {
        await expect(user2.placeBid(3, 1)).to.be.revertedWith("Auction does not exist");
        await expect(user2.placeBid(999, 1)).to.be.revertedWith("Auction does not exist");
        await expect(user2.placeBid(0, 1)).to.be.revertedWith("You do not have enough AUC to place this bid");
        await user2.mintCoins(5 * 10**18);
        await expect(user2.placeBid(0, 1)).to.be.revertedWith("Bid is too low");
    });

    it("Should be able to place bids with sufficient AUC", async () => {
        const mintedAmtUser2 = await user2.getTokenBalance();
        const bidAmt = BigInt(1 * 1**18);
        await expect(user2.placeBid(0, bidAmt)).to.not.be.reverted;
        expect(await user2.getTokenBalance()).to.be.equal(mintedAmtUser2 - bidAmt);

        //todo cal token to mint, and item to mint not the house 
        //todo how to call imported contracts and approve
        const mintedAmtUser3 = 3 * 10**18;
        await user3.mintCoins(mintedAmtUser3);

        // greater than start price, less than highest bid
        await expect(user3.placeBid(0, 500)).to.be.rejectedWith("Bid is too low");
        expect(await user3.getTokenBalance()).to.equal(mintedAmtUser3)
        await expect(user3.placeBid(0, mintedAmtUser3)).to.not.be.rejected;
        // refund old bidder, take new higher bid
        expect(await user3.getTokenBalance()).to.equal(0);
        expect(await user2.getTokenBalance()).to.equal(mintedAmtUser2);
    });

    // it("Should be able to lower auction price", async () => {
    //     await expect(user2.forceEndAuction(999)).to.be.reverted;
    // });

    // it("Should be able to cancel auction", async () => {

    // });

    // it("Should be able to force end auction", async () => {

    // });

    // it("Should be able to claim items", async () => {

    // });
});