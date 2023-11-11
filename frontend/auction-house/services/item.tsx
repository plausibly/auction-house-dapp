import { JsonRpcSigner, ethers } from "ethers";
import AuctionHouseItem from "../../../contracts/artifacts/contracts/AuctionHouseItem.sol/AuctionHouseItem.json";
import { AuctionHouseContract } from "@/contract-details";
import { BigNumberish } from "ethers";

/**
 * Service class with functionality to communicate with an ERC-721 contract.
 */
export class ItemServiceProvider {
    contract: ethers.Contract;
    signed?: ethers.Contract;
    address: string; // wallet address

    constructor(contractAddress: string, address: string, provider: ethers.BrowserProvider, signer?: JsonRpcSigner) {
        this.address = address;
        this.contract = new ethers.Contract(contractAddress, AuctionHouseItem.abi, provider);
        if (signer) {
            this.signed = new ethers.Contract(contractAddress, AuctionHouseItem.abi, signer);
        }
    }

    async bulkMint(uris: Array<string>) {
        if (!this.signed){
            return;
        }
        return await this.signed.bulkMint(uris);
    }
}
