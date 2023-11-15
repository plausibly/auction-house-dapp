"use client";
import Header from "@/components/Header";
import { Button, Grid, TextField, Typography } from "@mui/material"
import { useState } from "react";
import { ethers } from "ethers";
import { ItemServiceProvider } from "@/services/item";
import { HouseServiceProvider } from "@/services/house";
import { useLoginContext } from "@/contexts/LoginContextProvider";

export default function Create() {
  const state = useLoginContext().state;

  const [banner, setBanner] = useState("");
  const [addr, setAddr] = useState("");
  const [tokenId, setId] = useState<number>();
  const [date, setDate] = useState<Date>();
  const [price, setPrice] = useState<number>();

  const inputHandler = async () => {
    setBanner("Processing...");

    if (!date || !addr || tokenId === undefined || tokenId === null || !price) {
      setBanner("Ensure all fields are set");
      return;
    }

    if (!ethers.isAddress(addr)) {
      setBanner("Invalid contract address");
      return;
    }

    if (price <= 0) {
      setBanner("Starting price must be greater than 0");
      return;
    }

    if (date.getTime() < Date.now()) {
      setBanner("End date must be in the future");
      return;
    }

    try {
      const itemProvider = new ItemServiceProvider(addr, state.address, state.provider, state.signer);
      if (!(await itemProvider.isOwner(tokenId))) {
        setBanner("Invalid token. Ensure you own the token ");
        return;
      }

      const houseProvider = new HouseServiceProvider(state.address, state.provider, state.signer);

      // approve house to transfer nft
      const tx = await itemProvider.approve(tokenId, await houseProvider.getContract().getAddress());
      setBanner("Waiting for house to be approved to transfer NFT. Do not refresh this page");

      await tx.wait();

      setBanner("Creating auction...");

      await houseProvider.createAuction(addr, tokenId, price, date);

      setBanner("Auction request sent. The auction will show up on the home page once the transaction is confirmed.");


    } catch (err) {
      setBanner("Failed to create auction. Ensure token is valid and that you are permitted to transfer it. ");
      console.log(err);
    }
  };

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
          <Typography variant="h5">Create an Auction</Typography>
          <Typography sx={{pt: 3}} variant="h6" color="red"> {banner} </Typography>
        </Grid>
        <Grid item xs={6} style={{ display: "flex" }}>
          <TextField
            sx={{ pr: 2 }}
            required
            label="NFT Contract Address"
            fullWidth
            variant="standard"
            onChange={(e) => setAddr(e.target.value)}
          />
          <TextField
            sx={{ pr: 2 }}
            required
            type="number"
            label="Token ID"
            variant="standard"
            inputProps={{min: 0}}
            onChange={(e) => setId(Number(e.target.value))}
          />
        </Grid>

        <Grid item xs={12}>
            <TextField required type="number" label="Starting Price (AUC)" inputProps={{min:0}} variant="standard" onChange={(e) => setPrice(Number(e.target.value))} sx={{pr: 2}} />
            <TextField required type="date" label="End Date" onChange={(e) => setDate(new Date(e.target.value))} InputLabelProps={{ shrink: true }}  sx={{ svg: { color: 'red' } }}/>

        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" disabled={addr.length === 0 || !date || !price} onClick={() => inputHandler()}>Create</Button>
        </Grid>
        <Grid item xs={5}>
        <Typography color="white" variant="caption">(*) By clicking create you agree to the following terms and condition(s): </Typography>
        <Typography variant="caption">{`The house ("smart contract", "dapp", "website", "administrator", "service") has full ownership of all assets ("AUC", "ERC-721", "NFT") exchanged
        on this service. By "auctioning" an asset, you are requesting the house to advertise an item for you, and take bids for you. The house has no obligation
        to honor any bids ("sales"). The house will provide the illusion of control over such assets, but the house is the underlying owner of any
        assets transferred to it. The house has the right to change the associated smart contract address of this service at any time, and the house has the right to "exit scam", in which case all items will be taken by the "admin address".
        Should the house decide to honor an auction, any "sales" are subject to fee(s) set by the house, these fees may change at any time and are not greater than 100%. `}</Typography>
        </Grid>
      </Grid>
    </div>
  );
}
