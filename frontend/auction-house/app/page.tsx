"use client";
import React from "react";
import { Grid } from "@mui/material";

import Typography from "@mui/material/Typography";
import Header from "../components/Header";
import LoginProvider from "@/components/LoginProvider";

export default function Home() {
  const state = LoginProvider().state;

  return (
    <div>
      <Header />
      <Grid>
        <Grid
          item
          xs={12}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography variant="h4">
            Welcome to the totally inconspicious auction house!
          </Typography>
          <Typography variant="caption">
            This is not a money laundering front. 
          </Typography>
        </Grid>

        {state.isLoggedIn ? (
          <Grid item sx={{ m: 2 }} xs={12}></Grid>
        ) : (
          <Typography sx={{ m: 5 }}>Please login to get started.</Typography>
        )}
      </Grid>
    </div>
  );
}
