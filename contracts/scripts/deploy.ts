import { ethers } from "hardhat";
import { adminAddress } from "../_env";

async function main() {
  const coinFactory = await ethers.getContractFactory("AuctionHouseCoin");

  const coin = await coinFactory.deploy();

  await coin.waitForDeployment();

  let houseFactory = await ethers.getContractFactory("AuctionHouse");
  const house = await houseFactory.deploy(adminAddress, 250, await coin.getAddress());

  console.log(`Auction House deployed to ${house.target}. AUC coin (ERC-20) deployed to ${coin.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
