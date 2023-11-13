import { JsonRpcSigner, ethers, formatUnits } from "ethers";
import AuctionHouse from "../../../contracts/artifacts/contracts/AuctionHouse.sol/AuctionHouse.json";

/** Underlying type for an Auction Item in the smart contract */
export interface AuctionItem {
    seller: string,
    contractId: string,
    tokenId: BigInt,
    endTime: Date, // TODO convert *1000
    highestBid: BigInt,
    highestBidder: string,
    archived: boolean
};

/**
 * Service class with functionality to communicate with the auction house contract.
 */
export class HouseServiceProvider {
    contract: ethers.Contract;
    signed?: ethers.Contract;
    address: string;

    constructor(address: string, provider: ethers.BrowserProvider, signer?: JsonRpcSigner) {
        if (!process.env.NEXT_PUBLIC_HOUSE_CONTRACT) {
            throw new Error("Missing house contract env variable");
        }
        this.address = address;
        this.contract = new ethers.Contract(process.env.NEXT_PUBLIC_HOUSE_CONTRACT, AuctionHouse.abi, provider);
        if (signer) {
            this.signed = new ethers.Contract(process.env.NEXT_PUBLIC_HOUSE_CONTRACT, AuctionHouse.abi, signer);
        }
    }

    getContract() {
        return this.contract;
    }

    getSigned() {
        return this.signed;
    }

    async getRecentAuctions(numAuctions: number) {
        if (!this.signed) {
            return;
        }

        const auctionEvents = await this.queryFilter("AuctionCreated");
        if (!auctionEvents) {
            return;
        }

        let auctionIds: Array<number> = [];
        let nums = 0;

        for (let i of auctionEvents) {
            nums++;
            const decoded = this.signed.interface.decodeEventLog("AuctionCreated", i.data, i.topics);
            auctionIds.push(decoded[0]);
            if (nums === numAuctions) {
                break;
            }
        }

        const auctionObjects: Array<AuctionItem> = [];
        for (let i of auctionIds) {
            const aucItem = await this.getAuctionObject(i);
            if (aucItem) {
                auctionObjects.push(aucItem);
            }
        }
    
        return auctionObjects;
    }

    async queryFilter(event: string) {
        if (!this.signed) {
            return;
        }

        return await this.signed.queryFilter(event);
    }

    async getAuctionObject(id: number) {
        if (!this.signed) {
            return;
        }
        const obj = await this.signed.auctions(BigInt(id));
        const formattedObj: AuctionItem = {
            seller: obj[0],
            contractId: obj[1],
            tokenId: obj[2],
            endTime: new Date(Number(obj[3]) * 1000),
            highestBid: obj[4],
            highestBidder: obj[5],
            archived: Boolean(obj[6])
        }

        return formattedObj;
    }

    async listenAuctions() {
        this.contract.on("AuctionCreated", (id) => {
            console.log(id);
        })
    }

    async placeBid(auctionId: number, bidAmt: number) {
        if (!this.signed) {
            return;
        }
        const formatPrice = BigInt(Math.ceil(bidAmt * 10 ** 18));
        return await this.signed.placeBid(auctionId, formatPrice);
    }


    async claimItems(auctionId: number) {
        if (!this.signed) {
            return;
        }
        return await this.signed.claimItems(BigInt(auctionId));
    }

    async cancelAuction(auctionId: number) {
        if (!this.signed) {
            return;
        }
        return await this.signed.cancelAuction(BigInt(auctionId));
    }

    async endAuction(auctionId: number) {
        if (!this.signed) {
            return;
        }
        return await this.signed.forceEndAuction(BigInt(auctionId));
    }

    async createAuction(address: string, tokenId: number, price: number, endDate: Date) {
        if (!this.signed) {
            return;
        }

        const formatPrice = BigInt(Math.ceil(price * 10 ** 18));
        const end = Math.floor(endDate.getTime() / 1000); // epoch time

        return await this.signed.createAuction(address, tokenId, formatPrice, end);
    }

    async isManager() {
        return await this.contract.managers(this.address);
    }

    async setFee(amnt: number) {
        if (!this.signed || amnt < 0) {
            return;
        }
        const feeBp = (amnt / 100) * 10000;
        await this.signed.setFee(BigInt(feeBp));
    }

    async getFee() {
        const feeBp = Number(await this.contract.feeBp());
        return (feeBp / 10000) * 100;
    }

    async setAdmin(addr: string) {
        if (!this.signed || !ethers.isAddress(addr)) {
            return;
        }
        await this.signed.setAdmin(addr);
    }

    async addManager(addr: string) {
        if (!this.signed || !ethers.isAddress(addr)) {
            return;
        }
        await this.signed.addManager(addr);
    }

    async removeManager(addr: string) {
        if (!this.signed || !ethers.isAddress(addr)) {
            return;
        }
        await this.signed.removeManager(addr);
    }

    async getCollectedFees() {
        if (!this.signed) {
            return;
        }

        const collected = await this.signed.collectedFees();
        return formatUnits(collected, 18);
    }

    async withdrawFees(amnt: number) {
        if (!this.signed) {
            return;
        }

        await this.signed.withdrawFees(BigInt(amnt * 10 ** 18));
    }
}
