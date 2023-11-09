"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Container, Grid, Switch, TextField } from "@mui/material";
import Typography from "@mui/material/Typography";
import Header from "../../components/Header";
import { useLoginContext } from "@/contexts/LoginContextProvider";
import { notFound, redirect } from "next/navigation";
import { HouseServiceProvider } from "../services/house";
import { ethers } from "ethers";

export default function Management() {
  const { login, logout, state } = useLoginContext();

  const [adminAddress, setAdminAddress] = useState("");
  const [adminBalance, setAdminBal] = useState(0);
  const [currFee, setFee] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(true);

  const houseService = useMemo(
    () => new HouseServiceProvider(state.address, state.provider, state.signer),
    [state.address, state.provider, state.signer]
  );

  useEffect(() => {
    if (state.isLoggedIn) {
        houseService.getContract().admin().then(f => {
            setAdminAddress(f);
            setIsAdmin(ethers.getAddress(f) == ethers.getAddress(state.address));
        });

        houseService.isManager().then((f) => setIsManager(f));
    }

  }, [state, houseService, isManager]);

  if (!isManager) {
    return notFound();
  }

  return (
    <div>
      <Header />
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            borderRadius: 8,
            border: 1,
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography component="h1" variant="h5" sx={{ p: 1 }}>
            {" "}
            Management{" "}
          </Typography>

          <Box
            sx={{
              p: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography variant="caption" sx={{ m: 1 }}>
              Admin: {adminAddress}
            </Typography>

            <Typography>
              Uncollected House Balance: {adminBalance} AUC
            </Typography>
            <TextField
                  id="standard-basic"
                  label="Withdrawal Amount (AUC)"
                  variant="standard"
            />
            {/* TODO: AUC * 10^18 */}
            <Button variant="contained" sx={{mt: 2}} disabled>
              Withdraw to Admin
            </Button>
            
          </Box>
          {
            /* Admin Only Section */
            isAdmin ? (
              <Box
                sx={{
                  pb: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <TextField
                  id="standard-basic"
                  label="Change Admin Address"
                  variant="standard"
                />
                <Button variant="contained" sx={{ mt: 2, mb: 1 }}>
                  Update
                </Button>
                <Typography sx={{ mt: 3 }}>Add or Remove Managers:</Typography>

                <TextField
                  id="standard-basic"
                  label="Address"
                  variant="standard"
                />
                <Button variant="contained" sx={{ mt: 1, mb: 2 }}>
                  Update
                </Button>
              </Box>
            ) : (
              <></>
            )
          }

          <Box
            sx={{
              pb: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography>Current Fee: {currFee}%</Typography>
            <TextField
              id="standard-basic"
              label="New Fee (%)"
              variant="standard"
            />
            <Button variant="contained" sx={{ mt: 2 }}>
              Set Fee
            </Button>
          </Box>
        </Box>
      </Container>
    </div>
  );
}
