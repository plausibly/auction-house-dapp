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
  const [currFee, setFeeText] = useState("0");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(true);

  const [feeInput, setFeeInput] = useState(0);
  const [mgrInput, setMgrInput] = useState("");
  const [withdrawInput, setWithdrawInput] = useState(0);
  const [adminAddrInput, setAdmAddrInput] = useState("");

  const houseService = useMemo(
    () => new HouseServiceProvider(state.address, state.provider, state.signer),
    [state.address, state.provider, state.signer]
  );

  useEffect(() => {
    if (state.isLoggedIn) {
      houseService
        .getContract()
        .admin()
        .then((f) => {
          setAdminAddress(f);
          setIsAdmin(ethers.getAddress(f) == ethers.getAddress(state.address));
        });

      houseService.isManager().then((f) => setIsManager(f));

      houseService.getFee().then((f) => setFeeText(f.toString()));
    }
  }, [state, houseService, isManager, currFee]);

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
              type="number"
              sx={{ pl: 2 }}
              inputProps={{ min: 0 }}
              onChange={(e) => setWithdrawInput(Number(e.target.value))}
            />
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              disabled={adminBalance == 0 || withdrawInput > adminBalance}
            >
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
                  onChange={(e) => setAdmAddrInput(e.target.value)}
                />
                <Button
                  variant="contained"
                  sx={{ mt: 2, mb: 1 }}
                  disabled={!ethers.isAddress(adminAddrInput)}
                >
                  Update
                </Button>
                <Typography sx={{ mt: 3 }}>Add or Remove Managers:</Typography>

                <TextField
                  id="standard-basic"
                  label="Address"
                  variant="standard"
                  onChange={(e) => setMgrInput(e.target.value)}
                />
                <Box>
                  <Button
                    variant="contained"
                    sx={{ mt: 1, mb: 2 }}
                    disabled={!ethers.isAddress(mgrInput)}
                  >
                    Add
                  </Button>
                  <Button
                    color="error"
                    variant="contained"
                    sx={{ mt: 1, mb: 2, ml: 2 }}
                    disabled={!ethers.isAddress(mgrInput)}
                  >
                    Remove
                  </Button>
                </Box>
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
              label="Fee (%)"
              type="number"
              defaultValue={currFee}
              inputProps={{ min: 0.0, max: 100 }}
              variant="standard"
              onChange={(e) => setFeeInput(Number(e.target.value))}
            />
            <Button
              onClick={() => houseService.setFee(feeInput)}
              variant="contained"
              sx={{ mt: 2 }}
              disabled={feeInput < 0 || feeInput > 100}
            >
              Set Fee
            </Button>
          </Box>
        </Box>
      </Container>
    </div>
  );
}
