"use client";
import React, { useState, useEffect } from "react";
import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import BalanceWallet from "@mui/icons-material/AccountBalanceWallet";

import { ethers } from "ethers";
import { useLoginContext } from "@/contexts/LoginContextProvider";

async function HandleLogin() {
  const { ethereum } = window;
  let provider;
  ethers.BrowserProvider;
  let signer: ethers.JsonRpcSigner | undefined;
  if (localStorage.hasOwnProperty("IsLoggedIn")) {
    return;
  }
  if (ethereum == null) {
    alert("No wallet extension detected.");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();

  localStorage.setItem("IsLoggedIn", "true");
  localStorage.setItem("Provider", JSON.stringify(provider));
  localStorage.setItem("Signer", JSON.stringify(signer));

  return { provider, signer };
}

export default function Header() {
  const { login, logout, state } = useLoginContext();

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ flexWrap: "wrap" }}>
        {state.isLoggedIn ? (
          <Typography variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
            Address: {state.address}, AUC: 0
          </Typography>
        ) : (
          <Typography variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
            [..]
          </Typography>
        )}

        <Link sx={{ my: 1, mx: 1.5, textDecoration: "none" }} href="/">
          Home
        </Link>
        <Link sx={{ my: 1, mx: 1.5, textDecoration: "none" }} href="/mint">
          Mint
        </Link>
        <Link
          sx={{ my: 1, mx: 1.5, textDecoration: "none" }}
          href="/auction/create"
        >
          Auction
        </Link>
        <Link
          sx={{ my: 1, mx: 1.5, textDecoration: "none" }}
          href="/management"
        >
          Management
        </Link>
        {state.isLoggedIn ? (
          <Button
            onClick={logout}
            variant="outlined"
            startIcon={<BalanceWallet />}
            sx={{ my: 1, mx: 1.5, borderRadius: 12 }}
          >
            <Typography sx={{ pl: 0.05 }}>Logout</Typography>{" "}
          </Button>
        ) : (
          <Button
            onClick={login}
            variant="outlined"
            startIcon={<BalanceWallet />}
            sx={{ my: 1, mx: 1.5, borderRadius: 12 }}
          >
            <Typography sx={{ pl: 0.05 }}>Connect</Typography>
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
