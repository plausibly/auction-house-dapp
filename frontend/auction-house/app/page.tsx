"use client";
import React, { createContext, useContext } from "react";
import {
  Button,
  CssBaseline,
  Grid,
  TextField,
  ThemeProvider,
} from "@mui/material";

import Typography from "@mui/material/Typography";
import Header from "../components/Header";
import createTheme from "@mui/material/styles/createTheme";
import { LoginState } from "@/components/LoginProvider";
import { LoginContext } from "@/contexts/LoginContextProvider";


export default function Home() {
  let adminAddress = "placeholder";
  let currFee = 0; // convert Bp -> %
  let adminBalance = 0;
  let isAdmin = false;
  let isManager = false;


  // todo if !isAdmin and !isManager -> unauthorized

  return (
    <div>
      <Header />
      <Grid>
        <Grid item xs={12} sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Typography variant="h4">Welcome to the totally inconspicious auction house!</Typography>
          <Typography variant="caption">This is not a money laundering front. </Typography>
        </Grid>

        <Grid item xs={6}>
          <Typography>
            Ongoing Auctions
          </Typography>
        </Grid>
      </Grid>
    </div>
  );
}
