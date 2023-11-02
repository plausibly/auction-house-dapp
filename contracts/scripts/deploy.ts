import { ethers } from "hardhat";

async function main() {
  const house = await ethers.deployContract("AuctionHouse");
  // const coin = await ethers.deployContract("AuctionHouseCoin");
  // const item = await ethers.deployContract("AuctionHouseItem");

  await house.waitForDeployment();
  // await coin.waitForDeployment();
  // await item.waitForDeployment();

  console.log(`Auction House deployed to ${house.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
