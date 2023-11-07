import React from 'react';
import { Button, Grid, TextField } from '@mui/material';
import Typography from '@mui/material/Typography';
import Header from '../components/Header';

export default function Management() {
    let adminAddress = "placeholder";
    let currFee = 0; // convert Bp -> %
    let adminBalance = 0;
    let isAdmin = false;
    let isManager = false;

    // todo if !isAdmin and !isManager -> unauthorized

  return (
    <div>
    <Header title="Management" />
    <Grid container spacing={4} sx={{m: 2}}>
        <Grid item xs={3} spacing={3}>
            <Typography >Current Admin Address: {adminAddress} </Typography>
            <Typography>Uncollected House Balance: {adminBalance} AUC</Typography>
                <Button variant="contained" disabled>Withdraw to Admin</Button>
            </Grid>

        <Grid item xs={3}>
            {/* Admin Only Section */}
            <TextField id="standard-basic" label="New Admin Address" variant="standard" />
            <Button variant="contained">Update</Button>
            <Typography >Add or Remove Managers:</Typography>
            <TextField id="standard-basic" label="Manager" variant="standard" />
            <Button variant="contained">Update</Button>
            
        </Grid>


        <Grid item xs={3}>
            <Typography>Current Fee: {currFee}%</Typography>
            <TextField id="standard-basic" label="New Fee (%)" variant="standard" />
            <Button variant="contained">Set Fee</Button>

        </Grid>

    </Grid>
    </div>
  );
}