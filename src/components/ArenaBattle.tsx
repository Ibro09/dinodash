import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  Heart,
  Trophy,
  Play,
  RotateCcw,
  Terminal,
  Volume2,
  VolumeX,
  Zap,
  ChevronRight,
  Cpu,
  Activity,
  X,
  AlertCircle,
  TrendingUp,
  Coins,
  Key,
} from "lucide-react";
import {
  Connection,
  Transaction,
  SystemProgram,
  PublicKey,
} from "@solana/web3.js";
import { Operator } from "../types";

interface ArenaBattleProps {
  walletConnected: boolean;
  onConnectClick: () => void;
  operatorName: string;
  addEarnings: (amountUsd: number, score: number) => void;
  onBattleFinish: (won: boolean, opponentName: string, reward: number) => void;
  unlockedNodes: string[];
  onUnlockNode: (nodeName: string) => Promise<boolean>;
  earnings: number;
}

interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "tree" | "bird" | "spike" | "hazard";
  speed: number;
  color: string;
  glowColor: string;
  wingFrame?: number; // For fluttering security drones
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

// Solana Devnet connection
const connection = new Connection("https://api.devnet.solana.com");

// Solana wallet and payment constants
const TREASURY_WALLET = "CJppdfe8AghHT7fDjrHQANN7zNT4YgXXrH7rFQet3te5"; // TODO: Replace with actual treasury wallet on Devnet
const UNLOCK_PRICE_SOL = 0.17; // $10 USD equivalent

const OPPONENTS = [
  {
    name: "CYPHER_COBALT",
    level: 4,
    multiplier: 1.0,
    difficultyLabel: "EASY STATUS",
    description: "Standard cybersecurity sub-routine node.",
  },
  {
    name: "KRONOS_PRIME",
    level: 6,
    multiplier: 1.5,
    difficultyLabel: "HEAVY PROTOCOL",
    description: "Upgraded cryptographic database lock.",
  },
  {
    name: "SPECTRE_X",
    level: 8,
    multiplier: 2.2,
    difficultyLabel: "TACTICAL SECURED",
    description: "Hyper-secure network node array with defensive drones.",
  },
  {
    name: "VOID_WALKER_99",
    level: 12,
    multiplier: 3.5,
    difficultyLabel: "EXPERT INJECT",
    description: "Legendary quantum core terminal with lethal counter-scripts.",
  },
];

export default function ArenaBattle({
  walletConnected,
  onConnectClick,
  operatorName,
  addEarnings,
  onBattleFinish,
  unlockedNodes,
  onUnlockNode,
  earnings,
}: ArenaBattleProps) {
  // Game state
  const [selectedOpponent, setSelectedOpponent] = useState(OPPONENTS[0]);
  const [gameState, setGameState] = useState<
    "setup" | "idle" | "playing" | "hit" | "game_over"
  >("setup");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem("apex_dino_highscore");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [lives, setLives] = useState(1);
  const [muted, setMuted] = useState(false);
  const [earningsWon, setEarningsWon] = useState(0);

  // Lives system (3 lives per 24 hours, 8 hour refill)
  const [availableLives, setAvailableLives] = useState(3);
  const [nextRefillTime, setNextRefillTime] = useState<number | null>(null);
  const [livesRefillTimer, setLivesRefillTimer] = useState<string>("");

  // Decryption Console overlay state
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockConsole, setUnlockConsole] = useState<string[]>([]);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // Dynamic status parameters
  const [simulatedLatency, setSimulatedLatency] = useState(12);
  const [fps, setFps] = useState(60.0);

  // Canvas and game loop refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Dino physics state (stored in ref for instant frame accuracy inside the requestAnimationFrame loop)
  const gameRef = useRef({
    gameState: "setup",
    score: 0,
    lives: 1,
    dinoY: 190,
    dinoVy: 0,
    dinoX: 85,
    dinoWidth: 35,
    dinoHeight: 38,
    isJumping: false,
    invincibleTimer: 0, // Tick countdown
    obstacles: [] as Obstacle[],
    stars: [] as Star[],
    particles: [] as Particle[],
    speed: 10,
    lastObstacleSpawn: 0,
    nextObstacleDelay: 60,
    floorY: 200,
    tickCounter: 0,
  });

  // Keep state sync ref
  useEffect(() => {
    gameRef.current.gameState = gameState;
    gameRef.current.lives = lives;
    gameRef.current.score = score;
  }, [gameState, lives, score]);

  // Calculate available lives based on timestamps
  const calculateAvailableLives = () => {
    const livesData = localStorage.getItem("apex_lives_system");
    const now = Date.now();
    const MAX_LIVES = 3;
    const REFILL_INTERVAL = 8 * 60 * 60 * 1000; // 8 hours in ms
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours in ms

    let data = livesData
      ? JSON.parse(livesData)
      : { usedTimes: [], totalUsedToday: 0 };

    // Clean up old entries (older than 24 hours)
    const validUsedTimes = data.usedTimes.filter(
      (timestamp: number) => now - timestamp < MAX_AGE,
    );

    // Calculate current available lives (never below 0)
    let currentLives = Math.max(0, MAX_LIVES - validUsedTimes.length);

    // Calculate next refill time
    let nextRefill: number | null = null;
    if (validUsedTimes.length > 0) {
      const oldestUsedTime = Math.min(...validUsedTimes);
      nextRefill = oldestUsedTime + REFILL_INTERVAL;
      if (nextRefill < now) {
        nextRefill = null; // Ready to refill
      }
    }

    return { currentLives, nextRefill, usedTimes: validUsedTimes };
  };

  // Use a life when game ends
  const useLife = () => {
    const now = Date.now();
    const livesData = localStorage.getItem("apex_lives_system");
    let data = livesData
      ? JSON.parse(livesData)
      : { usedTimes: [], totalUsedToday: 0 };

    // Add current time to used times
    data.usedTimes.push(now);

    // Save to localStorage
    localStorage.setItem("apex_lives_system", JSON.stringify(data));

    // Recalculate available lives
    const { currentLives, nextRefill } = calculateAvailableLives();
    setAvailableLives(currentLives);
    setNextRefillTime(nextRefill);
  };

  // Update lives on mount and set up timer for refill countdown
  useEffect(() => {
    const updateLivesDisplay = () => {
      const { currentLives, nextRefill } = calculateAvailableLives();
      setAvailableLives(currentLives);
      setNextRefillTime(nextRefill);

      // Calculate time until next refill
      if (nextRefill) {
        const timeUntilRefill = nextRefill - Date.now();
        if (timeUntilRefill > 0) {
          const hours = Math.floor(timeUntilRefill / (60 * 60 * 1000));
          const minutes = Math.floor(
            (timeUntilRefill % (60 * 60 * 1000)) / (60 * 1000),
          );
          const seconds = Math.floor((timeUntilRefill % (60 * 1000)) / 1000);
          setLivesRefillTimer(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setLivesRefillTimer("");
        }
      }
    };

    updateLivesDisplay();
    const timer = setInterval(updateLivesDisplay, 1000);
    return () => clearInterval(timer);
  }, []);

  // Audio synthesizer helper inside browser
  const playSynthesizedTone = (
    frequency: number,
    durationMs: number,
    type: OscillatorType = "sine",
  ) => {
    if (muted) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      }
      const audioCtx = audioContextRef.current;
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + durationMs / 1000,
      );

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + durationMs / 1000);
    } catch (e) {
      // Audio fallback silent
    }
  };

  // Sound triggers
  const playJumpSound = () => playSynthesizedTone(520, 110, "sine");
  const playHitSound = () => {
    playSynthesizedTone(220, 150, "sawtooth");
    setTimeout(() => playSynthesizedTone(140, 200, "sawtooth"), 100);
  };
  const playGameOverSound = () => {
    playSynthesizedTone(330, 250, "triangle");
    setTimeout(() => playSynthesizedTone(261, 250, "triangle"), 200);
    setTimeout(() => playSynthesizedTone(196, 400, "sawtooth"), 400);
  };
  const playBonusSound = () => {
    playSynthesizedTone(587, 80, "sine");
    setTimeout(() => playSynthesizedTone(880, 150, "sine"), 80);
  };

  // Setup stars in background
  const initBackgroundStars = (canvasWidth: number, canvasHeight: number) => {
    const list: Star[] = [];
    for (let i = 0; i < 25; i++) {
      list.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * (canvasHeight - 100),
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.8 + 0.1,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }
    gameRef.current.stars = list;
  };

  // Setup responsive FPS and Ping
  useEffect(() => {
    const pingInterval = setInterval(() => {
      setSimulatedLatency((prev) => {
        const jitter = Math.floor(Math.random() * 5) - 2;
        return Math.max(8, Math.min(22, prev + jitter));
      });
    }, 3000);

    const fpsInterval = setInterval(() => {
      setFps((prev) => {
        const jitter = parseFloat((Math.random() * 0.8 - 0.4).toFixed(2));
        return Math.max(59.1, Math.min(60.05, prev + jitter));
      });
    }, 1500);

    return () => {
      clearInterval(pingInterval);
      clearInterval(fpsInterval);
    };
  }, []);

  // Capture user triggers inside Game
  const triggerDinoJump = () => {
    const gr = gameRef.current;
    if (gr.gameState === "idle") {
      setGameState("playing");
      gr.gameState = "playing";
      playBonusSound();
      return;
    }
    if (gr.gameState === "playing" && !gr.isJumping) {
      gr.isJumping = true;
      gr.dinoVy = -8.5; // Jump strength physics
      playJumpSound();

      // Emit nice cloud sparks on jumping
      for (let i = 0; i < 8; i++) {
        gr.particles.push({
          x: gr.dinoX + 10,
          y: gr.floorY,
          vx: Math.random() * 3 - 2,
          vy: Math.random() * -2 - 0.5,
          size: Math.random() * 3 + 1,
          color: "rgba(22, 198, 94, 0.6)",
          life: 0,
          maxLife: Math.random() * 25 + 15,
        });
      }
    }
  };

  const handleResetSimulation = () => {
    // Check if lives are available
    if (availableLives <= 0) {
      setUnlockError("No lives available. Wait for refill.");
      return;
    }

    const gr = gameRef.current;

    // Reset state values
    gr.lives = 1;
    gr.score = 0;
    gr.obstacles = [];
    gr.particles = [];
    gr.dinoY = gr.floorY - gr.dinoHeight;
    gr.dinoVy = 0;
    gr.isJumping = false;
    gr.invincibleTimer = 0;
    gr.speed = 5.2 + selectedOpponent.level * 0.15; // Adjust baseline speed per difficulty level

    setLives(1);
    setScore(0);
    setGameState("idle");
    gr.gameState = "idle";
    playBonusSound();
  };

  const handleEnterSetup = () => {
    setGameState("setup");
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
  };

  const handlePerformUnlock = async (nodeName: string) => {
    if (!walletConnected) {
      onConnectClick();
      return;
    }

    try {
      setIsUnlocking(true);
      setUnlockError(null);
      setUnlockConsole(["Preparing payment transaction..."]);

      const provider = (window as any).solana;
      if (!provider) throw new Error("Wallet not found");

      const fromPubkey = provider.publicKey;
      const toPubkey = new PublicKey(TREASURY_WALLET);

      const lamports = UNLOCK_PRICE_SOL * 1e9;

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports,
        }),
      );

      transaction.feePayer = fromPubkey;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      setUnlockConsole((prev) => [...prev, "Requesting wallet signature..."]);

      const signed = await provider.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());

      setUnlockConsole((prev) => [
        ...prev,
        `TX SENT: ${signature}`,
        "Confirming payment on-chain...",
      ]);

      await connection.confirmTransaction(signature, "confirmed");

      setUnlockConsole((prev) => [
        ...prev,
        "Payment confirmed ✅ Unlocking node...",
      ]);

      const ok = await onUnlockNode(nodeName);

      if (ok) {
        const matched = OPPONENTS.find((o) => o.name === nodeName);
        if (matched) {
          setSelectedOpponent(matched);
        }
        setUnlockConsole((prev) => [
          ...prev,
          `[SUCCESS] Node "${nodeName}" unlocked permanently.`,
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setUnlockError(err.message || "Transaction failed");
    } finally {
      setIsUnlocking(false);
    }
  };

  // Add event listeners for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === "setup" || !walletConnected) return;

      if (e.code === "Space") {
        e.preventDefault();
        triggerDinoJump();
      } else if (e.code === "KeyR" || e.code === "KeyK") {
        // 'R' triggers simulated reboot
        handleResetSimulation();
      } else if (e.code === "Escape") {
        // Escape returns to setups choices
        handleEnterSetup();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, walletConnected, selectedOpponent]);

  // Main Canvas Rendering & Physics execution loops
  useEffect(() => {
    if (gameState === "setup" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Maintain virtual width high resolution
    canvas.width = 800;
    canvas.height = 240;

    // Reset physics on launch
    initBackgroundStars(canvas.width, canvas.height);
    const gr = gameRef.current;
    gr.floorY = 200;
    gr.lastObstacleSpawn = 0;
    gr.nextObstacleDelay = 75; // First obstacle spawns faster

    let localFrame = 0;

    const gameLoop = () => {
      localFrame++;
      gr.tickCounter = localFrame;

      // Ensure canvas matches viewport
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Rendering cyber starfield
      gr.stars.forEach((star) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);

        if (gr.gameState === "playing") {
          star.x -= star.speed * (gr.speed * 0.15);
          if (star.x < 0) {
            star.x = canvas.width;
            star.y = Math.random() * (canvas.height - 100);
          }
        }
      });

      // Physics operations when game cycle is actively running
      if (gr.gameState === "playing") {
        // Dino gravity kinematics
        gr.dinoY += gr.dinoVy;
        gr.dinoVy += 0.65; // gravity factor

        if (gr.dinoY >= gr.floorY - gr.dinoHeight) {
          gr.dinoY = gr.floorY - gr.dinoHeight;
          gr.dinoVy = 0;
          gr.isJumping = false;
        }

        // Increment core simulation hash speed!
        gr.speed += 0.0006;

        // Scoring: 1 point every 6 frames
        if (localFrame % 6 === 0) {
          gr.score += 1;
          setScore(gr.score);

          // Signal sound milestone trigger for retro dopamine feedback
          if (gr.score > 0 && gr.score % 100 === 0) {
            playBonusSound();
          }
        }

        // Count down invite flash immunity
        if (gr.invincibleTimer > 0) {
          gr.invincibleTimer--;
        }

        // Spawn cybersecurity barriers (faster spawn rate)
        const spawnThresh = Math.max(75, 90 - gr.speed * 1.2);
        if (localFrame - gr.lastObstacleSpawn > gr.nextObstacleDelay) {
          // Dynamic choice list based on selection
          const obstacleTypes: Array<"tree" | "bird" | "spike" | "hazard"> = [
            "tree",
            "spike",
          ];
          if (selectedOpponent.level >= 6) {
            obstacleTypes.push("bird");
          }
          if (selectedOpponent.level >= 8) {
            obstacleTypes.push("hazard");
          }

          const chosenType =
            obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
          let oWidth = 24;
          let oHeight = 34;
          let oY = gr.floorY - oHeight;

          if (chosenType === "bird") {
            oWidth = 26;
            oHeight = 22;
            // fly mid-air or low-air
            oY = Math.random() > 0.5 ? gr.floorY - 55 : gr.floorY - 26;
          } else if (chosenType === "spike") {
            oWidth = 20;
            oHeight = 20;
            oY = gr.floorY - oHeight;
          } else if (chosenType === "hazard") {
            oWidth = 28;
            oHeight = 28;
            oY = gr.floorY - oHeight;
          }

          gr.obstacles.push({
            id: localFrame,
            x: canvas.width + 20,
            y: oY,
            width: oWidth,
            height: oHeight,
            type: chosenType,
            speed: gr.speed,
            color:
              chosenType === "tree"
                ? "#ff4154"
                : chosenType === "bird"
                  ? "#c084fc"
                  : chosenType === "hazard"
                    ? "#eab308"
                    : "#ffffff",
            glowColor:
              chosenType === "tree"
                ? "rgba(255, 65, 84, 0.4)"
                : chosenType === "bird"
                  ? "rgba(192, 132, 252, 0.4)"
                  : chosenType === "hazard"
                    ? "rgba(234, 179, 8, 0.4)"
                    : "rgba(255,255,255,0.3)",
            wingFrame: 0,
          });

          gr.lastObstacleSpawn = localFrame;
          // Random offset - minimal delay
          gr.nextObstacleDelay = spawnThresh + Math.random() * 15;
        }

        // Update active scroll particles
        if (localFrame % 3 === 0 && !gr.isJumping) {
          // Footstep grid ground particle dust
          gr.particles.push({
            x: gr.dinoX + 4,
            y: gr.floorY - 2,
            vx: -gr.speed * 0.35 - Math.random() * 1,
            vy: -0.2 - Math.random() * 0.5,
            size: Math.random() * 2 + 1,
            color: "rgba(255, 255, 255, 0.45)",
            life: 0,
            maxLife: Math.random() * 15 + 10,
          });
        }

        // Move obstacles and assess structural collisions
        for (let i = gr.obstacles.length - 1; i >= 0; i--) {
          const obs = gr.obstacles[i];
          obs.x -= obs.speed;

          // Flutter drones wing animation
          if (obs.type === "bird" && localFrame % 6 === 0) {
            obs.wingFrame = obs.wingFrame === 1 ? 0 : 1;
          }

          // Bound limits
          if (obs.x + obs.width < -30) {
            gr.obstacles.splice(i, 1);
            continue;
          }

          // Core Collision overlap
          if (gr.invincibleTimer === 0) {
            const bufferX = 6; // Hitbox reduction to feel forgiving and arcade-accurate
            const bufferY = 4;
            if (
              gr.dinoX + bufferX < obs.x + obs.width &&
              gr.dinoX + gr.dinoWidth - bufferX > obs.x &&
              gr.dinoY + bufferY < obs.y + obs.height &&
              gr.dinoY + gr.dinoHeight - bufferY > obs.y
            ) {
              // Structural collision detected!
              playHitSound();

              // Detonate bright neon particle scatter
              for (let p = 0; p < 22; p++) {
                gr.particles.push({
                  x: obs.x + obs.width / 2,
                  y: obs.y + obs.height / 2,
                  vx: (Math.random() - 0.5) * 8,
                  vy: (Math.random() - 0.5) * 8 - 2,
                  size: Math.random() * 4 + 1.5,
                  color: obs.color,
                  life: 0,
                  maxLife: Math.random() * 35 + 20,
                });
              }

              // Instant failure on touching one hurdle
              gr.lives = 0;
              setLives(0);

              // Use a life from the lives system
              useLife();

              // Game over simulation failed
              setGameState("game_over");
              gr.gameState = "game_over";

              // Play system failure tune
              playGameOverSound();

              // Compute financial outcomes based on score!
              const levelMultiplier = selectedOpponent.multiplier;
              const scoreUsdReward = gr.score * 0.0001 * levelMultiplier;
              setEarningsWon(scoreUsdReward);

              if (scoreUsdReward > 0) {
                // Mint simulated earnings dynamically and sync score with db
                addEarnings(scoreUsdReward, gr.score);
              }

              // Check high score threshold
              if (gr.score > highScore) {
                setHighScore(gr.score);
                localStorage.setItem("apex_dino_highscore", String(gr.score));
              }

              // Notify root battle wrapper
              onBattleFinish(
                gr.score >= 100,
                selectedOpponent.name,
                scoreUsdReward,
              );
            }
          }
        }
      }

      // Update particle decay
      for (let i = gr.particles.length - 1; i >= 0; i--) {
        const p = gr.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        if (p.life >= p.maxLife) {
          gr.particles.splice(i, 1);
        }
      }

      // Draw horizontal scrolling cyberpunk ground floor base
      ctx.strokeStyle = "#444748";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, gr.floorY);
      ctx.lineTo(canvas.width, gr.floorY);
      ctx.stroke();

      // Horizontal ground marker scan lines
      let groundOffset = 0;
      if (gr.gameState === "playing") {
        groundOffset = (localFrame * gr.speed) % 80;
      }
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      for (let x = canvas.width - groundOffset; x > -20; x -= 60) {
        ctx.beginPath();
        ctx.moveTo(x, gr.floorY);
        ctx.lineTo(x - 15, canvas.height);
        ctx.stroke();
      }

      // Render custom pixelated cybernetic Dino
      const isInvincibleFlashing =
        gr.invincibleTimer > 0 && Math.floor(localFrame / 4) % 2 === 0;
      if (!isInvincibleFlashing) {
        // Dino running feet cycles
        let dinoFrame = 2; // Jump stance
        if (gr.gameState === "playing" && !gr.isJumping) {
          dinoFrame = Math.floor(localFrame / 6) % 2; // alternating walks
        } else if (
          gr.gameState === "idle" ||
          gr.gameState === "game_over" ||
          gr.gameState === "setup"
        ) {
          dinoFrame = 0; // standard stand pose
        }

        ctx.save();
        ctx.fillStyle = gr.gameState === "hit" ? "#ff4154" : "#ffffff";
        ctx.shadowColor = "#22c55e";
        ctx.shadowBlur = 8;

        const pixelSize = 2.0; // Responsive coordinate multiplier
        // Glow visor and custom layout
        const dinoGrid = [
          "        ████████",
          "        █████████",
          "        ████████",
          "        █████",
          "        █████████",
          "██      █████",
          "██    ███████",
          "█████████████",
          " ████████████",
          "  ███████████",
          "   █████████",
          "    ████████",
          "     ██████",
          "      ████",
        ];

        // Draw body
        for (let row = 0; row < dinoGrid.length; row++) {
          for (let col = 0; col < dinoGrid[row].length; col++) {
            if (dinoGrid[row][col] === "█") {
              ctx.fillRect(
                gr.dinoX + col * pixelSize,
                gr.dinoY + row * pixelSize,
                pixelSize,
                pixelSize,
              );
            }
          }
        }

        // Visor glow
        ctx.fillStyle = gr.gameState === "hit" ? "#ffffff" : "#22c55e";
        ctx.fillRect(
          gr.dinoX + 11 * pixelSize,
          gr.dinoY + 1.5 * pixelSize,
          3.5 * pixelSize,
          pixelSize,
        );

        // Render alternating moving legs
        ctx.fillStyle = gr.gameState === "hit" ? "#ff4154" : "#ffffff";
        if (dinoFrame === 0) {
          ctx.fillRect(
            gr.dinoX + 5 * pixelSize,
            gr.dinoY + 14 * pixelSize,
            2 * pixelSize,
            2 * pixelSize,
          );
          ctx.fillRect(
            gr.dinoX + 9 * pixelSize,
            gr.dinoY + 14 * pixelSize,
            2 * pixelSize,
            4 * pixelSize,
          );
        } else if (dinoFrame === 1) {
          ctx.fillRect(
            gr.dinoX + 5 * pixelSize,
            gr.dinoY + 14 * pixelSize,
            2 * pixelSize,
            4 * pixelSize,
          );
          ctx.fillRect(
            gr.dinoX + 9 * pixelSize,
            gr.dinoY + 14 * pixelSize,
            2 * pixelSize,
            2 * pixelSize,
          );
        } else {
          // jumping state pose
          ctx.fillRect(
            gr.dinoX + 5 * pixelSize,
            gr.dinoY + 14 * pixelSize,
            2 * pixelSize,
            2 * pixelSize,
          );
          ctx.fillRect(
            gr.dinoX + 9 * pixelSize,
            gr.dinoY + 14 * pixelSize,
            2 * pixelSize,
            2 * pixelSize,
          );
        }

        ctx.restore();
      }

      // Render obstacles beautifully with custom high-tech glowing vectors
      gr.obstacles.forEach((obs) => {
        ctx.save();
        ctx.fillStyle = obs.color;
        ctx.shadowColor = obs.color;
        ctx.shadowBlur = 10;

        if (obs.type === "tree") {
          // Drawn as custom hacker node blocks
          ctx.fillRect(
            obs.x + obs.width / 3,
            obs.y + obs.height / 3,
            obs.width / 3,
            obs.height * (2 / 3),
          ); // Trunk
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height / 3); // Main horizontal branching terminal
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(obs.x + obs.width / 2 - 2, obs.y + 4, 4, 4); // Glowing center module info
        } else if (obs.type === "spike") {
          // Drawn as a sleek digital hazard spike pyramid
          ctx.beginPath();
          ctx.moveTo(obs.x, obs.y + obs.height);
          ctx.lineTo(obs.x + obs.width / 2, obs.y);
          ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
          ctx.closePath();
          ctx.fill();
        } else if (obs.type === "bird") {
          // Cyber drone / flapping drone
          ctx.fillRect(
            obs.x,
            obs.y + obs.height / 3,
            obs.width,
            obs.height / 3,
          ); // Main chassis
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(obs.x + obs.width - 6, obs.y + obs.height / 3 + 2, 4, 3); // Cyber scanner eye sensor

          ctx.fillStyle = obs.color;
          // Wing flutter oscillation based on state
          if (obs.wingFrame === 1) {
            ctx.fillRect(obs.x + obs.width / 3, obs.y, 6, obs.height / 3); // Top wing
          } else {
            ctx.fillRect(
              obs.x + obs.width / 3,
              obs.y + obs.height * (2 / 3),
              6,
              obs.height / 3,
            ); // Bottom Wing
          }
        } else if (obs.type === "hazard") {
          // Nuclear radioactive barrel
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height); // Outer capsule
          ctx.fillStyle = "#111111"; // Inner logo layout
          ctx.fillRect(obs.x + 4, obs.y + 5, obs.width - 8, 3);
          ctx.fillRect(obs.x + 4, obs.y + 11, obs.width - 8, 5);
          ctx.fillRect(obs.x + 4, obs.y + 20, obs.width - 8, 3);
        }

        ctx.restore();
      });

      // Render glowing particle bursts
      gr.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });

      // Overlays inside active play stages (Idle, hit & Game Over screens inside viewport)
      if (gr.gameState === "idle") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.textAlign = "center";

        ctx.fillStyle = "#ffffff";
        ctx.font =
          '10px "JetBrains Mono", ui-monospace, SFMono-Regular, monospace';
        ctx.shadowColor = "#22c55e";
        ctx.shadowBlur = 10;
        ctx.fillText(
          "PRESS [SPACE] OR TAP VIEWPORT TO START_COMPILATION",
          canvas.width / 2,
          canvas.height / 2 - 10,
        );

        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        ctx.fillText(
          "DIFFICULTY SCALING LINKED TO OPPONENT NODE HARNESS: " +
            selectedOpponent.name,
          canvas.width / 2,
          canvas.height / 2 + 15,
        );
        ctx.restore();
      } else if (gr.gameState === "game_over") {
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.textAlign = "center";

        ctx.fillStyle = "#ff4154";
        ctx.font = '13px "Space Grotesk", sans-serif';
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#ff4154";
        ctx.fillText(
          "SIMULATION FAILED // CONFLICT PAYLOAD SHUTDOWN",
          canvas.width / 2,
          canvas.height / 2 - 30,
        );

        ctx.fillStyle = "#ffffff";
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.shadowBlur = 0;
        ctx.fillText(
          `TOTAL SCORE COMPLED: ${String(gr.score).padStart(5, "0")}   |   LEDGER YIELD OBTAINED: $${(gr.score * 0.0001 * selectedOpponent.multiplier).toFixed(4)}`,
          canvas.width / 2,
          canvas.height / 2 + 5,
        );

        ctx.fillStyle = "rgba(22, 198, 94, 0.8)";
        ctx.fillText(
          "PRESS [R] OR CLICK BUTTON BELOW TO RE-INITIATE SYNAPSE",
          canvas.width / 2,
          canvas.height / 2 + 35,
        );
        ctx.restore();
      }

      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameState, selectedOpponent, muted]);

  return (
    <section
      id="arena-battle-section"
      className="py-12 px-4 md:px-16 max-w-7xl mx-auto scroll-mt-24"
    >
      {/* HUD System Environment Banner */}
      <div className="text-left mb-8 max-w-xl">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-green-400 animate-pulse" />
          <span className="font-mono text-[10px] text-zinc-400 tracking-widest uppercase">
            CONSEQUENCE RESOLUTION LAB
          </span>
        </div>
        <h2 className="font-display text-2xl md:text-4xl font-extrabold text-white uppercase tracking-tight">
          BATTLE SIMULATOR
        </h2>
        <p className="font-sans text-xs text-neutral-400 mt-1">
          Hacker-grade validation terminal. Hack the hostile mainframe node by
          preserving the physical state integrity of the running DINO_RUN
          compiler instance.
        </p>
      </div>

      {!walletConnected ? (
        /* DISCONNECTED WALLET HARD LOCKOUT HUD */
        <div
          className="border border-red-900 bg-[#070707] p-8 md:p-12 text-center relative overflow-hidden"
          id="arena-disconnect-lock"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-950/15 blur-3xl pointer-events-none rounded-full" />
          <div className="max-w-md mx-auto space-y-6 relative z-10">
            <div className="w-14 h-14 border border-red-900/40 flex items-center justify-center mx-auto bg-[#101010] text-red-500 rounded">
              <Zap className="w-7 h-7 text-red-500 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="font-display text-lg font-extrabold uppercase tracking-widest text-white">
                DECENTRALIZED ACCESS DENIED
              </h3>
              <p className="font-mono text-[9px] text-[#ff4154] uppercase tracking-widest">
                ERROR CODE: APEX_COUPLE_MISSING_KEY
              </p>
            </div>

            <p className="font-sans text-xs text-zinc-400 leading-relaxed">
              Consensus simulation operations require persistent cryptographic
              validation to register generated hash outputs onto the leaderboard
              ledger. Please connect your credential wallet card first.
            </p>

            <button
              id="inline-connect-wallet-btn"
              onClick={onConnectClick}
              className="px-8 py-3 bg-white text-black font-mono text-xs font-black uppercase tracking-wider hover:bg-neutral-200 transition-colors"
            >
              CONNECT OPERATOR WALLET
            </button>
          </div>
        </div>
      ) : (
        /* CONNECTED MAIN HUD STREAM */
        <div id="full-harness-connected" className="space-y-6">
          {gameState === "setup" ? (
            /* SETUP TAB: TARGET CHOICE SELECTION GRID */
            <div
              className="border border-neutral-800 bg-[#0e0e0e]/95 p-6 md:p-8 rounded-lg space-y-6"
              id="hacker-opponent-picker"
            >
              {unlockError && (
                <div className="p-3 bg-red-950/40 border border-red-500/35 text-red-100 text-xs font-mono rounded flex items-center gap-2 select-none">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{unlockError}</span>
                </div>
              )}

              {availableLives <= 0 && (
                <div className="p-4 bg-yellow-950/40 border border-yellow-700/50 text-yellow-200 text-xs font-mono rounded flex flex-col gap-2 select-none">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />
                    <span className="font-bold uppercase">
                      NO LIVES AVAILABLE
                    </span>
                  </div>
                  <span>Next life refill: {livesRefillTimer || "Ready!"}</span>
                </div>
              )}

              {isUnlocking ? (
                /* TRANSACT CONTRACT INTERFACE LOGS */
                <div className="border border-emerald-500/30 bg-black/95 p-6 md:p-8 rounded-lg space-y-6 font-mono text-xs">
                  <div className="border-b border-neutral-900 pb-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-emerald-400 animate-spin" />
                      <span className="text-white font-extrabold uppercase tracking-widest text-xs">
                        SMART DECRYPT ESCROW
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 font-extrabold px-2 py-0.5 rounded tracking-widest">
                      DEVNET
                    </span>
                  </div>

                  <p className="font-sans text-xs text-neutral-400 leading-relaxed block">
                    Signing consensus contract keys for{" "}
                    <strong className="text-white">
                      {selectedOpponent.name}
                    </strong>
                    . Minting authorization hashes in progress...
                  </p>

                  <div className="bg-[#040404] p-4 border border-zinc-900 rounded-sm text-zinc-300 space-y-1.5 max-h-52 overflow-y-auto">
                    {unlockConsole.map((log, index) => (
                      <div key={index} className="flex gap-2 text-[11px]">
                        <span className="text-emerald-500 font-bold">&gt;</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>

                  <div className="font-sans text-[9px] text-zinc-500 text-center uppercase tracking-widest">
                    MUTATION ENFORCED BY BLOCKCHAIN MUTABLE STATE RULES
                  </div>
                </div>
              ) : (
                <>
                  <div className="border-b border-neutral-800 pb-3 flex justify-between items-center">
                    <div>
                      <span className="font-mono text-[10px] text-green-400 uppercase tracking-widest block font-bold">
                        NODE DIRECTORY SCANNER
                      </span>
                      <span className="font-sans text-xs text-zinc-400">
                        Identify a hostile ledger node to inject the compiler
                        attack. Difficulty dictates hurdle speed.
                      </span>
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1 bg-[#1a1a1a] border border-neutral-800 px-3 py-1 font-mono text-[10px] text-zinc-300">
                        <span>HIGH SCORE ledger:</span>
                        <span className="text-white font-black">
                          {String(highScore).padStart(5, "0")}
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-1 border px-3 py-1 font-mono text-[10px] rounded ${
                          availableLives > 0
                            ? "bg-green-950/30 border-green-700 text-green-300"
                            : "bg-red-950/30 border-red-700 text-red-300"
                        }`}
                      >
                        <span>LIVES:</span>
                        <span className="font-black">{availableLives}/3</span>
                        {nextRefillTime && (
                          <span className="text-[9px]">
                            ({livesRefillTimer})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {OPPONENTS.map((opp) => {
                      const isLocked =
                        opp.name !== "CYPHER_COBALT" &&
                        !unlockedNodes.includes(opp.name);
                      return (
                        <div
                          key={opp.name}
                          id={`opponent-choice-${opp.name}`}
                          onClick={() => {
                            if (availableLives <= 0) {
                              setUnlockError(
                                "No lives available. Wait for refill.",
                              );
                              return;
                            }
                            setSelectedOpponent(opp);
                            setUnlockError(null);
                            // If unlocked, start game immediately on tap
                            if (!isLocked) {
                              setGameState("idle");
                            }
                          }}
                          className={`p-5 rounded border text-left cursor-pointer transition-all relative flex flex-col justify-between gap-4 h-48 group ${
                            availableLives <= 0 &&
                            selectedOpponent.name === opp.name
                              ? "border-red-500/50 bg-red-950/5 opacity-50"
                              : selectedOpponent.name === opp.name
                                ? isLocked
                                  ? "border-red-500 bg-red-950/10"
                                  : "border-white bg-[#191919] shadow-[0_0_12px_rgba(255,255,255,0.05)]"
                                : isLocked
                                  ? "border-red-950/30 bg-[#060000] hover:border-red-900/50"
                                  : "border-neutral-850 bg-[#070707] hover:border-neutral-700"
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-center mb-2.5">
                              <span className="font-mono text-[9px] text-[#8e9192] uppercase font-bold tracking-wider">
                                // LOCALHOST_{opp.level}
                              </span>
                              <span
                                className={`font-mono text-[8px] px-2 py-0.5 tracking-widest uppercase font-black rounded ${
                                  isLocked
                                    ? "bg-red-950 text-red-400 border border-red-500/25"
                                    : selectedOpponent.name === opp.name
                                      ? "bg-white text-black"
                                      : "bg-neutral-900 text-neutral-400"
                                }`}
                              >
                                {isLocked
                                  ? "LOCKED // RES_REQ"
                                  : opp.difficultyLabel}
                              </span>
                            </div>

                            <h4 className="font-display text-sm font-bold text-white tracking-widest uppercase">
                              {opp.name}
                            </h4>
                            <p className="font-sans text-xs text-neutral-400 mt-1.5 leading-snug">
                              {opp.description}
                            </p>
                          </div>

                          <div className="flex justify-between items-end border-t border-neutral-800/40 pt-2 font-mono text-[10px]">
                            <div>
                              <span className="text-zinc-500 uppercase text-[8px] block select-none">
                                DEC_STATUS
                              </span>
                              {isLocked ? (
                                <span className="text-red-400 font-extrabold uppercase">
                                  DECRYPT FEE // 0.17 SOL
                                </span>
                              ) : (
                                <span className="text-[#22c55e] font-bold">
                                  +{opp.multiplier.toFixed(1)}X MULTIPLIER
                                  (FREE)
                                </span>
                              )}
                            </div>

                            <div
                              className={`w-6 h-6 border rounded-full flex items-center justify-center transition-all ${
                                selectedOpponent.name === opp.name
                                  ? isLocked
                                    ? "border-red-550 text-red-400 bg-red-950/40"
                                    : "border-white bg-white text-black"
                                  : "border-neutral-800 text-[#8e9192] group-hover:text-white"
                              }`}
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-center pt-4">
                    {selectedOpponent.name !== "CYPHER_COBALT" &&
                    !unlockedNodes.includes(selectedOpponent.name) ? (
                      <button
                        id="purchase-node-sim-btn"
                        onClick={() =>
                          handlePerformUnlock(selectedOpponent.name)
                        }
                        className="px-8 py-4.5 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-black uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(239,68,68,0.2)] cursor-pointer inline-flex items-center gap-2 border border-red-500/40 rounded-sm"
                      >
                        <Key className="w-4 h-4 text-white" />
                        <span>DECRYPT COMMISSARY SYSTEM NODE ($10 USD)</span>
                      </button>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* ACTIVE RUNNER SIMULATION SCREEN */
            <div className="space-y-4">
              {/* Top Banner Dashboard Stats matching the UI mockup */}
              <div className="border border-neutral-800 bg-[#060606] p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rounded-lg">
                <div className="text-left space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse"></span>
                    <span className="font-mono text-[9px] text-[#22c55e] tracking-widest font-black uppercase">
                      SIMULATION ENVIRONMENT ACTIVE
                    </span>
                  </div>
                  <h3 className="font-display text-lg md:text-xl font-extrabold text-white tracking-widest leading-none">
                    ARENA: DINO_RUN.EXE
                  </h3>
                </div>

                <div className="flex flex-row flex-wrap gap-4 md:gap-6 items-center">
                  {/* Hearts block */}
                  <div className="text-left space-y-0.5">
                    <span className="font-mono text-[8px] text-zinc-500 uppercase block tracking-wider font-bold">
                      LIVES REMAINING
                    </span>
                    <div
                      className="flex gap-1 items-center"
                      id="heart-lives-display"
                    >
                      {[...Array(3)].map((_, i) => (
                        <Heart
                          key={i}
                          className={`w-4 h-4 transition-all ${
                            i < availableLives
                              ? "text-red-500 fill-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]"
                              : "text-neutral-800 fill-transparent stroke-neutral-800"
                          }`}
                        />
                      ))}
                      <span className="font-mono text-[10px] text-zinc-300 font-bold ml-1">
                        {availableLives}/3
                      </span>
                    </div>
                    {nextRefillTime && (
                      <span className="font-mono text-[8px] text-yellow-600 uppercase tracking-wider mt-1">
                        Refill: {livesRefillTimer}
                      </span>
                    )}
                  </div>

                  {/* Simulated ledger balance */}
                  <div className="text-left space-y-0.5 border-l border-neutral-800 pl-4 md:pl-6">
                    <span className="font-mono text-[8px] text-zinc-500 uppercase block tracking-wider font-bold">
                      BALANCE STATUS
                    </span>
                    <div className="font-mono text-xs text-white font-bold flex flex-col gap-0.5 leading-none pt-0.5">
                      <div className="flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-yellow-500" />
                        <span>
                          $
                          {earnings.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })}{" "}
                          USD
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Real-time score ticker */}
                  <div className="text-left space-y-0.5 border-l border-neutral-800 pl-4 md:pl-6 min-w-[100px]">
                    <span className="font-mono text-[8px] text-zinc-500 uppercase block tracking-wider font-bold">
                      CURRENT SCORE
                    </span>
                    <span className="font-mono text-sm sm:text-base text-zinc-200 block font-black tracking-widest leading-none pt-0.5">
                      {String(score).padStart(5, "0")}
                    </span>
                  </div>

                  {/* Sound Trigger */}
                  <button
                    onClick={() => setMuted(!muted)}
                    className="p-1.5 border border-neutral-800 hover:border-neutral-500 hover:bg-neutral-900 bg-transparent text-zinc-400 hover:text-white transition-colors"
                    title={muted ? "Unmute simulation audio" : "Mute audio"}
                    id="audio-synth-toggle-btn"
                  >
                    {muted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Viewport Core Frame Layout */}
              <div className="relative">
                {/* HUD Top Latency indicator */}
                <div className="absolute top-2.5 left-4 z-10 font-mono text-[8px] text-neutral-500 tracking-widest uppercase">
                  LATENCY: {simulatedLatency}MS // TARGET:{" "}
                  {selectedOpponent.name}
                </div>

                {/* HUD Top Right FPS */}
                <div className="absolute top-2.5 right-4 z-10 font-mono text-[8px] text-neutral-500 tracking-widest uppercase">
                  FPS: {fps.toFixed(2)}
                </div>

                {/* Main Interactive Game Canvas Container */}
                <div
                  id="sim-viewport-canvas-wrapper"
                  onClick={triggerDinoJump}
                  className="w-full bg-black border-2 border-neutral-800 rounded-lg overflow-hidden cursor-pointer relative select-none shadow-inner group font-sans md:h-auto h-[75vh] flex items-center justify-center"
                  style={{ aspectRatio: "800 / 240" }}
                >
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full block"
                    style={{ display: "block", objectFit: "contain" }}
                  />

                  {/* HTML REPLAY QUESTION MODAL WINDOW */}
                  {gameState === "game_over" && (
                    <div
                      className="absolute inset-0 bg-black/90 backdrop-blur-xs flex flex-col justify-center items-center p-6 text-center z-20 animate-fade-in cursor-default"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="space-y-4 max-w-sm">
                        <div className="flex justify-center select-none">
                          <RotateCcw className="w-8 h-8 text-red-500 animate-spin-slow" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-display text-sm font-black uppercase text-red-500 tracking-widest leading-none">
                            COMPILE FAULT DETECTED
                          </h4>
                          <p className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">
                            Integrity compromised // Final Score: {score}
                          </p>
                        </div>

                        <p className="font-sans text-xs text-zinc-400">
                          Intrusion route failed. Do you want to keep playing on
                          this node? Start another compiler sequence from point
                          0.
                        </p>

                        <div className="flex gap-4 justify-center pt-2 select-none">
                          <button
                            onClick={handleResetSimulation}
                            className="px-5 py-2.5 bg-green-500 hover:bg-green-400 text-black font-mono text-[10px] font-extrabold uppercase tracking-widest rounded-sm transition-colors cursor-pointer"
                          >
                            YES (KEEP PLAYING)
                          </button>
                          <button
                            onClick={handleEnterSetup}
                            className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-zinc-400 hover:text-white font-mono text-[10px] font-extrabold uppercase tracking-widest rounded-sm transition-colors cursor-pointer"
                          >
                            NO (EXIT)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cyber Scanline Grid Overlay Effect */}
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] opacity-40 z-1" />

                  {/* Bottom Hud Line inside canvas container */}
                  <div className="absolute bottom-2 left-4 right-4 flex justify-between items-center pointer-events-none z-10 font-mono text-[8.5px] text-neutral-600 tracking-wider">
                    <span>NODE: DEV-ARC-01 // HOST: SEC_CONN</span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      <span>SECURE NEURAL LINK ACTIVE</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Control Shortcut Bars at Bottom */}
              <div
                id="hud-operational-keys"
                className="border border-neutral-850 bg-black p-3.5 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 rounded-lg"
              >
                {/* [SPACE] JUMP - Always show */}
                <button
                  id="shortcut-btn-jump"
                  onClick={triggerDinoJump}
                  className="px-5 py-2 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-500 rounded text-neutral-300 hover:text-white transition-all font-mono text-[10px] tracking-wider uppercase font-bold inline-flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <span className="bg-[#1f1f1f] text-white px-2 py-0.5 rounded font-black border border-neutral-700">
                    [SPACE]
                  </span>
                  <span>JUMP / START</span>
                </button>

                {/* [R] RESET - Hidden on mobile */}
                <button
                  id="shortcut-btn-reset"
                  onClick={handleResetSimulation}
                  className="hidden sm:inline-flex px-5 py-2 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-500 rounded text-neutral-300 hover:text-white transition-all font-mono text-[10px] tracking-wider uppercase font-bold items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <span className="bg-[#1f1f1f] text-white px-2 py-0.5 rounded font-black border border-neutral-700">
                    [R]
                  </span>
                  <span>RESET SIMULATION</span>
                </button>

                {/* [ESC] TERMINATE - Hidden on mobile */}
                <button
                  id="shortcut-btn-terminate"
                  onClick={handleEnterSetup}
                  className="hidden sm:inline-flex px-5 py-2 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-500 rounded text-neutral-300 hover:text-white transition-all font-mono text-[10px] tracking-wider uppercase font-bold items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <span className="bg-[#1f1f1f] text-white px-2 py-0.5 rounded font-black border border-neutral-700">
                    [ESC]
                  </span>
                  <span>TERMINATE</span>
                </button>
              </div>

              {/* Ledger earnings confirmation banner if finished a run */}
              {gameState === "game_over" && earningsWon > 0 && (
                <div
                  className="p-4 bg-emerald-950/20 border border-emerald-900 text-[#22c55e] font-sans text-xs flex flex-col sm:flex-row justify-between items-center gap-3 rounded-lg text-left"
                  id="retro-simulation-outcome-earn"
                >
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-5 h-5 text-[#22c55e] shrink-0" />
                    <div>
                      <span className="font-mono text-[9px] font-black uppercase tracking-widest block leading-none mb-0.5">
                        DECENTRALIZED CREDITS ALLOCATED
                      </span>
                      <span>
                        Simulation compiled successfully. Added{" "}
                        <strong>
                          $
                          {earningsWon.toLocaleString("en-US", {
                            minimumFractionDigits: 4,
                            maximumFractionDigits: 6,
                          })}{" "}
                          USD
                        </strong>{" "}
                        value hashes to your operator ledger card.
                      </span>
                    </div>
                  </div>

                  <span className="font-mono text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 font-bold rounded select-none shrink-0 uppercase tracking-widest">
                    LEDGER MINTED
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
