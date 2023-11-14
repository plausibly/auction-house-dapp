"use client";
import Header from "@/components/Header";
import { Button, Grid, TextField, Typography } from "@mui/material"
import { useState } from "react";
import { ethers } from "ethers";
import { ItemServiceProvider } from "@/services/item";
import LoginProvider from "@/components/LoginProvider";
import { HouseServiceProvider } from "@/services/house";

export default function Create() {
  const state = LoginProvider().state;

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
      </Grid>
    </div>
  );
}
