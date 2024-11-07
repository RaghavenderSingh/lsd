import { burnTokens, mintTokens, sendNativeTokens } from "@/lib/mint";
import { convertToTokenDecimalUnit } from "@/lib/util";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { NextRequest, NextResponse } from "next/server";

// Validate environment variables
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const TOKEN_MINT_ADDRESS = process.env.TOKEN_MINT_ADDRESS;

if (!PUBLIC_KEY || !TOKEN_MINT_ADDRESS) {
  throw new Error("Missing required environment variables: PUBLIC_KEY or TOKEN_MINT_ADDRESS");
}

// Validate public key format
try {
  new PublicKey(PUBLIC_KEY);
  new PublicKey(TOKEN_MINT_ADDRESS);
} catch (error) {
  throw new Error("Invalid public key format in environment variables");
}

const connection = new Connection(clusterApiUrl("devnet"));

interface TransferDetails {
  fromAddress: string;
  toAddress: string;
  amount: number;
}

function parseTransferDetails(body: any, type: string): TransferDetails | null {
  if (type === "SOL") {
    const transfer = body.nativeTransfers?.[0];
    if (!transfer) return null;
    
    return {
      fromAddress: transfer.fromUserAccount,
      toAddress: transfer.toUserAccount,
      amount: transfer.amount
    };
  } else if (type === TOKEN_MINT_ADDRESS) {
    const transfer = body.tokenTransfers?.[0];
    if (!transfer) return null;
    
    return {
      fromAddress: transfer.fromUserAccount,
      toAddress: transfer.toUserAccount,
      amount: transfer.tokenAmount
    };
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    if (!body.description || typeof body.description !== "string") {
      return NextResponse.json(
        { message: "Invalid request format" },
        { status: 400 }
      );
    }

    const description = body.description.split(" ");
    if (description.length < 6) {
      return NextResponse.json(
        { message: "Invalid description format" },
        { status: 400 }
      );
    }

    const type = description[3];
    const receiverAccount = description[5];

    // Validate transaction type
    if (type !== "SOL" && type !== TOKEN_MINT_ADDRESS) {
      return NextResponse.json(
        { message: "Invalid token type" },
        { status: 400 }
      );
    }

    const transferDetails = parseTransferDetails(body, type);
    if (!transferDetails) {
      return NextResponse.json(
        { message: "Invalid transfer details" },
        { status: 400 }
      );
    }

    const { fromAddress, toAddress, amount } = transferDetails;

    // Validate destination address
    if (toAddress !== PUBLIC_KEY) {
      return NextResponse.json(
        { message: "Invalid destination address" },
        { status: 400 }
      );
    }

    // Process transaction based on type
    if (type === "SOL") {
      await mintTokens(fromAddress, toAddress, amount);
    } else {
      const tokenAmount = convertToTokenDecimalUnit(amount);
      console.log("Converting token amount:", tokenAmount);
      await burnTokens(fromAddress, toAddress, tokenAmount);
      await sendNativeTokens(fromAddress, toAddress, tokenAmount);
    }

    return NextResponse.json(
      { message: "Transaction successful" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error processing transaction:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Error processing transaction", error: errorMessage },
      { status: 500 }
    );
  }
}