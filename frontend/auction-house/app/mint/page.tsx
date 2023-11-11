"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Box, Button, Container, Grid, Switch, TextField } from "@mui/material";
import Typography from "@mui/material/Typography";
import Header from "../../components/Header";
import { useLoginContext } from "@/contexts/LoginContextProvider";
import { CoinServiceProvider } from "../../services/coin";
import { NFTStorage, File } from "nft.storage";
import { NFT_STORAGE_API } from "@/_env";
import { Contract, ethers } from "ethers";
import { ContractFactory } from "ethers";
import AuctionHouseItem from "../../../../contracts/artifacts/contracts/AuctionHouseItem.sol/AuctionHouseItem.json";
import { ItemServiceProvider } from "@/services/item";

interface NFTInput {
  cname: string;
  symbol: string;
  itemNames: Array<string>;
  itemDescs: Array<string>;
  images: Array<File>;
}

export default function Mint() {
  const state = useLoginContext().state;
  const coinService = useMemo(
    () => new CoinServiceProvider(state.address, state.provider, state.signer),
    [state.address, state.provider, state.signer]
  );

  const [numberItems, setItems] = useState(1);
  const [isBtnDisabled, setIsDisabled] = useState(true);

  // input box (mint auc)
  const [toMint, setMintAmnt] = useState(0);

  // NFT minting
  const [nftForm, setNftForm] = useState<NFTInput>({
    cname: "",
    symbol: "",
    itemNames: [],
    itemDescs: [],
    images: [],
  });

  useEffect(() => {
    let form = nftForm;

    // clear inputs if items is decreased
    form.images = form.images.slice(0, numberItems);
    form.itemNames = form.itemNames.slice(0, numberItems);
    form.itemDescs = form.itemNames.slice(0, numberItems);

    // disable button if inputs are missing
    setIsDisabled(
      nftForm.cname.length === 0 ||
      numberItems === 0 ||
      nftForm.symbol.length === 0 ||
      nftForm.itemNames.length !== nftForm.itemDescs.length ||
      nftForm.itemNames.length !== numberItems ||
      nftForm.images.length !== numberItems);

    setNftForm(form);
    
  }, [numberItems, nftForm, isBtnDisabled]);

  const [banner, setBanner] = useState({ color: "white", msg: "" });

  const formHandler = async () => {
    for (let i of nftForm.images) {
      if (!i) {
        setBanner({
          color: "red",
          msg: "Please ensure valid images are set for all items",
        });
        return;
      }
    }

    try {
      setBanner({
        color: "green",
        msg: "Creating ERC-721 contract... please wait",
      });

      const contractFactory = new ContractFactory(
        AuctionHouseItem.abi,
        AuctionHouseItem.bytecode,
        state.signer
      );
      // pass name & symbol thru constructor
      const contract = await contractFactory.deploy(
        nftForm.cname,
        nftForm.symbol
      );
      await contract.waitForDeployment();
      const contractAddress = await contract.getAddress();

      setBanner({
        color: "green",
        msg: "Contract created. Minting items... please wait",
      });

      const nftStorage = new NFTStorage({ token: NFT_STORAGE_API });

      // stringified JSON, will be uploaded to nft storage
      let nftUrls: Array<string> = [];

      for (let i = 0; i < numberItems; i++) {
        const store = await nftStorage.store({
          name: nftForm.itemNames[i],
          description: nftForm.itemDescs[i],
          image: nftForm.images[i],
        });

        nftUrls.push(store.url);
        console.log("url: " + store.url);
      }

      //TODO TEST THIS AGAIN
      const contractConnection = new ItemServiceProvider(
        contractAddress,
        state.address,
        state.provider,
        state.signer
      );
      await contractConnection.bulkMint(nftUrls);

      setBanner({
        color: "green",
        msg: `Minted ${numberItems} items and deployed ERC-721 to address: ${contractAddress}`,
      });
    } catch (err) {
      setBanner({ color: "red", msg: "An error occurred" });
      console.error(err);
    }
  };

  // item metadata for each minted in an erc-721 contract
  let itemInputs: Array<React.JSX.Element> = [];
  for (let i = 0; i < numberItems; i++) {
    itemInputs.push(
      <Grid item xs={8} key={i + 1}>
        <Typography>Item {i + 1}</Typography>
        <Box style={{ display: "flex" }}>
          <TextField
            sx={{ mb: 2 }}
            onChange={(e) => {
              let arr = nftForm.itemNames;
              arr[i] = e.target.value;
              setNftForm({ ...nftForm, itemNames: arr });
            }}
            required
            label="Name"
            variant="standard"
            fullWidth
          />
          <TextField
            label="Description"
            required
            onChange={(e) => {
              let arr = nftForm.itemDescs;
              arr[i] = e.target.value;
              setNftForm({ ...nftForm, itemDescs: arr });
            }}
            variant="outlined"
            multiline
            fullWidth
            sx={{ mb: 2, ml: 2 }}
          />
        </Box>
        <Typography>Image</Typography>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            let arr = nftForm.images;
            arr[i] = (e.target.files as FileList)[0];
            setNftForm({ ...nftForm, images: arr });
          }}
        />
      </Grid>
    );
  }

  if (!state.isLoggedIn && !state.provider) {
    return (
      <>
        <Header />
        <Typography variant="h5" sx={{ m: 1, p: 2 }}>
          Unauthorized. Please login
        </Typography>
      </>
    );
  }

  return (
    <div>
      <Header />

      <Grid container spacing={3} sx={{ m: 1 }}>
        <Grid item xs={12}>
          <Typography variant="h5"> NFT Creation </Typography>
          <Typography variant="caption">
            Metadata will be uploaded to nft.storage
          </Typography>
          <Typography
            variant="h6"
            color={banner.color ? banner.color : "white"}
            sx={{ pt: 2 }}
          >
            {banner.msg}
          </Typography>
        </Grid>
        <Grid item xs={12} style={{ display: "flex" }}>
          <TextField
            sx={{ pr: 2 }}
            required
            label="Contract Name"
            variant="standard"
            onChange={(e) => {
              setNftForm({ ...nftForm, cname: e.target.value });
            }}
          />
          <TextField
            sx={{ pr: 2 }}
            required
            label="Token Symbol"
            inputProps={{ style: { textTransform: "uppercase" } }}
            onKeyDown={(e) => {
              if (!/^[a-zA-Z]+$/.test(e.key)) {
                e.preventDefault();
              }
            }}
            onChange={(e) => {
              setNftForm({ ...nftForm, symbol: e.target.value });
            }}
            variant="standard"
          />
          <TextField
            sx={{ pr: 5 }}
            required
            label="# of Items"
            type="number"
            inputProps={{ min: 1, max: 20 }}
            defaultValue={1}
            onChange={(e) => setItems(Number(e.target.value))}
            variant="standard"
          />
        </Grid>

        {itemInputs}

        <Grid item xs={12}>
          <Button
            variant="contained"
      
            disabled={isBtnDisabled}
            onClick={() => formHandler()}
          >
            Create
          </Button>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ m: 1 }}>
        <Grid item xs={12}>
          <Typography variant="h5"> Mint AUC </Typography>
          <Typography variant="caption">
            If only they had material value
          </Typography>
        </Grid>
        <Grid item alignItems="stretch" style={{ display: "flex" }}>
          <TextField
            id="standard-basic"
            label="Amount (in AUC)"
            variant="filled"
            type="number"
            inputProps={{ min: 0 }}
            onChange={(e) => setMintAmnt(Number(e.target.value))}
          />
          <Button
            onClick={() => coinService.mintAUC(toMint)}
            sx={{ ml: 1 }}
            variant="outlined"
          >
            Mint
          </Button>
        </Grid>
      </Grid>
    </div>
  );
}
