import { Handler } from "@netlify/functions";
import mongoose from "mongoose";
import dotenv from "dotenv";
import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import bs58 from "bs58";

dotenv.config();

/* =========================
   MONGOOSE SETUP
========================= */

const OperatorSchema = new mongoose.Schema(
  {
    address: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    highScore: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 },
    unlockedNodes: { type: [String], default: [] },
  },
  { timestamps: true }
);

const Operator =
  (mongoose.models.Operator ||
    mongoose.model("Operator", OperatorSchema)) as any;

/* =========================
   DB CONNECTION CACHE
========================= */

let isMongoConnected = false;

async function connectDB() {
  if (isMongoConnected || !process.env.MONGODB_URI) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isMongoConnected = true;
    console.log("[MONGO] Connected");
  } catch (err) {
    console.error("[MONGO] Connection error", err);
  }
}

/* =========================
   MEMORY FALLBACK DB
========================= */

const memoryDB: Record<string, any> = {};

/* =========================
   HELPERS
========================= */

function normalizeAddress(addr: string) {
  if (!addr) return "";
  const trimmed = addr.trim();
  return trimmed.startsWith("0x") ? trimmed.toLowerCase() : trimmed;
}

function formatOperator(op: any) {
  return {
    address: op.address,
    name: op.name,
    highScore: op.highScore,
    earnings: op.earnings,
    unlockedNodes: op.unlockedNodes || [],
    createdAt: op.createdAt,
    updatedAt: op.updatedAt,
  };
}

/* =========================
   HANDLER
========================= */

export const handler: Handler = async (event) => {
  await connectDB();

  const path = event.path.replace("/.netlify/functions/api", "");
  const method = event.httpMethod;

  let body: any = {};
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {}

  /* =========================
     GET OPERATOR
  ========================= */
  if (method === "GET" && path.startsWith("/api/operator/")) {
    const address = normalizeAddress(path.split("/").pop() || "");

    if (isMongoConnected) {
      const op = await Operator.findOne({ address });
      if (!op)
        return { statusCode: 404, body: JSON.stringify({ error: "Not found" }) };

      return {
        statusCode: 200,
        body: JSON.stringify(formatOperator(op)),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(memoryDB[address] || { error: "Not found" }),
    };
  }

  /* =========================
     CREATE / UPDATE OPERATOR
  ========================= */
  if (method === "POST" && path === "/api/operator") {
    const { address, name } = body;
    if (!address || !name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing fields" }),
      };
    }

    const clean = normalizeAddress(address);

    if (isMongoConnected) {
      let op = await Operator.findOne({ address: clean });

      if (!op) {
        op = await Operator.create({
          address: clean,
          name: name.slice(0, 30),
          highScore: 0,
          earnings: 0,
          unlockedNodes: [],
        });
      }

      return {
        statusCode: 200,
        body: JSON.stringify(formatOperator(op)),
      };
    }

    memoryDB[clean] = memoryDB[clean] || {
      address: clean,
      name: name.slice(0, 30),
      highScore: 0,
      earnings: 0,
      unlockedNodes: [],
    };

    return {
      statusCode: 200,
      body: JSON.stringify(memoryDB[clean]),
    };
  }

  /* =========================
     UPDATE SCORE
  ========================= */
  if (method === "POST" && path === "/api/update-score") {
    const { address, score, earnings } = body;

    const clean = normalizeAddress(address);
    const s = Number(score) || 0;
    const e = Number(earnings) || 0;

    if (isMongoConnected) {
      let op = await Operator.findOne({ address: clean });

      if (!op) {
        op = await Operator.create({
          address: clean,
          name: "OP_" + clean.slice(0, 6),
          highScore: s,
          earnings: e,
          unlockedNodes: [],
        });
      } else {
        op.highScore = Math.max(op.highScore, s);
        op.earnings += e;
        await op.save();
      }

      return {
        statusCode: 200,
        body: JSON.stringify(formatOperator(op)),
      };
    }

    memoryDB[clean] = memoryDB[clean] || {
      address: clean,
      name: "OP_" + clean.slice(0, 6),
      highScore: 0,
      earnings: 0,
      unlockedNodes: [],
    };

    memoryDB[clean].highScore = Math.max(memoryDB[clean].highScore, s);
    memoryDB[clean].earnings += e;

    return {
      statusCode: 200,
      body: JSON.stringify(memoryDB[clean]),
    };
  }

  /* =========================
     UNLOCK NODE
  ========================= */
  if (method === "POST" && path === "/api/unlock-node") {
    const { address, nodeName, txHash } = body;
    const clean = normalizeAddress(address);

    if (isMongoConnected) {
      const op = await Operator.findOne({ address: clean });
      if (!op) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "Not found" }),
        };
      }

      const nodes = op.unlockedNodes || [];
      if (!nodes.includes(nodeName)) nodes.push(nodeName);

      op.unlockedNodes = nodes;
      await op.save();

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          unlockedNodes: nodes,
          txHash:
            txHash ||
            Array.from({ length: 64 }, () =>
              "abcdef1234567890"[Math.floor(Math.random() * 16)]
            ).join(""),
        }),
      };
    }

    memoryDB[clean] = memoryDB[clean] || { unlockedNodes: [] };
    if (!memoryDB[clean].unlockedNodes.includes(nodeName)) {
      memoryDB[clean].unlockedNodes.push(nodeName);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        unlockedNodes: memoryDB[clean].unlockedNodes,
        txHash:
          txHash || "DEVNET_FAKE_TX_HASH_123456789",
      }),
    };
  }

  /* =========================
     WITHDRAW (SOLANA)
  ========================= */
  if (method === "POST" && path === "/api/withdraw") {
    const { address, amountUsd } = body;

    const cleanAmount = Number(amountUsd);
    if (!address || !cleanAmount) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid request" }),
      };
    }

    let recipient: PublicKey;
    try {
      recipient = new PublicKey(address);
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid wallet" }),
      };
    }

    const secret = process.env.TREASURY_SECRET_KEY;
    if (!secret) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing treasury key" }),
      };
    }

    const treasury = Keypair.fromSecretKey(bs58.decode(secret));
    const connection = new Connection("https://api.devnet.solana.com");

    const SOL_PER_USD = 1 / 65;
    const lamports = Math.floor(cleanAmount * SOL_PER_USD * 1e9);

    let op: any;
    let earnings = 0;

    if (isMongoConnected) {
      op = await Operator.findOne({ address });
      earnings = op?.earnings || 0;
    } else {
      earnings = memoryDB[address]?.earnings || 0;
    }

    if (earnings < cleanAmount) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Insufficient earnings" }),
      };
    }

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: treasury.publicKey,
        toPubkey: recipient,
        lamports,
      })
    );

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    tx.recentBlockhash = blockhash;
    tx.feePayer = treasury.publicKey;
    tx.sign(treasury);

    const sig = await connection.sendRawTransaction(tx.serialize());

    await connection.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      "confirmed"
    );

    if (isMongoConnected && op) {
      op.earnings -= cleanAmount;
      await op.save();
    } else if (memoryDB[address]) {
      memoryDB[address].earnings -= cleanAmount;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        txHash: sig,
      }),
    };
  }

  /* =========================
     LEADERBOARD
  ========================= */
  if (method === "GET" && path === "/api/leaderboard") {
    let list: any[] = [];

    if (isMongoConnected) {
      const ops = await Operator.find().sort({ highScore: -1 }).limit(10);
      list = ops.map(formatOperator);
    } else {
      list = Object.values(memoryDB);
    }

    return {
      statusCode: 200,
      body: JSON.stringify(
        list.sort((a, b) => b.highScore - a.highScore)
      ),
    };
  }

  return {
    statusCode: 404,
    body: JSON.stringify({ error: "Route not found" }),
  };
};