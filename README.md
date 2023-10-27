# Auction House Dapp

This dApp allows users to participate in [English Auctions](https://en.wikipedia.org/wiki/English_auction).

A seller can:

- **auction digital item (ERC721)**: sends item to auction house with starting price in Auction House Coin (ERC20) with symbol AUC, and auction end time. Users can create a new digital item or send an existing one. To keep it simple, AUC can be minted by anyone.
- **cancel auction**: bids no longer allowed, item returns to seller. Cannot cancel after auction end time.
- **end auction**: item sent to highest bidder, AUC sent to seller. Auctions can be ended before time runs out.
- **lower starting price**: starting price is lowered.

A buyer can:

- **place bid**: sends AUC to auction house for an auction. If the auction is not new, and is higher bid than the previous, send the AUC of the old bid back to the old bidder. Cannot place bid after auction has ended.
- **claim item**: item sent to highest bidder, AUC sent to seller. Claim can occur only after auction ends.

An admin can:

- **set fee**: set a fee (default 2.5%) for all successful auctions. Fees are sent to the auction contract
- **change admin**: change the admin address
- **withdraw fees**: withdraw fees collected to admin address
- **add/remove managers**: add/remove managers, who can set fess and withdraw fees to admin address

## Criteria

1. The dApp includes a frontend to show all necessary data for users to participate in Auctions and the smart contracts that facilitates the underlying logic and data storage.
2. The smart contracts must be developed using the Tech Stack specified in the later slides.
3. The Solidity code must be fully documented following [Natspec](https://docs.soliditylang.org/en/latest/natspec-format.html). 
4. The smart contracts must be tested with written test cases with clear documentation. Make sure there are no security flaws and code is gas optimized.
5. The Smart Contracts should be deployed on Sepolia network and verified on Sepolia [Etherscan](https://sepolia.etherscan.io/). Use this [Hardhat plugin](https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify) to verify. The Etherscan links to the contracts should be added to the ReadMe.
6. The frontend code should be Web3 focused and is an organized UI. Take design inspiration from [Opensea](https://opensea.io/).
7. The website should be deployed to [Netlify](https://docs.netlify.com/get-started/). The URL should be in the ReadMe. 
8. The code should be uploaded to your course repository and should include two folders: `frontend` and `contracts`.
9. A smart contract plan should be uploaded to the repo. See the example at the end of this README file. 

## Tech Stack 

![Contract](./media/tech.png)

Frontend:

- [ReactJS](https://reactjs.org/docs/getting-started.html): Frontend library to building Single Page Applications 
- [EtherJS](https://docs.ethers.io/): JS library used for integrating with EVM
- [Metamask](https://docs.metamask.io/guide/): A decentralized wallet used for interacting with ETH dApps. It also injects a free Infura Web3 Provider to interact with the blockchain
- [Netlify](https://docs.netlify.com/get-started/): Platform to host website

Blockchain: 

- [Hardhat](https://hardhat.org/hardhat-runner/docs/getting-started#overview): Framework for developing, testing and deploying Smart Contracts. Uses Mocha, Chai and Waffle
- [Mocha](https://mochajs.org/): helps document and organize tests with "describe", "it", etc
- [Chai](https://www.chaijs.com/): assertion library for testing with "expect", "assert", etc 
- [Waffle](https://getwaffle.io/): tools for compiling, deploying and testing smart contracts. It also provides extra Chai methods and can be added as an extension of Mocha
- [EthersJS](https://docs.ethers.io/): JS library used for integrating with EVM
- [Solidity](https://docs.soliditylang.org/): Language used to build smart contracts
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts): a library of well tested smart contracts, including ERC721
- [Etherscan](https://etherscan.io/): Block explorer
- [NFT Storage](https://nft.storage/) Decentralized file storage

## Fund Management Example

> **Important:** This Fund Management example is **not related to this assignment**. It is meant to show you an example of contract specification. Your job is to create similar specifications for your Auction House dApp. 

The Fund Management dApp allows people to deposit ETH into decentralized fund, and in return the fund will issue ERC20 tokens to represent the fund's shares. In other words, people can buy ERC20 tokens from the fund. The price is 1 FMD = 0.1ETH. The minimum ETH to spend to become a stakeholder is 0.1ETH.

The fund manager (admin) can create new spending requests in benefit of the fund, such as paying for building new software or hiring new employees. The stakeholders can then vote on such proposals. If the minimum approval votes (75% of all tokens) have been met, the admin can execute the spending, which send the ETH to a given address.

Here is the contract specification example:

![Example](./media/example.png)
