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

  const inputRegex = "/^[a-zA-Z0-9-]+";

  const [items, setItems] = React.useState(1);

  let itemInputs: Array<React.JSX.Element> = [];

  //todo input validation
  

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
          />
          <Button sx={{ ml: 1 }} variant="outlined">
            Mint
          </Button>
        </Grid>
      </Grid>
    </div>
  );
}
