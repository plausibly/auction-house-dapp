import { JsonRpcSigner, ethers, formatUnits } from "ethers";
import AuctionHouseCoin from "../../../contracts/artifacts/contracts/AuctionHouseCoin.sol/AuctionHouseCoin.json";


export class CoinServiceProvider {
    contract: ethers.Contract;
    signed?: ethers.Contract;
    address: string;

    constructor(address: string, provider: ethers.BrowserProvider, signer?: JsonRpcSigner) {
        if (!process.env.NEXT_PUBLIC_COIN_CONTRACT) {
            throw new Error("Missing coin contract env variable");
        }
        this.address = address;
        this.contract = new ethers.Contract(process.env.NEXT_PUBLIC_COIN_CONTRACT, AuctionHouseCoin.abi, provider);
        if (signer) {
            this.signed = new ethers.Contract(process.env.NEXT_PUBLIC_COIN_CONTRACT, AuctionHouseCoin.abi, signer);
        }
    }
    
    getContract() {
        return this.contract;
    }

    getSigned() {
        return this.signed;
    }

    async approve(amnt: number, addr: string) {
        if (!this.signed) {
            return;
        }
        const decimals = Number(await this.contract.decimals());
        const amtToApprove = BigInt(Math.ceil(amnt * 10 ** decimals));

        return await this.signed.approve(addr, amtToApprove);
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
        await this.signed.mintToken(BigInt(Math.ceil(amnt * 10 ** decimals)));
    }
}
