"use client";
import Header from "@/components/Header";
import { Button, Grid, TextField, Typography } from "@mui/material"
import { useState } from "react";

export default function Create() {

  const [banner, setBanner] = useState("");
  const [addr, setAddr] = useState("");
  const [tokenId, setId] = useState("");
  const [date, setDate] = useState<Date>();
  const [price, setPrice] = useState<number>();

  const inputHandler = async () => {

    if (price && price <= 0) {
      setBanner("Starting price must be greater than 0");
    }
  };
  
  return (
    <div>
      <Header />
      <Grid container spacing={3} sx={{ m: 1 }}>
        <Grid item xs={12}>
          <Typography variant="h5">Create an Auction</Typography>
          <Typography sx={{pt: 3}} variant="h6"> {banner} </Typography>
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
            onChange={(e) => setId(e.target.value)}
          />
        </Grid>

        <Grid item xs={12}>
            <TextField required type="number" label="Starting Price (AUC)" inputProps={{min:0}} variant="standard" onChange={(e) => setPrice(Number(e.target.value))} sx={{pr: 2}} />
            <TextField required type="date" label="End Date" onChange={(e) => setDate(new Date(e.target.value))} InputLabelProps={{ shrink: true }}  sx={{ svg: { color: 'red' } }}/>

        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" disabled={addr.length === 0 || tokenId.length === 0 || !date || !price} onClick={() => inputHandler()}>Create</Button>

        </Grid>
      </Grid>
    </div>
  );
}
