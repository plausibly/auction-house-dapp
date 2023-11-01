import { expect } from "chai";
import { ethers } from "hardhat";
import { AuctionHouse } from "../typechain-types";


describe("Auction House", () => {
    let house: AuctionHouse;

    before("Should deploy auction house", async () => {
        house = await ethers.deployContract("AuctionHouse");
    })

    it("The admin should be deployer", async () => {
        const [admin] = await ethers.getSigners();
        
        expect(await house.getAdminAddress()).to.equal(await admin.getAddress());
        // TODO BROKEN
       // expect(await house.getCurrentFee()).to.equal(0.0025);
    })

    it("Admin can change admin", async () => {

    });

    it("Admin can add and remove managers", async () => {

    });

    it("Admin and managers can manage fees", async () => {

    });

    it("Non-admins cannot access admin-only functions", async () => {

    });
    
    it("Should mint coins", async () => {
        const [admin, addr, addr2] = await ethers.getSigners();
        const house = await ethers.deployContract("AuctionHouse");
        
        const senderAddr1 = house.connect(addr);
        const senderAddr2 = house.connect(addr2);

        expect(await senderAddr1.getTokenBalance()).to.equal(BigInt(0));

        await senderAddr2.mintCoins(BigInt(1000));
        await house.mintCoins(BigInt(500));
        expect(await senderAddr1.getTokenBalance()).to.equal(BigInt(1000));
        expect(await senderAddr2.getTokenBalance()).to.equal(BigInt(500));
        expect(await house.getTokenBalance()).to.equal(0);
    });

    it("Should mint items", async () => {

    });

    it("Should create auction", async () => {

    });

    it("Should not be able to manipulate auctions you do not own", async () => {

    });

    it("Should be able to lower auction price", async () => {

    });

    it("Should be able to cancel auction", async () => {

    });

    it("Should be able to place bids", async () => {

    });

    it("Should be able to force end auction", async () => {

    });

    it("Should be able to claim items", async () => {

    });

});