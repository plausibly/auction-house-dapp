import { ethers } from "hardhat";
import { ADMIN_ADDRESS } from "../_env";

async function main() {
  const coin = await ethers.deployContract("AuctionHouseCoin");
  await coin.waitForDeployment();

  const houseFactory = await ethers.getContractFactory("AuctionHouse");
  const house = await houseFactory.deploy(ADMIN_ADDRESS, 250, await coin.getAddress());

  console.log(`Auction House deployed to ${house.target} \n AUC (ERC-20) deployed to ${coin.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
