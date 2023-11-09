import { expect } from "chai";
import { ethers } from "hardhat";
import { AuctionHouse, AuctionHouseCoin, AuctionHouseItem } from "../typechain-types";
import { AddressLike, ContractRunner } from "ethers";

describe("General Tests", () => {
    let house: AuctionHouse;
    let coin: AuctionHouseCoin;
    let nft: AuctionHouseItem;

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
        expect(await house.getFeesCollected()).to.equal(0);
        expect(await house.feeBp()).to.equal(250);
        // no initial items, or coins exist 
        expect(await coin.balanceOf(adminAddress)).to.equal(0);
    });

    it("Admin can change admin", async () => {
        const [old, addr1] = await ethers.getSigners();
        const newAdmin = await addr1.getAddress();
        const oldAdmin = await old.getAddress();

        expect(await house.admin()).to.equal(oldAdmin);
        await house.setAdmin(newAdmin);
        expect(await house.admin()).to.equal(newAdmin);

        // old admin should lose permissions
        await expect(house.setAdmin(oldAdmin)).to.be.revertedWith(permError);
        // ensure old admin loses managerial perms too
        await expect(house.getFeesCollected()).to.be.revertedWith(permError);
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
        expect(await house.getFeesCollected()).to.equal(0);
        await expect(house.withdrawFees(2)).to.be.revertedWith("Insufficient Balance to withdraw specified amount");
        expect(await house.setFee(22)).to.not.be.revertedWith(permError);
        expect(await house.feeBp()).to.be.equal(22);

        await house.addManager(addr);
        // manager
        expect(await manager.managers(await addr.getAddress())).to.be.true;
        expect(await manager.getFeesCollected()).to.equal(0);
        await expect(manager.withdrawFees(2)).to.be.revertedWith("Insufficient Balance to withdraw specified amount");
        await expect(manager.setFee(1)).to.not.be.revertedWith(permError);
        expect(await manager.feeBp()).to.be.equal(1);

        // users should not have access
        expect(await user.managers(await user.getAddress())).to.be.false;
        await expect(user.getFeesCollected()).to.be.revertedWith(permError);
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

// describe("Auctioning Behaviour", () => {
//     let house: AuctionHouse;
//     let coin: AuctionHouseCoin;
//     let nft: AuctionHouseItem;

//     before("Deploy auction house and setup data", async () => {
//         // mint some tokens and items for addresses
//         // approve the house to use auc/items
//         // tests will then verify auctioning behaviour for these items
//         const [admin, addr, addr2, addr3] = await ethers.getSigners();
        
//         // deploy and setup contracts using admin
//         const coinFactory = await ethers.getContractFactory("AuctionHouseCoin");
//         const nftFactory = await ethers.getContractFactory("AuctionHouseItem");
//         coin = await coinFactory.deploy();
//         nft = await nftFactory.deploy();
//         await coin.waitForDeployment();
//         await nft.waitForDeployment();
//         let houseFactory = await ethers.getContractFactory("AuctionHouse");
//         house = await houseFactory.deploy(250, await coin.getAddress(), await nft.getAddress());
//         await house.waitForDeployment();
//         expect(house.getAddress()).to.not.be.equal(await admin.getAddress());

//         // different msg.senders
//         const [user1, user2] = [nft.connect(addr), nft.connect(addr2)];
//         const [user1c, user2c, user3c] = [coin.connect(addr), coin.connect(addr2), coin.connect(addr3)];

//         // ensure house can move their AUC and items
//         const houseAddress = house.getAddress();
//         await user1.setApprovalForAll(houseAddress, true);
//         await user2.setApprovalForAll(houseAddress, true);
//         await user1c.approve(houseAddress, Number.MAX_SAFE_INTEGER);
//         await user2c.approve(houseAddress, Number.MAX_SAFE_INTEGER);
//         await user3c.approve(houseAddress, Number.MAX_SAFE_INTEGER);

//         // mint some items to start
//         // user 1 has id 0,..,4
//         for (let i = 0; i < 5; i++) {
//             await user1.safeMint("");
//         }
//         // user 2 has id 5,..,9
//         for (let i = 0; i < 5; i++) {
//             await user2.safeMint("");
//         }

//         // verify setup worked
//         expect(await user1.myBalance()).to.equal(5);
//         expect(await user2.myBalance()).to.equal(5);
//     });

//     it("Should not be able to create auction for invalid items", async () => {
//         const [admin, addr] = await ethers.getSigners();
//         const user1 = house.connect(addr);
//         await expect(user1.createAuction(6, 1000, 1)).to.be.revertedWith("Cannot auction item you do not own!");
//         await expect(user1.createAuction(0, 1000, 1)).to.be.revertedWith("End time must be in the future");
//         await expect(user1.createAuction(0, 0, 1)).to.be.revertedWith("Starting price must be > 0");
//         await expect(user1.createAuction(99999, 1000, 1)).to.be.reverted;
//         expect(await nft.balanceOf(addr)).to.equal(5);
//     });

//     it("Should be able to auction items owned", async () => {
//         const [admin, addr] = await ethers.getSigners();

//         const hUser1 = house.connect(addr);
//         const nftUser1 = nft.connect(addr);
//         const itemsOwned = await nftUser1.myBalance();
//         const startPrice = BigInt(0.005 * 10**18);
//         await hUser1.createAuction(0, startPrice, Date.now() + 9999);

//         // item sent to house, no longer owned by user
//         expect(await nftUser1.myBalance()).to.be.equal(itemsOwned - BigInt(1));
//         expect(await nft.balanceOf(house.getAddress())).to.be.equal(BigInt(1));

//         //todo verify events
//     });

//     it("Should not be able to manipulate auctions that don't exist or arent owned by you", async () => {
//         const [admin, addr, addr2] = await ethers.getSigners();
//         // invalid ownership, or non-existant item
//         const user2 = house.connect(addr2);
//         await expect(user2.lowerPrice(0, 1)).to.be.reverted;
//         await expect(user2.lowerPrice(9999, 1)).to.be.reverted;
//         await expect(user2.cancelAuction(0)).to.be.reverted;
//         await expect(user2.forceEndAuction(0)).to.be.reverted;
//         await expect(user2.forceEndAuction(0)).to.be.reverted;

//         // owner of item, but no auction is running
//         await expect(user2.lowerPrice(6, 1)).to.be.reverted;
//         await expect(user2.lowerPrice(6, 1)).to.be.reverted;
//         await expect(user2.cancelAuction(6)).to.be.reverted;
//         await expect(user2.forceEndAuction(6)).to.be.reverted;
//         await expect(user2.forceEndAuction(6)).to.be.reverted;
//     });

//     it("Should not be able to make invalid bids", async () => {
//         const [admin, addr, addr2] = await ethers.getSigners();

//         const user2 = house.connect(addr2);
//         const user2coin = coin.connect(addr2);
//         await expect(user2.placeBid(3, 1)).to.be.revertedWith("Auction does not exist");
//         await expect(user2.placeBid(999, 1)).to.be.revertedWith("Auction does not exist");
//         await expect(user2.placeBid(0, 1)).to.be.revertedWith("You do not have enough AUC to place this bid");
//         await user2coin.mintToken(BigInt(5 * 10**18));
//         await expect(user2.placeBid(0, 1)).to.be.revertedWith("Bid is too low");
//     });

//     it("Should be able to place bids with sufficient AUC", async () => {
//         const [admin, addr, addr2, addr3] = await ethers.getSigners();
//         const user2Coin = coin.connect(addr2);
//         const user3Coin = coin.connect(addr3);
//         const user2 = house.connect(addr2);
//         const user3 = house.connect(addr3);

//         const mintedAmtUser2 = BigInt(5 * 10**18);
//         const bidAmt = BigInt(0.005 * 10**18); // bid the exact starting price
//         await user2.placeBid(0, bidAmt);
//         expect(await coin.balanceOf(addr2.getAddress())).to.be.equal(BigInt(mintedAmtUser2 - bidAmt));

//         expect(await house.getHighestBidder(0)).to.equal(await addr2.getAddress());
        
//         const mintedAmtUser3 = BigInt(0.005001 * 10**18);
//         await user3Coin.mintToken(mintedAmtUser3)
        
//         // match the previous bid (should be rejected)
//         await expect(user3.placeBid(0, bidAmt)).to.be.rejectedWith("Bid is too low");
//         expect(await user3Coin.myBalance()).to.equal(mintedAmtUser3);

//         // place larger bid
//         await user3.placeBid(0, mintedAmtUser3);
//         // refund old bidder, take new higher bid
//         expect(await user3Coin.myBalance()).to.equal(0);
//         expect(await user2Coin.myBalance()).to.equal(mintedAmtUser2);
//     });

    // it("Should be able to lower auction price", async () => {
    //     await expect(user2.forceEndAuction(999)).to.be.reverted;
    // });

    // it("Should be able to cancel auction", async () => {

    // });

    // it("Should be able to force end auction", async () => {

    // });

    // it("Should be able to claim items", async () => {

    // });
// });