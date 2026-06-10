import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import dotenv from "dotenv";
import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  SendTransactionError,
} from "@solana/web3.js";
import bs58 from "bs58";
dotenv.config();

/* =========================
   CONFIGURATION HELPERS
========================= */

/**
 * Get Solana RPC URL based on network environment variable
 */
function getSolanaRpcUrl(): string {
  const network = process.env.VITE_SOLANA_NETWORK || "devnet";
  
  if (network === "mainnet") {
    return (
      process.env.VITE_SOLANA_MAINNET_RPC ||
      "https://api.mainnet-beta.solana.com"
    );
  } else {
    return (
      process.env.VITE_SOLANA_DEVNET_RPC || "https://api.devnet.solana.com"
    );
  }
}

/* =========================
   MONGOOSE & SERVER SETUP
========================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mongoose Operator Schema and Model
const OperatorSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  highScore: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  unlockedNodes: { type: [String], default: [] }
}, {
  timestamps: true
});

const Operator = (mongoose.models.Operator || mongoose.model("Operator", OperatorSchema)) as any;

function formatOperator(opDoc: any) {
  if (!opDoc) return null;
  return {
    address: opDoc.address,
    name: opDoc.name,
    highScore: opDoc.highScore,
    earnings: opDoc.earnings,
    unlockedNodes: opDoc.unlockedNodes || [],
    createdAt: opDoc.createdAt ? (typeof opDoc.createdAt.toISOString === "function" ? opDoc.createdAt.toISOString() : opDoc.createdAt) : new Date().toISOString(),
    updatedAt: opDoc.updatedAt ? (typeof opDoc.updatedAt.toISOString === "function" ? opDoc.updatedAt.toISOString() : opDoc.updatedAt) : new Date().toISOString()
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Normalize wallet address to lowercase if EVM, but preserve case for Solana
  function normalizeAddress(addr: string): string {
    if (!addr) return "";
    const trimmed = addr.trim();
    if (trimmed.startsWith("0x")) {
      return trimmed.toLowerCase();
    }
    return trimmed; // Solana base58 keys are case-sensitive
  }

  // Initialize MongoDB connection
  let isMongoConnected = false;
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    console.log(`[MONGODB] Attempting connection...`);
    try {
      await mongoose.connect(mongoUri);
      isMongoConnected = true;
      console.log("[MONGODB] Success: Connected successfully to MongoDB");
    } catch (err) {
      console.error("[MONGODB] Error during connection: ", err);
    }
  } else {
    console.warn("[MONGODB] Warning: MONGODB_URI details are missing in environment. DB will fall back to in-memory.");
  }

  // Fallback in-memory database if MongoDB is not working or not initialized
  const memoryDB: Record<string, any> = {
    "9rXWyS4bN8F4bW9X1E9Y5PruXfE1T6Zg3Y49m5oG6jH62": {
      address: "9rXWyS4bN8F4bW9X1E9Y5PruXfE1T6Zg3Y49m5oG6jH62",
      name: "CYPHER_COBALT_REPTILE",
      highScore: 780,
      earnings: 6630,
      unlockedNodes: ["KRONOS_PRIME", "SPECTRE_X", "VOID_WALKER_99"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };

  // API endpoint: Get Operator Profile by Wallet Address
  app.get("/api/operator/:address", async (req, res) => {
    const address = normalizeAddress(req.params.address);

    if (isMongoConnected) {
      try {
        const op = await Operator.findOne({ address });
        if (op) {
          return res.json(formatOperator(op));
        } else {
          return res.status(404).json({ error: "Operator profile not found" });
        }
      } catch (err: any) {
        console.error("MongoDB get error: ", err);
        return res.status(500).json({ error: err.message });
      }
    } else {
      if (memoryDB[address]) {
        return res.json(memoryDB[address]);
      }
      return res.status(404).json({ error: "Operator profile not found" });
    }
  });

  // API endpoint: Register/Update Operator Profile on First Connection
  app.post("/api/operator", async (req, res) => {
    const { address, name } = req.body;
    if (!address || !name) {
      return res.status(400).json({ error: "Missing required fields: address or name" });
    }

    const cleanAddress = normalizeAddress(address);

    if (isMongoConnected) {
      try {
        let op = await Operator.findOne({ address: cleanAddress });

        if (!op) {
          op = new Operator({
            address: cleanAddress,
            name: name.substring(0, 30),
            highScore: 0,
            earnings: 0.00,
            unlockedNodes: []
          });
          await op.save();
        }
        return res.json(formatOperator(op));
      } catch (err: any) {
        console.error("MongoDB save operator error: ", err);
        return res.status(500).json({ error: err.message });
      }
    } else {
      if (!memoryDB[cleanAddress]) {
        memoryDB[cleanAddress] = {
          address: cleanAddress,
          name: name.substring(0, 30),
          highScore: 0,
          earnings: 0.00,
          unlockedNodes: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return res.json(memoryDB[cleanAddress]);
    }
  });

  // API endpoint: Log Game Run (Update High Score & Add Earnings)
  app.post("/api/update-score", async (req, res) => {
    const { address, score, earnings } = req.body;
    if (!address) {
      return res.status(400).json({ error: "Missing operator address" });
    }

    const cleanAddress = normalizeAddress(address);
    const cleanScore = parseInt(score, 10) || 0;
    const cleanEarnings = parseFloat(earnings) || 0;

    console.log(`[UPDATE-SCORE] ${cleanAddress}: score=${cleanScore}, earnings=${cleanEarnings}`);

    if (isMongoConnected) {
      try {
        let op = await Operator.findOne({ address: cleanAddress });

        // ✅ Auto-create if missing
        if (!op) {
          op = new Operator({
            address: cleanAddress,
            name: "OPERATOR_" + cleanAddress.slice(0, 6),
            highScore: cleanScore,
            earnings: cleanEarnings,
            unlockedNodes: []
          });
          await op.save();
          console.log("[UPDATE-SCORE] Created new operator");
        } else {
          op.highScore = Math.max(op.highScore || 0, cleanScore);
          op.earnings = (op.earnings || 0) + cleanEarnings;
          await op.save();
          console.log("[UPDATE-SCORE] Updated existing operator");
        }

        return res.json(formatOperator(op));
      } catch (err: any) {
        console.error("[UPDATE-SCORE] MongoDB error:", err);
        return res.status(500).json({ error: err.message });
      }
    } else {
      // Use memory DB
      if (!memoryDB[cleanAddress]) {
        memoryDB[cleanAddress] = {
          address: cleanAddress,
          name: "OPERATOR_" + cleanAddress.slice(0, 6),
          highScore: cleanScore,
          earnings: cleanEarnings,
          unlockedNodes: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        console.log("[UPDATE-SCORE] Created new operator in memory DB");
      } else {
        const currentData = memoryDB[cleanAddress];
        currentData.highScore = Math.max(currentData.highScore, cleanScore);
        currentData.earnings += cleanEarnings;
        currentData.updatedAt = new Date().toISOString();
        console.log("[UPDATE-SCORE] Updated existing operator in memory DB");
      }

      return res.json(memoryDB[cleanAddress]);
    }
  });

  // API endpoint: Mark System Node Unlocked (Subscription Payout Verification)
  app.post("/api/unlock-node", async (req, res) => {
    const { address, nodeName, txHash } = req.body;
    if (!address || !nodeName) {
      return res.status(400).json({ error: "Missing required parameters: address or nodeName" });
    }

    const cleanAddress = normalizeAddress(address);

    if (isMongoConnected) {
      try {
        const op = await Operator.findOne({ address: cleanAddress });

        if (!op) {
          return res.status(404).json({ error: "Operator profile missing" });
        }

        const unlocked = op.unlockedNodes || [];
        if (!unlocked.includes(nodeName)) {
          unlocked.push(nodeName);
          op.unlockedNodes = unlocked;
          await op.save();
        }

        return res.json({
          success: true,
          unlockedNodes: unlocked,
          txHash: txHash || Array.from({length: 64}, () => "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"[Math.floor(Math.random()*58)]).join("")
        });
      } catch (err: any) {
        console.error("MongoDB unlock-node error: ", err);
        return res.status(500).json({ error: err.message });
      }
    } else {
      if (!memoryDB[cleanAddress]) {
        return res.status(404).json({ error: "Operator profile missing" });
      }

      const unlocked = memoryDB[cleanAddress].unlockedNodes || [];
      if (!unlocked.includes(nodeName)) {
        unlocked.push(nodeName);
      }
      memoryDB[cleanAddress].unlockedNodes = unlocked;
      memoryDB[cleanAddress].updatedAt = new Date().toISOString();

      return res.json({
        success: true,
        unlockedNodes: unlocked,
        txHash: txHash || "5MckSolSignatureHash111111111111111111111111111"
      });
    }
  });

  // API endpoint: Simulated DEVNET block payout transaction trigger (Solana SOL payout)
  app.post("/api/withdraw", async (req, res) => {
  const { address, amountUsd } = req.body;

  console.log("[WITHDRAW] Request:", address, amountUsd);

  if (!address || !amountUsd) {
    return res.status(400).json({ error: "Missing address or amount" });
  }

  const cleanAmount = Number(amountUsd);

  if (!cleanAmount || cleanAmount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  // ✅ Validate wallet
  let recipient: PublicKey;
  try {
    recipient = new PublicKey(address);
  } catch {
    return res.status(400).json({ error: "Invalid wallet address" });
  }

  // 🔐 Load treasury key
  const secret = process.env.TREASURY_SECRET_KEY;

  if (!secret) {
    return res.status(500).json({ error: "Treasury key missing" });
  }

  let treasuryKeypair: Keypair;

  try {
    treasuryKeypair = Keypair.fromSecretKey(bs58.decode(secret));
  } catch {
    return res.status(400).json({ error: "Invalid treasury key format" });
  }

  const connection = new Connection(getSolanaRpcUrl());

  // 💱 conversion
  const SOL_PER_USD = 1 / 65;
  const payoutSol = cleanAmount * SOL_PER_USD;
  const lamports = Math.floor(payoutSol * 1e9);

  if (lamports < 1000) {
    return res.status(400).json({ error: "Amount too small" });
  }

  try {
    // ✅ Get or create operator (with MongoDB or memory DB fallback)
    let op: any;
    let operatorEarnings = 0;

    if (isMongoConnected) {
      try {
        op = await Operator.findOne({ address });

        if (!op) {
          op = await Operator.create({
            address,
            name: "OPERATOR_" + address.slice(0, 6),
            highScore: 0,
            earnings: 0,
            unlockedNodes: [],
            createdAt: new Date(),
          });

          console.log("[WITHDRAW] Auto-created operator in MongoDB");
        }

        operatorEarnings = op.earnings || 0;
      } catch (dbErr: any) {
        console.error("[WITHDRAW] MongoDB error:", dbErr.message);
        console.log("[WITHDRAW] Falling back to memory DB");
        
        // Fallback to memory DB
        if (!memoryDB[address]) {
          memoryDB[address] = {
            address,
            name: "OPERATOR_" + address.slice(0, 6),
            highScore: 0,
            earnings: 0,
            unlockedNodes: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
        operatorEarnings = memoryDB[address].earnings || 0;
      }
    } else {
      console.log("[WITHDRAW] MongoDB not connected, using memory DB");
      
      // Use memory DB
      if (!memoryDB[address]) {
        memoryDB[address] = {
          address,
          name: "OPERATOR_" + address.slice(0, 6),
          highScore: 0,
          earnings: 0,
          unlockedNodes: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      operatorEarnings = memoryDB[address].earnings || 0;
    }

    console.log(`[WITHDRAW] Operator earnings: ${operatorEarnings}, requested: ${cleanAmount}`);
   
    if (operatorEarnings < cleanAmount) {
      return res.status(400).json({ 
        error: "Insufficient earnings",
        available: operatorEarnings,
        requested: cleanAmount
      });
    }

    // Check treasury account balance before attempting transfer
    const treasuryBalance = await connection.getBalance(treasuryKeypair.publicKey);
    console.log(`[WITHDRAW] Treasury balance: ${treasuryBalance} lamports, needed: ${lamports}`);
    
    if (treasuryBalance < lamports) {
      return res.status(400).json({
        error: "Insufficient balance in treasury account",
        treasuryBalance,
        requested: lamports,
        deficit: lamports - treasuryBalance,
      });
    }

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: treasuryKeypair.publicKey,
        toPubkey: recipient,
        lamports,
      })
    );

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    tx.recentBlockhash = blockhash;
    tx.feePayer = treasuryKeypair.publicKey;

    tx.sign(treasuryKeypair);

    let signature: string;
    try {
      signature = await connection.sendRawTransaction(tx.serialize());
      console.log("[WITHDRAW] Sent tx:", signature);
    } catch (error: any) {
      if (error instanceof SendTransactionError) {
        const logs = error.getLogs();
        const errorMsg = error.transactionMessage || error.message || "";
        
        console.error("[WITHDRAW] SendTransactionError details:", {
          message: error.message,
          signature: error.signature,
          transactionMessage: error.transactionMessage,
          logs: logs,
          fullError: error,
        });

        // Parse error message and provide user-friendly explanation
        let userMessage = "Transaction failed";
        let userDetails = "An error occurred while processing your withdrawal.";

        if (errorMsg.includes("no record of a prior credit")) {
          userMessage = "Treasury Account Not Ready";
          userDetails = "The treasury account hasn't been initialized yet. Please ensure SOL has been transferred to the treasury account before attempting withdrawals.";
        } else if (errorMsg.includes("Insufficient lamports")) {
          userMessage = "Insufficient Funds";
          userDetails = "The treasury doesn't have enough SOL to process this withdrawal. Please try again with a smaller amount or contact support.";
        } else if (errorMsg.includes("Account does not exist")) {
          userMessage = "Account Not Found";
          userDetails = "The recipient account or treasury account could not be found. Please verify the account addresses.";
        } else if (errorMsg.includes("Transaction simulation failed")) {
          userMessage = "Transaction Validation Failed";
          userDetails = errorMsg.replace("Transaction simulation failed: ", "");
        }

        return res.status(400).json({
          error: userMessage,
          message: userDetails,
          signature: error.signature || null,
        });
      }
      console.error("[WITHDRAW] Unexpected error sending transaction:", error);
      return res.status(500).json({
        error: "Unexpected error",
        message: "An unexpected error occurred while processing your withdrawal. Please try again later.",
      });
    }

    const confirmation = await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed"
    );

    if (confirmation.value.err) {
      return res.status(400).json({
        error: "Transaction failed on-chain",
        txHash: signature,
      });
    }

    // ✅ update DB AFTER success
    if (isMongoConnected) {
      try {
        const op = await Operator.findOne({ address });
        if (op) {
          op.earnings = Math.max(0, op.earnings - cleanAmount);
          await op.save();
          console.log("[WITHDRAW] Updated MongoDB earnings");
        }
      } catch (dbErr: any) {
        console.error("[WITHDRAW] DB update error:", dbErr.message);
      }
    } else {
      if (memoryDB[address]) {
        memoryDB[address].earnings = Math.max(0, memoryDB[address].earnings - cleanAmount);
        memoryDB[address].updatedAt = new Date().toISOString();
        console.log("[WITHDRAW] Updated memory DB earnings");
      }
    }

    return res.json({
      success: true,
      txHash: signature,
      payoutSol,
      amountUsd: cleanAmount,
      mode: "real",
    });
  } catch (err: any) {
    console.error("[WITHDRAW] ERROR:", err);
    return res.status(500).json({
      error: err.message || "Withdrawal failed",
    });
  }
});
  // API endpoint: Get Leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    if (isMongoConnected) {
      try {
        const opList = await Operator.find().sort({ highScore: -1 }).limit(12);
        const list = opList.map(op => formatOperator(op));

        // Ensure we combine any mock entries or fallback profiles if data list is too small
        if (list.length < 5) {
          const combined = [...list];
          Object.values(memoryDB).forEach(memUser => {
            if (!combined.some(u => u.address === memUser.address)) {
              combined.push(memUser);
            }
          });
          combined.sort((a, b) => b.highScore - a.highScore);
          return res.json(combined.slice(0, 10));
        }

        return res.json(list);
      } catch (err: any) {
        console.error("MongoDB leaderboard query error: ", err);
        const list = Object.values(memoryDB).sort((a, b) => b.highScore - a.highScore);
        return res.json(list);
      }
    } else {
      const list = Object.values(memoryDB).sort((a, b) => b.highScore - a.highScore);
      return res.json(list);
    }
  });

  // Mount Vite development middlewares or serve static compiled files
  if (process.env.NODE_ENV !== "production") {
    console.log("[SERVER] Starting in DEVELOPMENT mode");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[SERVER] Starting in PRODUCTION mode");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Success: Full-stack online at http://localhost:${PORT}`);
  });
}

startServer();
