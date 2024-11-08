import { NextResponse } from "next/server";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from "@solana/web3.js";
import prisma from '@/app/db';
import { burnTokens } from "@/lib/Unstake";

const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com", "confirmed");

export async function POST(request: Request) {
  try {
    const { walletAddress, amount } = await request.json();

    if (!walletAddress || !amount) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }
    const transaction = new Transaction();
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(walletAddress);
    const burnIx = await burnTokens(
      walletAddress,
      process.env.NEXT_PUBLIC_PUBLIC_KEY!,
      amount,
      true
    ) as TransactionInstruction;
    const transferIx = SystemProgram.transfer({
      fromPubkey: new PublicKey(process.env.NEXT_PUBLIC_PUBLIC_KEY!),
      toPubkey: new PublicKey(walletAddress),
      lamports: amount * LAMPORTS_PER_SOL,
    });

    transaction.add(burnIx, transferIx);
    const unstakeRecord = await prisma.stake.create({
      data: {
        walletAddress,
        recipientAddress: process.env.NEXT_PUBLIC_PUBLIC_KEY!,
        amount: amount,
        signature: "",
        status: "pending"
      }
    });
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });

    const base64Transaction = serializedTransaction.toString('base64');

    return NextResponse.json({
      message: "Transaction created",
      transaction: base64Transaction,
      blockhash,
      lastValidBlockHeight,
      unstakeId: unstakeRecord.id
    });

  } catch (error) {
    console.error("Unstake error:", error);
    return NextResponse.json({ error: "Failed to process unstake" }, { status: 500 });
  }
}

