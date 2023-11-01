import { expect } from "chai";
import { ethers } from "hardhat";
import { AuctionHouse } from "../typechain-types";
import { AuctionHouseCoin } from "../typechain-types/contracts";
import { AuctionHouseItem } from "../typechain-types/contracts/AuctionHouse_Item.sol";

const permError = "Insufficient permissions";

describe("Auction House", () => {
    let house: AuctionHouse;
    let coin: AuctionHouseCoin;
    let nfts: AuctionHouseItem;

    beforeEach("Should deploy auction house", async () => {
        // each test runs in isolation, deploy the contract for each one
        house = await ethers.deployContract("AuctionHouse");
        coin = await ethers.deployContract("AuctionHouseCoin");
        nfts = await ethers.deployContract("AuctionHouseItem");
    });

    it("Should have default admin address, and all balances are 0", async () => {
        const [admin] = await ethers.getSigners();
        
        expect(await house.getAdminAddress()).to.equal(await admin.getAddress());
        expect(await house.getFeesCollected()).to.equal(0);
        expect(await house.getItemsOwned()).to.equal(0);
        expect(await house.getTokenBalance()).to.equal(0);
        // TODO fee, how?
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
    
    it("Should mint coins", async () => {
        const [admin, addr, addr2] = await ethers.getSigners();
        const house = await ethers.deployContract("AuctionHouse");
        const senderAddr1 = house.connect(addr);
        const senderAddr2 = house.connect(addr2);

        expect(await senderAddr1.getTokenBalance()).to.equal(0);
        expect(await senderAddr1.getTokenBalance()).to.equal(0);
        expect(await senderAddr2.getTokenBalance()).to.equal(0);
        await senderAddr2.mintCoins(BigInt(1000));
        await house.mintCoins(BigInt(500));
        expect(await senderAddr1.getTokenBalance()).to.equal(1000);
        expect(await senderAddr2.getTokenBalance()).to.equal(500);
    });

    // it("Should mint items", async () => {

    // });

    // it("Should create auction", async () => {

    // });

    // it("Should not be able to manipulate auctions you do not own", async () => {

    // });

    // it("Should be able to lower auction price", async () => {

    // });

    // it("Should be able to cancel auction", async () => {

    // });

    // it("Should be able to place bids", async () => {

    // });

    // it("Should be able to force end auction", async () => {

    // });

    // it("Should be able to claim items", async () => {

    // });

});