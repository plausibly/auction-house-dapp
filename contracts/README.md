# Auction House

To deploy this project, create a file called `_env.ts` in the root directory and provide the following:

```
export const ADMIN_ADDRESS = <YOUR ADDRESS TO USE AS ADMIN>;
export const PRIVATE_KEY = <Deployer private key>;
export const ALCHEMY_API_KEY = <API Key>;
```

Optionally, you may edit the `hardhat.config.ts` file and provide your own details.


The default configuration will deploy the ERC-20 contract (AUC currency) and the house contract onto the Sepolia test network.

```
npx hardhat run scripts/deploy.ts --network sepolia
```


Tests can be ran with:

```
npx hardhat test
```
