"use client";
import React, { useState, useEffect } from "react";
import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import BalanceWallet from "@mui/icons-material/AccountBalanceWallet";
import { useLoginContext } from "@/contexts/LoginContextProvider";
import { CoinServiceProvider } from "@/app/services/coin";

export default function Header() {
  const { login, logout, state } = useLoginContext();
  let coinService: CoinServiceProvider | undefined = undefined;

  const [auc, setAuc] = useState("0");

  if (state.isLoggedIn && state.provider) {
    coinService = new CoinServiceProvider(state.address, state.provider);
  }

  useEffect(() => {
    if (state.isLoggedIn && coinService) {
      coinService.getAUC().then(f => setAuc(f.toString()));
    }
    
  }, [state, coinService]);

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ flexWrap: "wrap" }}>
        {state.isLoggedIn ? (
          <Typography variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
            Address: {state.address}, AUC: {auc}
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
