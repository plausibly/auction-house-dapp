import { JsonRpcSigner, ethers } from "ethers";
import AuctionHouseItem from "../../../contracts/artifacts/contracts/AuctionHouseItem.sol/AuctionHouseItem.json";

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

    async isOwner(tokenId: number) {
        const tokenOwner = ethers.getAddress(await this.contract.ownerOf(BigInt(tokenId)));
        return tokenOwner === ethers.getAddress(this.address);
    }

    async getMetadataUri(id: BigInt) {
        if (!this.signed) {
            return;
        }

        return await this.signed.tokenURI(id);
    }

    async approve(tokenId: number, address: string) {
        if (!this.signed) {
            return;
        }

        return await this.signed.approve(address, BigInt(tokenId));
    }
}
