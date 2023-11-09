import { BrowserProvider, ethers, JsonRpcSigner } from "ethers";
import { useCallback, useEffect, useState } from "react";

export interface LoginState {
  address?: string;
  signer?: JsonRpcSigner;
  provider?: BrowserProvider;
  isLoggedIn: boolean;
}

/* https://medium.com/@flavtech/how-to-easily-call-smart-contracts-using-ethers-nextjs-dd3dabd43c07 */
export default function LoginProvider() {
  const [state, setState] = useState<LoginState>({} as LoginState);

  const login = useCallback(async () => {
    if (state.isLoggedIn) {
      return;
    }

    const { ethereum } = window;

    if (!ethereum) {
      alert("No wallet extension detected!");
      return;
    }

    const provider = new ethers.BrowserProvider(ethereum);

    const accounts: string[] = await provider.send("eth_requestAccounts", []);

    if (accounts.length > 0) {
      const signer = await provider.getSigner();
      setState({
        ...state,
        address: accounts[0],
        signer,
        provider,
        isLoggedIn: true,
      });

      localStorage.setItem("loggedIn", "true");
    }
  }, [state]);

  const logout = () => {
    setState({} as LoginState);
    localStorage.removeItem("loggedIn");
  };

  useEffect(() => {
    if (window == null) {
      return;
    }

    if (localStorage.hasOwnProperty("loggedIn")) {
      login();
    }
  }, [login, state.isLoggedIn]);


  return {
    login,
    logout,
    state,
  };
}
