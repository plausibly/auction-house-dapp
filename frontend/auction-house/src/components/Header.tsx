import "../App.css"
import React from "react";
import { ethers } from 'ethers';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import BalanceWallet from '@mui/icons-material/AccountBalanceWallet';


export default function Header(props: { title: string }) {
    const isAdmin = false;


    return (<AppBar
        position="static"
        color="default"
        elevation={0}
        sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
    <Toolbar sx={{ flexWrap: 'wrap' }}>
      <Typography variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
        {props.title}
      </Typography>
      <nav>
        <Link
          variant="button"
          color="text.primary"
          href="#"
          sx={{ my: 1, mx: 1.5 }}
        >
          Home
        </Link>
        <Link
          variant="button"
          color="text.primary"
          href="#"
          sx={{ my: 1, mx: 1.5 }}
        >
          Mint Items
        </Link>
        {isAdmin ? <Link
          variant="button"
          color="text.primary"
          href="#"
          sx={{ my: 1, mx: 1.5 }}
        >
          Management
        </Link> : <></>}
      </nav>
      
      <Button href="#" variant="outlined" sx={{ my: 1, mx: 1.5 }}>
      <BalanceWallet></BalanceWallet>
      </Button>
    </Toolbar>
  </AppBar>);
}