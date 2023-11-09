"use client";
import React from "react";
import { Box, Button, Container, Grid, Switch, TextField } from "@mui/material";
import Typography from "@mui/material/Typography";
import Header from "../../components/Header";

export default function Mint() {
  let adminAddress = "placeholder";
  let currFee = 0; // convert Bp -> %
  let adminBalance = 0;
  let isAdmin = false;
  let isManager = false;

  const loginAddress = "0x0";
  // todo if !isAdmin and !isManager -> unauthorized

  return (
    <div>
      <Header />

      <Grid container spacing={3} sx={{ m: 1 }}>
        <Grid item xs={12}>
          <Typography variant="h5"> Mint an item</Typography>
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
            label="Token Symbol"
            variant="standard"
          />
          <TextField required label="Name" variant="standard" />
        </Grid>

        <Grid item xs={6}>
          <TextField
            label="Description"
            variant="outlined"
            multiline
            maxRows={3}
            minRows={3}
            fullWidth
          />
        </Grid>

        <Grid item xs={12}>
          <Typography>Image</Typography>
          <input type="file" />
          <Button variant="contained">Create</Button>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ m: 1 }}>
        <Grid item xs={12}>
          <Typography variant="h5"> Mint AUC </Typography>
        </Grid>
        <Grid item alignItems="stretch" style={{ display: "flex" }}>
          <TextField
            id="standard-basic"
            label="Amount (in AUC)"
            variant="filled"
          />
          <Button sx={{ ml: 1 }} variant="outlined">
            Mint
          </Button>
        </Grid>
      </Grid>
    </div>
  );
}
