import { ethers } from "hardhat";

async function main() {
  const coinFactory = await ethers.getContractFactory("AuctionHouseCoin");
  const nftFactory = await ethers.getContractFactory("AuctionHouseItem");
  const coin = await coinFactory.deploy();
  const nft  = await nftFactory.deploy();
  await coin.waitForDeployment();
  await nft.waitForDeployment();
  let houseFactory = await ethers.getContractFactory("AuctionHouse");
  const house = await houseFactory.deploy(250, await coin.getAddress(), await nft.getAddress());

  console.log(`Auction House deployed to ${house.target}. AUC coin (ERC-20) deployed to ${coin.target} and the items (ERC-721) are deployed to: ${nft.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
