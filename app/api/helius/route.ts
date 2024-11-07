import { mintTokens } from "@/lib/mint";
import { Connection, PublicKey } from "@solana/web3.js";
import { NextRequest, NextResponse } from "next/server";

// Initialize Solana connection and public keys
const connection = new Connection("https://api.devnet.solana.com/", "confirmed");

let PUBLIC_KEY: PublicKey;
let TOKEN_MINT_ADDRESS: PublicKey;

try {
  PUBLIC_KEY = new PublicKey(process.env.PUBLIC_KEY!);
  TOKEN_MINT_ADDRESS = new PublicKey(process.env.TOKEN_MINT_ADDRESS!);
} catch (error) {
  console.error("Invalid public key:", error);
}

export async function POST(request: Request) {
  try {
   
    const body = await request.json();
    console.log("Request body:", body); 

 
    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ message: "Invalid request format or empty array" });
    }

  
    const firstItem = body[0];
    const description = firstItem?.description;
    console.log("Description:", description);
  
    if (!description) {
      return NextResponse.json({ message: "No description provided" });
    }

  
    const details = description.split(" ");
    const type = details[3]; 
    const receiverAccount = details[0];
    const status =details[1]
    const amount = details[2];
    console.log("Type:", details);
   
    if (type === "SOL" && status ==="transferred") {
      await mintTokens(receiverAccount,amount)
      return NextResponse.json({ message: "SOL transaction received" });
    } else if (type === TOKEN_MINT_ADDRESS.toString()) {
      return NextResponse.json({ message: "Token transaction received" });
    } else {
      return NextResponse.json({ message: "Invalid token sent" });
    }
  } catch (error) {
    console.error("Error in POST request:", error);
    return NextResponse.json({
      message: "Error occurred",
      error: error,
    });
  }
}


