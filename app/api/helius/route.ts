import { burnTokens, mintTokens, sendNativeTokens } from "@/lib/mint";
import { convertToTokenDecimalUnit } from "@/lib/util";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { NextRequest, NextResponse } from "next/server";

const connection = new Connection(clusterApiUrl("devnet"));
const PUBLIC_KEY = process.env.PUBLIC_KEY!;
const TOKEN_MINT_ADDRESS = process.env.TOKEN_MINT_ADDRESS!;
export async function POST(request:NextRequest){
   try {
    const body = await request.json();
    console.log(body);
    const description = body.description.split(" ");
    const type = description[3];
    const receiverAccount = description[5];
    let fromAddress, toAddress, amount;
    if(type==="SOL"){
        fromAddress = body.nativeTransfers[0]?.fromUserAccount;
        toAddress = body.nativeTransfers[0]?.toUserAccount;
        amount = body.nativeTransfers[0]?.amount;
        
        if (toAddress !== PUBLIC_KEY) {
          return NextResponse.json(
            { message: "Another event happened" },
            { status: 400 }
          );
        }
      } 
      else if (type === TOKEN_MINT_ADDRESS) {
        fromAddress = body.tokenTransfers[0]?.fromUserAccount;
        toAddress = body.tokenTransfers[0]?.toUserAccount;
        amount = body.tokenTransfers[0]?.tokenAmount;
      } 
      else {
        return NextResponse.json(
          { message: "Invalid token sent" },
          { status: 400 }
        );
      }
      if (type === "SOL") {
        await mintTokens(fromAddress, toAddress, amount);
      } 
      else if (type === TOKEN_MINT_ADDRESS) {
        const tokenAmount = convertToTokenDecimalUnit(amount);
        console.log(tokenAmount);
        await burnTokens(fromAddress, toAddress, tokenAmount);
        await sendNativeTokens(fromAddress, toAddress, tokenAmount);
      }
  
      return NextResponse.json(
        { message: 'Transaction successful' },
        { status: 200 }
      );
  
    } catch (error) {
      console.error('Error processing transaction:', error);
      return NextResponse.json(
        { message: 'Error processing transaction' },
        { status: 500 }
      );
    }
  }