import { mintTokens } from "@/lib/mint";
import prisma from '@/app/db';
import { Connection, PublicKey } from "@solana/web3.js";
import { NextRequest, NextResponse } from "next/server";


const connection = new Connection("https://api.devnet.solana.com/", "confirmed");

let NEXT_PUBLIC_PUBLIC_KEY: PublicKey;
let NEXT_PUBLIC_TOKEN_MINT_ADDRESS: PublicKey;

try {
  NEXT_PUBLIC_PUBLIC_KEY = new PublicKey(process.env.NEXT_PUBLIC_PUBLIC_KEY!);
  NEXT_PUBLIC_TOKEN_MINT_ADDRESS = new PublicKey(process.env.NEXT_PUBLIC_TOKEN_MINT_ADDRESS!);
} catch (error) {
  console.error("Invalid public key:", error);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Webhook payload:", body);

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ message: "Invalid request format or empty array" });
    }

    const transaction = body[0];
    const { description, signature } = transaction;

    if (!description || !signature) {
      return NextResponse.json({ message: "Missing required transaction details" });
    }

    
    const details = description.split(" ");
    const fromAddress = details[0];
    const status = details[1];
    const amount = parseFloat(details[2]);
    const type = details[3];
    const toAddress = details[5];
console.log("toAddress walletAddress",toAddress);
console.log("fromAddress recipientAddress",fromAddress);
console.log("amount",amount);
console.log("signature",signature);
    const pendingStake = await prisma.stake.findFirst({
      where: {
        // walletAddress:fromAddress,
        // recipientAddress:toAddress,
       // status:'pending',
        signature: signature
      }
    });
   console.log(pendingStake)
    if (!pendingStake) {
      console.log("No pending stake found for transaction:", signature);
      return NextResponse.json({ message: "No matching pending stake found" });
    }

    if (type === "SOL" && status === "transferred") {
      try {
        // Mint tokens
        await mintTokens(fromAddress, amount);
        
     
        await prisma.stake.update({
          where: { id: pendingStake.id },
          data: {
            status: 'completed',
            signature: signature,
          }
        });

        console.log(`Stake completed for transaction ${signature}`);
        return NextResponse.json({ 
          message: "Stake completed successfully",
          signature: signature
        });
      } catch (error) {
        console.error("Error processing stake:", error);
        
        // Update stake record to failed status
        await prisma.stake.update({
          where: { id: pendingStake.id },
          data: {
            status: 'failed',
            signature: signature,
          }
        });

        return NextResponse.json({ 
          message: "Error processing stake",
          error: error
        }, { status: 500 });
      }
    }

    return NextResponse.json({ message: "Transaction processed" });
  } catch (error) {
    console.error("Error in webhook handler:", error);
    return NextResponse.json({
      message: "Error processing webhook",
      error: error
    }, { status: 500 });
  }
}