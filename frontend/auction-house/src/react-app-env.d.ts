/// <reference types="react-scripts" />
import { ExternalProvider } from "@ethersproject/providers";

// fixes error with window.ethereum
declare global {
    interface Window {
      ethereum?: ExternalProvider;
    }
  }