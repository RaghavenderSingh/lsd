"use client";
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins } from "lucide-react";
import { SolanaLogo } from "@/lib/sol";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionSignature,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  getAccount,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TokenAccountNotFoundError,
  createBurnCheckedInstruction,
  getMint,
} from "@solana/spl-token";

export default function StakeCard() {
  const { connected, publicKey, sendTransaction, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();
  const [amount, setAmount] = useState(0);
  const [stakedBalance, setStakedBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balLoading, setBalLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const mintAddress = new PublicKey(
    process.env.NEXT_PUBLIC_TOKEN_MINT_ADDRESS!
  );
  const fetchBalance = async () => {
    const balance1 = await connection.getBalance(publicKey!);
    console.log("balance == " + balance1);
    setWalletBalance(balance1 / LAMPORTS_PER_SOL);
  };

  async function fetchStakedBalance() {
    if (!publicKey) return;

    try {
      setBalLoading(true);
      setError(null);

      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintAddress,
        publicKey
      );

      const tokenAccount = await getAccount(connection, associatedTokenAddress);
      console.log("Token account:", tokenAccount);
      setStakedBalance(Number(tokenAccount.amount) / LAMPORTS_PER_SOL);
    } catch (error) {
      if (error instanceof TokenAccountNotFoundError) {
        // Token account doesn't exist yet - this is normal for new users
        setStakedBalance(0);
      } else {
        console.error("Error fetching staked balance:", error);
        setError("Failed to fetch staked balance. Please try again.");
        setStakedBalance(0);
      }
    } finally {
      setBalLoading(false);
    }
  }

  useEffect(() => {
    if (connected && publicKey) {
      fetchStakedBalance();
      fetchBalance();
    } else {
      setStakedBalance(0);
      setError(null);
    }
  }, [connected, publicKey]);

  async function handleSendSol() {
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    const recipientPubKey = new PublicKey(process.env.NEXT_PUBLIC_PUBLIC_KEY!);
    try {
      setIsLoading(true);
      setError(null);

      const transaction = new Transaction();
      const sendSolInstruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: recipientPubKey,
        lamports: amount * LAMPORTS_PER_SOL,
      });
      transaction.add(sendSolInstruction);

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);

      await saveStakeTransaction(
        publicKey.toString(),
        recipientPubKey.toString(),
        amount,
        signature
      );

      await fetchStakedBalance();
    } catch (e) {
      console.error("Error staking:", e);
      setError("Failed to stake. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveStakeTransaction(
    walletAddress: string,
    recipientAddress: string,
    amount: number,
    signature: string
  ) {
    try {
      const response = await fetch("/api/stake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          recipientAddress,
          amount,
          signature,
        }),
      });

      if (!response.ok) {
        throw new Error("Error saving stake transaction");
      }
    } catch (error) {
      console.error("Error saving stake transaction to the database:", error);
      throw error;
    }
  }

  async function handleUnstake() {
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userATA = await getAssociatedTokenAddress(mintAddress, publicKey);
      const tokenBalance = await connection.getTokenAccountBalance(userATA);
      const userBalance = Number(tokenBalance.value.amount) / LAMPORTS_PER_SOL;

      if (userBalance < amount) {
        throw new Error("Insufficient token balance");
      }
      const transaction = new Transaction();
      const { blockhash } = await connection.getLatestBlockhash("finalized");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      const burnInstruction = createBurnCheckedInstruction(
        userATA,
        mintAddress,
        publicKey,
        amount * LAMPORTS_PER_SOL,
        (await getMint(connection, mintAddress)).decimals
      );
      transaction.add(burnInstruction);
      const signature = await sendTransaction(transaction, connection);
      console.log("Transaction sent:", signature);
      const confirmation = await connection.confirmTransaction(
        signature,
        "confirmed"
      );

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed to confirm: ${JSON.stringify(
            confirmation.value.err
          )}`
        );
      }
      const response = await fetch("/api/unstake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          amount: amount,
          signature,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process unstake on server");
      }
      await fetchStakedBalance();
      console.log("Successfully unstaked tokens!");
    } catch (error: any) {
      console.error("Unstake error:", error);
      if (error.message.includes("Custom:18")) {
        setError(
          "There was an error with the unstake operation. Please try again later."
        );
      } else {
        setError(error.message || "Failed to unstake. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <div className="mt-12">
      <Card className="w-full min-w-[500px] border-[#e84125] border-2 rounded-lg shadow-md">
        <CardHeader className="flex justify-between items-center text-2xl">
          {balLoading ? (
            <span>Loading...</span>
          ) : (
            `${stakedBalance.toFixed(2)} SOL Staked`
          )}
        </CardHeader>
        <CardContent className="w-full">
          <Tabs defaultValue="stake" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger
                value="stake"
                className="data-[state=active]:bg-[#e84125] data-[state=active]:text-white"
              >
                STAKE
              </TabsTrigger>
              <TabsTrigger
                value="managestake"
                className="data-[state=active]:bg-[#e84125] data-[state=active]:text-white"
              >
                MANAGE STAKE
              </TabsTrigger>
            </TabsList>
            <TabsContent value="stake">
              <div className="mt-4 p-4">
                {error && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}
                <div className="mb-2">
                  <p className="text-xs text-gray-400">Amount to stake</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <SolanaLogo className="h-4 w-4 dark:text-white" />
                  </div>
                  <input
                    type="text"
                    className="w-full border-2 border-[#e84125] rounded-lg p-2 pl-10"
                    placeholder="0.00 SOL"
                    onChange={(e) => setAmount(Number(e.target.value))}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex justify-center items-center mt-3">
                  Avilable balance:{walletBalance}
                </div>
                <div className="mt-8">
                  {connected ? (
                    <Button
                      onClick={handleSendSol}
                      className="w-full bg-[#e84125] h-[40px] text-white text-lg font-bold hover:bg-[#e84125]"
                      disabled={isLoading}
                    >
                      {isLoading ? "Processing..." : "Stake"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setVisible(true)}
                      className="w-full bg-[#e84125] h-[40px] text-white text-lg font-bold hover:bg-[#e84125]"
                      disabled={isLoading}
                    >
                      Connect Wallet
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="managestake">
              <div className="mt-4 p-4">
                {error && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}
                <div className="mb-2">
                  <p className="text-xs text-gray-400">Amount to Unstake</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <SolanaLogo className="h-4 w-4 dark:text-white" />
                  </div>
                  <input
                    type="text"
                    className="w-full border-2 border-[#e84125] rounded-lg p-2 pl-10"
                    placeholder="0.00 SOL"
                    onChange={(e) => setAmount(Number(e.target.value))}
                    disabled={isLoading}
                  />
                </div>

                <div className="mt-8">
                  {connected ? (
                    <Button
                      className="w-full bg-[#e84125] h-[40px] text-white text-lg font-bold hover:bg-[#e84125]"
                      onClick={handleUnstake}
                      disabled={isLoading || amount > stakedBalance}
                    >
                      {isLoading ? "Processing..." : "Unstake"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setVisible(true)}
                      className="w-full bg-[#e84125] h-[40px] text-white text-lg font-bold hover:bg-[#e84125]"
                      disabled={isLoading}
                    >
                      Connect Wallet
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
