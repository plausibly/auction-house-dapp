import { JsonRpcSigner, ethers } from "ethers";
import AuctionHouse from "../../../../contracts/artifacts/contracts/AuctionHouse.sol/AuctionHouse.json";
import { AuctionHouseContract } from "@/contract-details";

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

    async isAdmin() {
        console.log(await this.contract.admin());
        return await this.contract.admin() === this.address;
    }

    async isManager() {
        return await this.contract.managers(this.address);
    }

}
