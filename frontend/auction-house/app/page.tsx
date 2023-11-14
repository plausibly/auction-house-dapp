"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Grid } from "@mui/material";

import Typography from "@mui/material/Typography";
import Header from "../components/Header";
import { AuctionItem, HouseServiceProvider } from "@/services/house";
import AuctionCard from "@/components/AuctionCard";
import { useLoginContext } from "@/contexts/LoginContextProvider";

export default function Home() {
  const state = useLoginContext().state;

  const [auctionCards, setAuctionCards] = useState<Array<any>>();

  const houseService = useMemo(
    () => new HouseServiceProvider(state.address, state.provider, state.signer),
    [state.address, state.provider, state.signer]
  );

  useEffect(() => {
    if (!state.isLoggedIn) {
      setAuctionCards([]);
      return;
    }

    houseService.getRecentAuctions(50).then((auctionItems) => {
      if (!auctionItems) {
        setAuctionCards([]);
        return;
      }

      let cards = [];

      for (let i = auctionItems.length - 1; i >= 0; i--) {
        // flip loop to show most recent
        cards.push(
          <AuctionCard key={i} id={i} itemData={auctionItems[i]} />
        );
      }
      setAuctionCards(cards);

    });

  }, [houseService, state, auctionCards]);


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
