"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Grid } from "@mui/material";

import Typography from "@mui/material/Typography";
import Header from "../components/Header";
import LoginProvider from "@/components/LoginProvider";
import { AuctionItem, HouseServiceProvider } from "@/services/house";
import AuctionCard from "@/components/AuctionCard";

export default function Home() {
  const state = LoginProvider().state;

  const [auctionItems, setItemsList] = useState<Array<AuctionItem>>([]);

  const houseService = useMemo(
    () => new HouseServiceProvider(state.address, state.provider, state.signer),
    [state.address, state.provider, state.signer]
  );

  useEffect(() => {
    houseService.getRecentAuctions(50).then((f) => {
      if (f) {
        setItemsList(f);
      } else {
        setItemsList([]);
      }
    });
  }, [houseService, auctionItems]);

  let auctionCards = [];

  for (let i = 0; i < auctionItems.length; i++) {
    auctionCards.push(
      <AuctionCard key={i} id={i} itemData={auctionItems[i]} />
    );
  }

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
          <Grid item sx={{ m: 2, display: "flex" }} xs={12}>
            {auctionCards}
          </Grid>
        ) : (
          <Typography sx={{ m: 5 }}>Please login to get started.</Typography>
        )}
      </Grid>
    </div>
  );
}
