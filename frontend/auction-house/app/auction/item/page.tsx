"use client";
import Header from "@/components/Header";
import { Box, Button, Grid, Link, TextField, Typography } from "@mui/material";
import FallbackImage from "../../../public/question_mark.png";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AuctionItem, ItemMetadata } from "@/services/house";
import { useLoginContext } from "@/contexts/LoginContextProvider";
import { ethers } from "ethers";

export default function Item() {
  const state = useLoginContext().state;

  const [itemData, setItemData] = useState<AuctionItem>({
    seller: "0x0",
    contractId: "0x63D7245276Fb3162fbD2089B40CF6681721111ec",
    tokenId: BigInt(53),
    endTime: new Date(0),
    highestBid: BigInt(99),
    highestBidder:
      "0xef299f003732c0d6927f30aa9335d45ffbde0441afe94e00f589c6a9de2d0a3f",
    archived: false,
  });

  const [hasBidder, setHasBidder] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isArchived, setisArchived] = useState(false);
  const [bidAmt, setBidAmt] = useState(0);
  const [metadataUri, setMetadataUri] = useState("");
  const [isSeller, setIsSeller] = useState(false);

  const [itemMetadata, setMetadata] = useState<ItemMetadata>({
    name: "placeholder",
    description: "placeholder desc",
  });

  const etherscanUrl = "https://sepolia.etherscan.io/address/";
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  //todo force refresh on event

  useEffect(() => {
    setHasBidder(itemData.highestBidder !== zeroAddress);
    setIsSeller(ethers.getAddress(itemData.seller) === ethers.getAddress(state.address));
    // Mark as ended if date elapsed
    setIsRunning(itemData.endTime.getTime() > Date.now());

    // Archived if: 1) item claimed, 2) auction force ended/cancel by seller
    setisArchived(itemData.archived);

  }, [itemData, state.address]);

  return (
    <div>
      <Header />
      <Grid container>
        <Grid item xs={12} md={4}>
          <Box
            component="img"
            src={FallbackImage.src}
            sx={{
              height: 500,
              width: 500,
              ml: 4,
              mr: 4,
              mt: 4,
              p: 2,
              border: 3,
            }}
          ></Box>
        </Grid>
        <Grid item xs={12} md={4} sx={{ pt: 4 }}>
          <Typography variant="h4" sx={{ pb: 2 }}>
            Name: {itemMetadata.name}
          </Typography>
          <Typography sx={{ pb: 2 }}>
            Highest Bidder: {hasBidder ? itemData.highestBidder : "N/A"}
          </Typography>
          <Typography>
            {hasBidder ? "Highest Bid: " : "Starting Price: "}
            {itemData.highestBid.toString()}
          </Typography>

          {isRunning ? (
            <Box
              alignItems="stretch"
              sx={{ pt: 2 }}
              style={{ display: "flex" }}
            >
              <TextField
                id="standard-basic"
                label="Amount (in AUC)"
                variant="filled"
                type="number"
                inputProps={{ min: 0 }}
                onChange={(e) => setBidAmt(Number(e.target.value))}
                sx={{ pr: 1 }}
              />
              <Button variant="contained">Bid</Button>
            </Box>
          ) : (<>
            <Typography color="red" variant="h5" sx={{ pt: 2 }}>
              This auction has ended.
            </Typography>
            {
                !isArchived ? <Button variant="contained">Claim Items</Button>  : <></>
            }</>

          )}

          {/* Seller Only */}
          {
            !isArchived && isSeller ?          
            <Box sx={{ pt: 5 }}>
            <Typography variant="h5">Seller Management:</Typography>
            <Typography variant="caption">
              Cancelling the auction will not honor bids, items are refunded.
              Ending the auction will sell to the current highest bidder.
            </Typography>

            <Box>
              <Button disabled={!isRunning} sx={{ m: 2 }} color="error" variant="contained">
                Cancel Auction
              </Button>
              <Button variant="contained">End Auction</Button>
            </Box>
          </Box> : <></>
          }

        </Grid>
        <Grid item xs={12} sx={{ pt: 4, pl: 4 }}>
          <Typography sx={{ pb: 2 }}>
            Description: {itemMetadata.description}
          </Typography>

          <Typography sx={{ pb: 2 }}>Seller: {itemData.seller}</Typography>
          <Typography sx={{ pb: 2 }}>
            Contract ID:
            {
              <Link target="_blank" href={etherscanUrl + itemData.contractId}>
                {itemData.contractId}
              </Link>
            }
          </Typography>
          <Typography>Token ID: {itemData.tokenId.toString()}</Typography>
          <Typography sx={{ pt: 2 }}>
            End Date: {itemData.endTime.toString()}
          </Typography>
        </Grid>
      </Grid>
    </div>
  );
}
