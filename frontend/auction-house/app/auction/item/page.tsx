"use client";
import Header from "@/components/Header";
import { Box, Button, Grid, Link, TextField, Typography } from "@mui/material";
import FallbackImage from "../../../public/question_mark.png";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AuctionItem, HouseServiceProvider } from "@/services/house";
import { useLoginContext } from "@/contexts/LoginContextProvider";
import { ethers } from "ethers";
import { useSearchParams } from "next/navigation";
import { notFound } from "next/navigation";
import { ItemServiceProvider } from "@/services/item";

export default function Item() {
  const itemId = useSearchParams().get("id");

  const state = useLoginContext().state;

  const [itemData, setItemData] = useState<AuctionItem>({
    // error placeholder
    seller: "",
    contractId: "",
    tokenId: BigInt(0),
    endTime: new Date(0),
    highestBid: BigInt(0),
    highestBidder:"",
    archived: false,
  });

  const [hasBidder, setHasBidder] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isArchived, setisArchived] = useState(false);
  const [bidAmt, setBidAmt] = useState(0);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [imgSrc, setImgSrc] = useState(FallbackImage.src);
  const [isSeller, setIsSeller] = useState(false);

  const etherscanUrl = "https://sepolia.etherscan.io/address/";
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  const houseProvider = useMemo(() => new HouseServiceProvider(state.address, state.provider, state.signer), [state.address, state.provider, state.signer]);

  useEffect(() => {
    if (itemId == null || itemId == undefined) {
      return;
    }
    const data = houseProvider.getAuctionObject(Number(itemId)).then(d => {
      if (d && ethers.isAddress(d.contractId)) {
        setItemData(d);
        setHasBidder(itemData.highestBidder !== zeroAddress);
        // setIsSeller(ethers.getAddress(itemData.seller) === ethers.getAddress(state.address));
        // Mark as ended if date elapsed
        setIsRunning(itemData.endTime.getTime() > Date.now());
    
        // Archived if: 1) item claimed, 2) auction force ended/cancel by seller
        setisArchived(itemData.archived);

        const itemProvider = new ItemServiceProvider(d.contractId, state.address, state.provider, state.signer);
      }
    });
  }, [itemData, state, houseProvider, itemId]);

  if (!state.isLoggedIn || itemId === null || itemId === undefined || itemData.seller === zeroAddress) {
    // 404 if the item id is not provided, or the auction data is 0x0
    return notFound(); 
  }

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
            Name: {name}
          </Typography>
          <Typography sx={{ pb: 2 }}>
            Highest Bidder: {hasBidder ? itemData.highestBidder : "N/A"}
          </Typography>
          <Typography>
            {hasBidder ? "Highest Bid: " : "Starting Price: "}
            { (Number(itemData.highestBid) / 10**18).toString()}
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
            Description: {desc}
          </Typography>

          <Typography sx={{ pb: 2 }}>Seller: {itemData.seller}</Typography>
          <Typography sx={{ pb: 2 }}>
            Contract ID: {" "}
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
