import React from 'react';
import { Button, Grid, TextField } from '@mui/material';
import Typography from '@mui/material/Typography';
import Header from '../components/Header';

export default function Mint() {
  return (
    <div>
    <Header title="Create Items and Mint Tokens" />
    <Grid sx={{m: 3}}>
        <Grid item sx={{m: 3}}>
            <Typography>Generate AUC:</Typography>
            <TextField id="standard-basic" label="Amount (in AUC)" variant="standard" />
            <Button variant="contained">Mint</Button>


        </Grid>


        <Grid item sx={{m: 3}}>
            <Typography>Generate AUC:</Typography>

            <TextField id="standard-basic" label="Amount (in AUC)" variant="standard" />

        </Grid>

    </Grid>
    </div>
  );
}