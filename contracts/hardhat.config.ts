import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { ALCHEMY_API_KEY, privateKey } from "./_env";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks : {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [privateKey]
    }
  }
};

export default config;
