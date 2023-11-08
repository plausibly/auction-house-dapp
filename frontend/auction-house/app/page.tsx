import React from 'react';
import { Button, CssBaseline, Grid, TextField, ThemeProvider } from '@mui/material';
import Typography from '@mui/material/Typography';
import Header from '../components/Header';
import createTheme from "@mui/material/styles/createTheme";

  
export default function Home() {
    let adminAddress = "placeholder";
    let currFee = 0; // convert Bp -> %
    let adminBalance = 0;
    let isAdmin = false;
    let isManager = false;

    // todo if !isAdmin and !isManager -> unauthorized

  return (
      <Header/>
    );
}