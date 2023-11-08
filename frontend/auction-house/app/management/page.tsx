'use client'
import React from 'react';
import { Box, Button, Container, Grid, Switch, TextField } from '@mui/material';
import Typography from '@mui/material/Typography';
import Header from '../../components/Header';

export default function Management() {
    let adminAddress = "placeholder";
    let currFee = 0; // convert Bp -> %
    let adminBalance = 0;
    let isAdmin = false;
    let isManager = false;

    const loginAddress = "0x0";
    // todo if !isAdmin and !isManager -> unauthorized

  return (
    <div >
        <Header  />
        <Container component="main" maxWidth="xs">
            <Box sx={{ borderRadius:8, border: 1, marginTop: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Typography component="h1" variant="h5" sx={{p: 1}}> Management </Typography>

            <Box sx={{p: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Typography>Uncollected House Balance: {adminBalance} AUC</Typography>
                <Button variant="contained" disabled>Withdraw to Admin</Button>

                <Typography sx={{mt: 2}}>Admin Address: {adminAddress} </Typography>

            </Box>

            <Box sx={{pb: 1, display: "flex", flexDirection: "column", alignItems: "center" }}> 
                {/* Admin Only Section */}
                <TextField id="standard-basic" label="Change Admin Address" variant="standard" />
                <Button variant="contained" sx={{mt: 2, mb: 1}}>Update</Button>
                <Typography sx={{mt: 3}}>Add or Remove Managers:</Typography>

                <TextField id="standard-basic" label="Address" variant="standard" />
                <Button variant="contained" sx={{mt: 1, mb: 2}}>Update</Button>
            </Box>

            <Box sx={{ pb: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Typography>Current Fee: {currFee}%</Typography>
                <TextField id="standard-basic" label="New Fee (%)" variant="standard" />
                <Button variant="contained" sx={{mt: 2}}>Set Fee</Button>
            </Box>
            
                
            </Box>
        </Container>

    </div>
  );
}