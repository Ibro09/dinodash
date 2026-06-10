import { Connection } from "@solana/web3.js";

/**
 * Get the Solana connection based on environment variables
 * Supports both devnet and mainnet configurations
 */
export function getSolanaConnection(): Connection {
  const network = import.meta.env.VITE_SOLANA_NETWORK || "devnet";
  let rpcUrl: string;

  if (network === "mainnet") {
    rpcUrl =
      import.meta.env.VITE_SOLANA_MAINNET_RPC ||
      "https://api.mainnet-beta.solana.com";
  } else {
    rpcUrl =
      import.meta.env.VITE_SOLANA_DEVNET_RPC || "https://api.devnet.solana.com";
  }

  return new Connection(rpcUrl);
}

/**
 * Get the current Solana network
 */
export function getSolanaNetwork(): string {
  return import.meta.env.VITE_SOLANA_NETWORK || "devnet";
}

/**
 * Get the treasury wallet address from environment
 */
export function getTreasuryWallet(): string {
  return (
    import.meta.env.VITE_TREASURY_WALLET || "CJppdfe8AghHT7fDjrHQANN7zNT4YgXXrH7rFQet3te5"
  );
}

/**
 * Get configuration summary (useful for debugging)
 */
export function getConfig() {
  return {
    network: getSolanaNetwork(),
    rpcUrl:
      getSolanaNetwork() === "mainnet"
        ? import.meta.env.VITE_SOLANA_MAINNET_RPC || "https://api.mainnet-beta.solana.com"
        : import.meta.env.VITE_SOLANA_DEVNET_RPC || "https://api.devnet.solana.com",
    treasuryWallet: getTreasuryWallet(),
  };
}
