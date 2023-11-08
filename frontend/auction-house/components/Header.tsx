import React from "react";
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import BalanceWallet from '@mui/icons-material/AccountBalanceWallet';


export default function Header() {
    const isAdmin = false;
    return (
    <AppBar position="static" elevation={0} >
      <Toolbar sx={{ flexWrap: 'wrap' }}>
        <Typography variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
          Auction House
        </Typography>
        <Link sx ={{my: 1, mx: 1.5, textDecoration: 'none'}} href="/" >
            Home
        </Link>
        <Link sx ={{my: 1, mx: 1.5, textDecoration: 'none'}} href="/mint">
            Mint
        </Link>
        <Link sx ={{my: 1, mx: 1.5, textDecoration: 'none'}} href="/management">
            Management
        </Link>
        
        <Button href="#" variant="outlined" startIcon={<BalanceWallet/>} sx={{ my: 1, mx: 1.5, borderRadius: 12}}> 
          <Typography sx={{pl: 0.05}}> 
            Connect
          </Typography>
        </Button>
      </Toolbar>
    </AppBar>);
}