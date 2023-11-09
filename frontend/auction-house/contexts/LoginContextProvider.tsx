"use client"
import LoginProvider, { LoginState } from "@/components/LoginProvider";
import { createContext, useContext } from "react";

interface LoginContextProps {
  login: () => Promise<void>;
  logout: () => void;
  state: LoginState;
}

export const LoginContext = createContext<LoginContextProps>({} as LoginContextProps);

export function LoginContextProvider(props: { children: any }) {
  const { login, logout, state } = LoginProvider();

  return (
    <LoginContext.Provider
      value={{
        login,
        logout,
        state,
      }}
    >
      {props.children}
    </LoginContext.Provider>
  );
}

export const useLoginContext = () => useContext(LoginContext);
