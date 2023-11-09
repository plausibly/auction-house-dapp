import { JsonRpcSigner, ethers } from "ethers";
import AuctionHouse from "../../../../contracts/artifacts/contracts/AuctionHouse.sol/AuctionHouse.json";
import { AuctionHouseContract } from "@/contract-details";
import { BigNumberish } from "ethers";

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
}
