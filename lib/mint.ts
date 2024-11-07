import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
function base58ToKeypair(base58PrivateKey: string) {
  try {
    console.log("base58toKeypair");
    const privateKeyBuffer = bs58.decode(base58PrivateKey);
      return Keypair.fromSecretKey(privateKeyBuffer);
  } catch (error) {
    throw new Error("Invalid base58 private key.");
  }
}

const connection = new Connection(clusterApiUrl("devnet"));
const mintAddress = new PublicKey(process.env.TOKEN_MINT_ADDRESS!);
const payer = base58ToKeypair(process.env.PRIVATE_KEY!);
const LSD_RATE = 9600000000;
export const TOKEN_DECIMALS = 1000000000; 

export const mintTokens = async (toAddress: string,fromAddress: string, amount: number) => {
   const to = new PublicKey(toAddress);
   const amt = LSD_RATE* (amount/LAMPORTS_PER_SOL);
   const asscociatedAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mintAddress,
    to
   )
   mintTo(connection,payer,mintAddress,asscociatedAccount.address,payer,amt);
}
export const burnTokens = async (fromAddress: string, toAddress: string, amount: number) => {
    console.log("Burning tokens");
}
export const sendNativeTokens = async (fromAddress: string, toAddress: string, amount: number) => {
    console.log("Sending native tokens");
}