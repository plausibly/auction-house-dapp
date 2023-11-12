import { JsonRpcSigner, ethers } from "ethers";
import AuctionHouse from "../../../contracts/artifacts/contracts/AuctionHouse.sol/AuctionHouse.json";
import { AuctionHouseContract } from "@/contract-details";
import { BigNumberish } from "ethers";


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
 * Metadata for a specific ERC-721 token
 */
export interface ItemMetadata {
    name: string,
    description: string
};

/**
 * Service class with functionality to communicate with the auction house contract.
 */
export class HouseServiceProvider {
    contract: ethers.Contract;
    signed?: ethers.Contract;
    address: string;

    constructor(address: string, provider: ethers.BrowserProvider, signer?: JsonRpcSigner) {
        this.address = address;
        this.contract = new ethers.Contract(AuctionHouseContract, AuctionHouse.abi, provider);
        if (signer) {
            this.signed = new ethers.Contract(AuctionHouseContract, AuctionHouse.abi, signer);
        }
    }

    getContract() {
        return this.contract;
    }

    getSigned() {
        return this.signed;
    }

    async createAuction(address: string, tokenId: number, price: number, endDate: Date) {
        if (!this.signed) {
            return;
        }

        //TODO APPROVE NFT... ALSO APPROVALS ON ALL OTHER FUNCS

        const formatPrice = BigInt(price * 10 ** 18);
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
        return BigInt(collected * BigInt(10) ** BigInt(18))
    }

    async withdrawFees(amnt: number) {
        if (!this.signed) {
            return;
        }

        await this.signed.withdrawFees(BigInt(amnt * 10 ** 18));
    }
}
