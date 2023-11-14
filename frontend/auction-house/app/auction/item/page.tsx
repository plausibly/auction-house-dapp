"use client";
import Header from "@/components/Header";
import { Box, Button, Grid, Link, TextField, Typography } from "@mui/material";
import FallbackImage from "@/public/question_mark.png";
import { useEffect, useMemo, useState } from "react";
import { AuctionItem, HouseServiceProvider } from "@/services/house";
import { useLoginContext } from "@/contexts/LoginContextProvider";
import { ethers } from "ethers";
import { useSearchParams } from "next/navigation";
import { ItemServiceProvider } from "@/services/item";
import { CoinServiceProvider } from "@/services/coin";
import { getGatewayIpfs, ipfsFetch } from "@/utils/ipfshelper";

function normalizeBid(val: BigInt) {
  return Number(val) / 10 ** 18;
}

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
    highestBidder: "",
    archived: false,
  });

  const [hasBidder, setHasBidder] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isArchived, setisArchived] = useState(false);
  const [bidAmt, setBidAmt] = useState(0);
  const [isSeller, setIsSeller] = useState(false);
  const [loweredPrice, setLoweredPrice] = useState(0);

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [imgSrc, setImgSrc] = useState(FallbackImage.src);

  const [banner, setBanner] = useState("");

  const etherscanUrl = "https://sepolia.etherscan.io/address/";
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  const houseProvider = useMemo(
    () => new HouseServiceProvider(state.address, state.provider, state.signer),
    [state.address, state.provider, state.signer]
  );
  const coinProvider = useMemo(
    () => new CoinServiceProvider(state.address, state.provider, state.signer),
    [state.address, state.provider, state.signer]
  );

  const handleHouseError = (err: any) => {
    if (err.data) {
      const errDecode = houseProvider
        .getContract()
        .interface.parseError(err.data);
      setBanner("An error occurred: " + errDecode?.args);
    } else {
      setBanner("An error occurred. ");
    }
  };

  // load metadata
  useEffect(() => {
    if (itemData && itemData.contractId.length > 0) {
      const itemProvider = new ItemServiceProvider(
        itemData.contractId,
        state.address,
        state.provider,
        state.signer
      );

      itemProvider.getMetadataUri(itemData.tokenId).then((f) => {
        ipfsFetch(f).then((data) => {
          if (data) {
            setName(data.name);
            setDesc(data.description);
            setImgSrc(getGatewayIpfs(data.image));
          }
        });
      });
    }
  }, [imgSrc, name, desc, state, itemData]);

  useEffect(() => {
    if (itemId == null || itemId == undefined) {
      return;
    }

    houseProvider
      .getAuctionObject(Number(itemId))
      .then((d) => {
        if (d && ethers.isAddress(d.contractId)) {
          setItemData(d);
          setHasBidder(itemData.highestBidder !== zeroAddress);

          if (ethers.isAddress(itemData.seller)) {
            setIsSeller(
              ethers.getAddress(itemData.seller) ===
                ethers.getAddress(state.address)
            );
          }
          // Mark as ended if date elapsed
          setIsRunning(
            !itemData.archived && itemData.endTime.getTime() > Date.now()
          );

          // Archived if: 1) item claimed, 2) auction force ended/cancel by seller
          setisArchived(itemData.archived);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }, [itemData, state, houseProvider, itemId]);

  const cancelAuction = async () => {
    try {
      setBanner("Sending cancellation request...");
      await houseProvider.cancelAuction(Number(itemId));
      setBanner("Cancellation request has been sent, pending confirmation.");
    } catch (err: any) {
      handleHouseError(err);
      console.error(err);
    }
  };

  const endAuction = async () => {
    try {
      setBanner("Sending request to end auction...");
      await houseProvider.endAuction(Number(itemId));
      setBanner("Request has been sent, pending confirmation.");
    } catch (err: any) {
      handleHouseError(err);
      console.error(err);
    }
  };

  const claimItems = async () => {
    try {
      setBanner("Sending request to claim items...");
      await houseProvider.claimItems(Number(itemId));
      setBanner(
        "Request has been sent. Transfers will complete for the buyer/seller after transaction is confirmed."
      );
    } catch (err: any) {
      handleHouseError(err);
      console.error(err);
    }
  };

  const lowerPrice = async () => {
    setBanner("Requesting to lower price. Please approve the transaction");
    try {
      const tx = await houseProvider.lowerPrice(Number(itemId), loweredPrice);
      setBanner(
        "Request has been sent. Price will be lowered once transaction is confirmed"
      );
    } catch (err: any) {
      handleHouseError(err);
      console.error(err);
    }
  };

  const handleBid = async () => {
    const highestBid = normalizeBid(itemData.highestBid);

    if (itemData.highestBidder === zeroAddress && bidAmt < highestBid) {
      setBanner("Bid cannot be less than starting price");
      return;
    }

    if (itemData.highestBidder !== zeroAddress && bidAmt <= highestBid) {
      setBanner("Bid must be greater than the current bid");
      return;
    }

    setBanner("Processing bid... Please approve the house to transfer AUC.");

    try {
      const approve = await coinProvider.approve(
        bidAmt,
        await houseProvider.getContract().getAddress()
      );

      setBanner("Waiting for approval. Do not refresh this page");

      await approve.wait();
    } catch (err: any) {
      if (err.data) {
        const errDecode = coinProvider
          .getContract()
          .interface.parseError(err.data);
        setBanner("An error occurred: " + errDecode?.args);
      } else {
        setBanner("An error occurred. ");
      }
      console.error(err);
      return;
    }

    setBanner("Processing bid... please confirm the transfer");

    try {
      setBanner("Bid is processing..");
      await houseProvider.placeBid(Number(itemId), bidAmt);
      setBanner(
        "Bid sent. Auction will be updated upon transaction confirmation."
      );
    } catch (err: any) {
      handleHouseError(err);
      console.error(err);
      return;
    }
  };

  if (
    !state.isLoggedIn ||
    itemId === null ||
    itemId === undefined ||
    itemData.seller === zeroAddress
  ) {
    return (
      <>
        <Header />
        <Typography>Auction does not exist.</Typography>
      </>
    );
  }

  return (
    <div>
      <Header />
      <Grid container>
        <Grid item xs={12} md={4}>
          <Box
            component="img"
            src={imgSrc}
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
            {normalizeBid(itemData.highestBid)}
          </Typography>
          <Typography color="red" sx={{ pt: 2 }}>
            {banner}
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
              <Button variant="contained" onClick={handleBid}>
                Bid
              </Button>
            </Box>
          ) : (
            <>
              <Typography color="red" variant="h5" sx={{ pt: 2 }}>
                Auction has ended.{" "}
                {!isArchived && hasBidder ? "The bidder may claim items." : ""}
                {isArchived
                  ? "Items have been transferred to the rightful owner(s)."
                  : ""}
              </Typography>
              {!isArchived ? (
                <Button variant="contained" onClick={claimItems}>
                  Claim Items
                </Button>
              ) : (
                <></>
              )}
            </>
          )}

          {/* Seller Only */}
          {!isArchived && isSeller ? (
            <Box sx={{ pt: 5 }}>
              <Typography variant="h5">Seller Management:</Typography>
              <Typography variant="caption">
                Cancelling the auction will not honor bids, items are refunded.
                Ending the auction will sell to the current highest bidder.
              </Typography>

              <Box>
                <Button
                  disabled={!isRunning}
                  sx={{ m: 2 }}
                  color="error"
                  variant="contained"
                  onClick={cancelAuction}
                >
                  Cancel Auction
                </Button>
                <Button variant="contained" onClick={endAuction}>
                  End Auction
                </Button>
              </Box>
              <Box
                alignItems="stretch"
                sx={{ pt: 2 }}
                style={{ display: "flex" }}
              >
                <TextField
                  id="standard-basic"
                  label="New Price (AUC)"
                  variant="filled"
                  type="number"
                  inputProps={{ min: 0 }}
                  onChange={(e) => setLoweredPrice(Number(e.target.value))}
                  sx={{ pr: 1 }}
                />{" "}
                {!hasBidder ? (
                  <Button
                    variant="contained"
                    disabled={
                      loweredPrice >= normalizeBid(itemData.highestBid) ||
                      loweredPrice === 0
                    }
                    onClick={lowerPrice}
                  >
                    Lower
                  </Button>
                ) : (
                  <></>
                )}
              </Box>
            </Box>
          ) : (
            <></>
          )}
        </Grid>
        <Grid item xs={12} sx={{ pt: 4, pl: 4 }}>
          <Typography sx={{ pb: 2 }}>Description: {desc}</Typography>

          <Typography sx={{ pb: 2 }}>Seller: {itemData.seller}</Typography>
          <Typography sx={{ pb: 2 }}>
            Contract ID:{" "}
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
