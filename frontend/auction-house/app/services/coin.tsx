import { JsonRpcSigner, ethers, formatUnits } from "ethers";
import AuctionHouseCoin from "../../../../contracts/artifacts/contracts/AuctionHouseCoin.sol/AuctionHouseCoin.json";
import { CoinContract } from "@/contractDetails";

export class CoinServiceProvider {
    coinContract: ethers.Contract;
    coinContractSigned?: ethers.Contract;
    address: string;

    constructor(address: string, provider: ethers.BrowserProvider, signer?: JsonRpcSigner) {
        this.address = address;
        this.coinContract = new ethers.Contract(CoinContract, AuctionHouseCoin.abi, provider);
        if (signer) {
            this.coinContractSigned = new ethers.Contract(CoinContract, AuctionHouseCoin.abi, signer);
        }
    }

    async getAUC() {
        const balance = await this.coinContract.balanceOf(this.address);
        const decimals = await this.coinContract.decimals();
        return formatUnits(balance, decimals);
    }

    async mintAUC(amnt: BigInt) {
        if (!this.coinContractSigned) {
            return;
        }
        const decimals = await this.coinContract.decimals();
        await this.coinContractSigned.mintToken(amnt);
    }
}
