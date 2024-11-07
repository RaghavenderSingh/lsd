"use client";
import React, { useState } from "react";
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
import { useWalletModal, WalletModal } from "@solana/wallet-adapter-react-ui";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import prisma from "@/app/db";

export default function StakeCard() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();
  const [amount, setAmount] = useState(0);

  async function handleSendSol() {
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    try {
      const recipientPubKey = new PublicKey(
        "HkeCQhzEQxNosC47ecnnW8CnrrkzZ9VJDxq5BTZGuZd"
      );
      const transaction = new Transaction();
      const sendSolInstruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: recipientPubKey,
        lamports: amount * LAMPORTS_PER_SOL,
      });
      transaction.add(sendSolInstruction);

      const signature = await sendTransaction(transaction, connection);
      console.log(`Transaction signature: ${signature}`);

      // Save the stake transaction to the server-side API
      await saveStakeTransaction(
        publicKey.toString(),
        recipientPubKey.toString(),
        amount,
        signature
      );
    } catch (e) {
      console.log(e);
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

      console.log("Stake transaction saved to the database");
    } catch (error) {
      console.error("Error saving stake transaction to the database:", error);
    }
  }

  return (
    <div className="mt-12">
      <Card className="w-full min-w-[500px] border-[#e84125] border-2 rounded-lg shadow-md">
        <CardHeader className="flex justify-between items-center text-2xl">
          0.00 SOL Staked
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
                  />
                </div>

                <div className="mt-8">
                  {connected ? (
                    <Button
                      onClick={handleSendSol}
                      className="w-full bg-[#e84125] h-[40px] text-white text-lg font-bold hover:bg-[#e84125]"
                    >
                      Stake
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setVisible(true)}
                      className="w-full bg-[#e84125] h-[40px] text-white text-lg font-bold hover:bg-[#e84125]"
                    >
                      Connect Wallet
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="managestake">
              Manage your stake here.
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
