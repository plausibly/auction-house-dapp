"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Box, Button, Container, Grid, Switch, TextField } from "@mui/material";
import Typography from "@mui/material/Typography";
import Header from "../../components/Header";
import { useLoginContext } from "@/contexts/LoginContextProvider";
import { CoinServiceProvider } from "../../services/coin";

export default function Mint() {
  const state = useLoginContext().state;

  const [items, setItems] = useState(1);
  const [auc, setAuc] = useState("0");

  // input box
  const [toMint, setMintAmnt] = useState(0);

  //todo input validation
  //todo force login

  const coinService = useMemo(() => new CoinServiceProvider(state.address, state.provider, state.signer), [state.address, state.provider, state.signer]);

  // AUC Amount
  useEffect(() => {
    if (state.isLoggedIn) {
      coinService.getAUC().then(f => setAuc(f.toString()));
    }
  }, [state, coinService]);


  // item metadata for each minted in an erc-721 contract
  let itemInputs: Array<React.JSX.Element> = [];
  for (let i = 0; i < items; i++) {
    itemInputs.push(
      <Grid item xs={8} key={i+1}>
        <Typography>Item {i+1}</Typography>
        <Box style={{ display: "flex" }}>
          <TextField
            sx={{ mb: 2 }}
            required
            label="Name"
            variant="standard"
            fullWidth
          />
          <TextField
            label="Description"
            variant="outlined"
            multiline
            fullWidth
            sx={{ mb: 2, ml: 2 }}
          />
        </Box>
        <Typography>Image</Typography>
        <input type="file" />
      </Grid>
    );
  }

  if (!state.isLoggedIn && !state.provider) {
    return (
      <>
      <Header/>
      <Typography variant="h5" sx={{m: 1, p: 2}}>Unauthorized. Please login</Typography></>
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
        </Grid>
        <Grid item xs={12} style={{ display: "flex" }}>
          <TextField
            sx={{ pr: 2 }}
            required
            label="Contract Name"
            variant="standard"
          />
          <TextField
            sx={{ pr: 2 }}
            required
            label="Token Symbol (3 Letters)"
            inputProps={{ maxLength: 3, style: { textTransform: "uppercase" } }}
            onKeyDown={(e) => {
              if (!/^[a-zA-Z]+$/.test(e.key)) {
                e.preventDefault();
              }
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
          <Button variant="contained">Create</Button>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ m: 1 }}>
        <Grid item xs={12}>
          <Typography variant="h5"> Mint AUC </Typography>
          <Typography variant="caption">
            If only they had material value.
          </Typography>

        </Grid>
        <Grid item alignItems="stretch" style={{ display: "flex" }}>
          <TextField
            id="standard-basic"
            label="Amount (in AUC)"
            variant="filled"
            type="number"
            inputProps={{min: 0}}
            onChange={(e) => setMintAmnt(Number(e.target.value))}
          />
          <Button onClick={() => coinService.mintAUC(toMint)} sx={{ ml: 1 }} variant="outlined">
            Mint
          </Button>
        </Grid>
        <Grid item xs={12}>
        <Typography>
            AUC Balance: {auc}
          </Typography>
        </Grid>
      </Grid>
    </div>
  );
}
