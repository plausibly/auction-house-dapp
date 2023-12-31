"use client";
import React, { useState, useEffect } from "react";
import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import BalanceWallet from "@mui/icons-material/AccountBalanceWallet";
import { useLoginContext } from "@/contexts/LoginContextProvider";
import { CoinServiceProvider } from "@/services/coin";
import { HouseServiceProvider } from "@/services/house";

export default function Header() {
  const { login, logout, state } = useLoginContext();
  let coinService: CoinServiceProvider | undefined;
  let houseService: HouseServiceProvider | undefined;

  const [auc, setAuc] = useState("0");

  // for show/hiding "Management" tab (admin is also a manager)
  const [isManager, setManager] = useState(false);

  if (state.isLoggedIn && state.provider) {
    coinService = new CoinServiceProvider(state.address, state.provider);
    houseService = new HouseServiceProvider(state.address, state.provider);
  }

  useEffect(() => {
    if (state.isLoggedIn) {
      if (coinService) {
        coinService.getAUC().then((f) => setAuc(f.toString()));
      }
      if (houseService) {
        houseService.isManager().then((f) => setManager(f));
      }
    } else {
      setManager(false);
    }
  }, [state, coinService, houseService, auc]);

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
        {isManager ? (
          <Link
            sx={{ my: 1, mx: 1.5, textDecoration: "none" }}
            href="/management"
          >
            Management
          </Link>
        ) : (
          <></>
        )}
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
