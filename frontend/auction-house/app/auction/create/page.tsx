import Header from "@/components/Header";
import { Button, Grid, TextField, Typography } from "@mui/material"

export default function Create() {
  return (
    <div>
      <Header />
      <Grid container spacing={3} sx={{ m: 1 }}>
        <Grid item xs={12}>
          <Typography variant="h5">Create an Auction</Typography>
        </Grid>
        <Grid item xs={6} style={{ display: "flex" }}>
          <TextField
            sx={{ pr: 2 }}
            required
            label="NFT Contract Address"
            fullWidth
            variant="standard"
          />
          <TextField
            sx={{ pr: 2 }}
            required
            label="Token ID"
            variant="standard"
          />
        </Grid>

        <Grid item xs={12}>
            <TextField required label="Starting Price (AUC)" variant="standard" sx={{pr: 2}} />
            <TextField required type="date" label="End Date" InputLabelProps={{ shrink: true }}  sx={{ svg: { color: 'red' } }}/>

        </Grid>
        <Grid item xs={12}>
          <Button variant="contained">Create</Button>

        </Grid>
      </Grid>
    </div>
  );
}
