"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Container, Grid, Switch, TextField } from "@mui/material";
import Typography from "@mui/material/Typography";
import Header from "../../components/Header";
import { useLoginContext } from "@/contexts/LoginContextProvider";
import { HouseServiceProvider } from "../../services/house";
import { ethers } from "ethers";

export default function Management() {
  const state = useLoginContext().state;

  const [adminAddress, setAdminAddress] = useState("");
  const [adminBalance, setAdminBal] = useState(0);
  const [currFee, setFeeText] = useState("0");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(true);

  const [feeInput, setFeeInput] = useState(0);
  const [mgrInput, setMgrInput] = useState("");
  const [withdrawInput, setWithdrawInput] = useState(0);
  const [adminAddrInput, setAdmAddrInput] = useState("");

  const [banner, setBanner] = useState("");

  const houseService = useMemo(
    () => new HouseServiceProvider(state.address, state.provider, state.signer),
    [state.address, state.provider, state.signer]
  );

  const handleError = (err: any) => {
    if (err.data) {
      const errDecode = houseService
        .getContract()
        .interface.parseError(err.data);
      setBanner("An error occurred: " + errDecode?.args);
    } else {
      setBanner("An error occurred. ");
    }
  };

  const withdrawReq = async () => {
    setBanner("Requesting to withdraw. Please approve the transaction");
    try {
      await houseService.withdrawFees(withdrawInput);
      setBanner(
        "Request has been sent. Withdrawal will complete when tx is confirmed."
      );
    } catch (err: any) {
      handleError(err);
      console.error(err);
    }
  };

  const removeMgr = async () => {
    setBanner("Requesting to remove manager. Please approve the transaction");
    try {
      await houseService.removeManager(mgrInput);
      setBanner("Request has been sent. Removal will when tx is confirmed.");
    } catch (err: any) {
      handleError(err);
      console.error(err);
    }
  };

  const addMgr = async () => {
    setBanner("Requesting to add manager. Please approve the transaction");
    try {
      await houseService.addManager(mgrInput);
      setBanner(
        "Request has been sent. Manager addition will complete when tx is confirmed."
      );
    } catch (err: any) {
      handleError(err);
      console.error(err);
    }
  };

  const updateAdmin = async () => {
    setBanner(
      "Requesting to replace admin address. Please approve the transaction."
    );
    try {
      await houseService.setAdmin(adminAddrInput);
      setBanner(
        "Request has been sent. Address will update once transaction has confirmed."
      );
    } catch (err: any) {
      handleError(err);
      console.error(err);
    }
  };

  const setFee = async () => {
    setBanner("Requesting to update fee. Please approve the transaction.");
    try {
      await houseService.setFee(feeInput);
      setBanner(
        "Request has been sent. Fee will update once transaction has confirmed."
      );
    } catch (err: any) {
      handleError(err);
      console.error(err);
    }
  };

  useEffect(() => {
    if (!state.isLoggedIn) {
      return;
    }
    houseService
      .getContract()
      .admin()
      .then((f) => {
        setAdminAddress(f);
        setIsAdmin(ethers.getAddress(f) == ethers.getAddress(state.address));
      });

    houseService.getCollectedFees().then((f) => setAdminBal(Number(f)));

    houseService.isManager().then((f) => setIsManager(f));

    houseService.getFee().then((f) => setFeeText(f.toString()));
  }, [state, houseService, isManager, currFee]);

  if (!isManager || !state.isLoggedIn) {
    return (
      <>
        <Header />
        <Typography>Unauthorized </Typography>
      </>
    );
  }

  return (
    <div>
      <Header />
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            borderRadius: 8,
            border: 1,
            mt: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 20,
          }}
        >
          <Typography component="h1" variant="h5" sx={{ p: 1 }}>
            Management
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
            <Typography color="red" sx={{ p: 2 }}>
              {banner}
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
              onClick={withdrawReq}
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
                  onClick={updateAdmin}
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
                    onClick={addMgr}
                  >
                    Add
                  </Button>
                  <Button
                    color="error"
                    variant="contained"
                    sx={{ mt: 1, mb: 2, ml: 2 }}
                    disabled={!ethers.isAddress(mgrInput)}
                    onClick={removeMgr}
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
              onClick={setFee}
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
