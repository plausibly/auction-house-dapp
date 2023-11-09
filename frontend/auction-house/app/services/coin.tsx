import { JsonRpcSigner, ethers, formatUnits } from "ethers";
import AuctionHouseCoin from "../../../../contracts/artifacts/contracts/AuctionHouseCoin.sol/AuctionHouseCoin.json";
import { CoinContract } from "@/contract-details";

export class CoinServiceProvider {
    contract: ethers.Contract;
    signed?: ethers.Contract;
    address: string;

    constructor(address: string, provider: ethers.BrowserProvider, signer?: JsonRpcSigner) {
        this.address = address;
        this.contract = new ethers.Contract(CoinContract, AuctionHouseCoin.abi, provider);
        if (signer) {
            this.signed = new ethers.Contract(CoinContract, AuctionHouseCoin.abi, signer);
        }
    }
    
    getContract() {
        return this.contract;
    }

    getSigned() {
        return this.signed;
    }

    async getAUC() {
        const balance = await this.contract.balanceOf(this.address);
        const decimals = await this.contract.decimals();
        return formatUnits(balance, decimals);
    }

    async mintAUC(amnt: number) {
        if (!this.signed) {
            return;
        }
        const decimals = Number(await this.contract.decimals());

        await this.signed.mintToken(BigInt(amnt * 10 ** decimals));
    }

}
