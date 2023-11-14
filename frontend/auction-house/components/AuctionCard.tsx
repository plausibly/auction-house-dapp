import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import { CardActionArea, Link } from "@mui/material";
import { AuctionItem } from "@/services/house";
import { useEffect, useState } from "react";
import FallbackImage from "@/public/question_mark.png";
import { getGatewayIpfs, ipfsFetch } from "@/utils/ipfshelper";
import { ItemServiceProvider } from "@/services/item";
import { useLoginContext } from "@/contexts/LoginContextProvider";

function normalizeBid(val: BigInt) {
  return Number(val) / 10 ** 18;
}

export default function AuctionCard({ id = -1, itemData = {} as AuctionItem }) {
  const state = useLoginContext().state;
  const itemLink = "auction/item?id=" + id;
  const hasBidder =
    itemData.highestBidder !== "0x0000000000000000000000000000000000000000";

  const [name, setName] = useState("This is an auction item");
  const [img, setImg] = useState(FallbackImage.src);

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
            setImg(getGatewayIpfs(data.image));
          }
        });
      });
    }
  }, [img, name, state, itemData]);

  return (
    <Card sx={{ width: 350, m: 2 }}>
      <CardActionArea component={Link} href={itemLink}>
        <CardMedia
          component="img"
          height="140"
          image={img}
          alt="auction image"
        />
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {name.substring(0, 100)} {name.length > 100 ? "..." : ""}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {hasBidder ? "Highest Bid: " : "Starting Price: "}
            {normalizeBid(itemData.highestBid)}
          </Typography>
          {!itemData.archived ? (
            <Typography variant="body2" color="text.secondary">
              Ends on: {itemData.endTime.toString()}
            </Typography>
          ) : (
            <Typography sx={{ pt: 2 }} variant="body1" color="text.secondary">
              This auction has ended.
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
