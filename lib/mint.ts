import { createBurnCheckedInstruction, getAccount, getMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { Commitment, Connection, Keypair, PublicKey, TransactionMessage, VersionedTransaction, TransactionInstruction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

import bs58 from 'bs58';

const mint = new PublicKey(process.env.NEXT_PUBLIC_TOKEN_MINT_ADDRESS!);
const connection = new Connection("https://api.devnet.solana.com/", "confirmed");
const private_key =process.env.NEXT_PUBLIC_PRIVATE_KEY!;
const wallet = bs58.decode(private_key as string);
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));
const token_decimals = 6;


export const mintTokens = async (fromAddress: string, amount: number) => {
  const mintto = new PublicKey(fromAddress);
  console.log("Minting tokens");
  try {
      const ata = await getOrCreateAssociatedTokenAccount(
          connection,
          keypair,
          mint,
          mintto,
      );

      const mintTx = await mintTo(
          connection,
          keypair,
          mint,
          ata.address,
          keypair.publicKey,
          LAMPORTS_PER_SOL * amount,
      );
      console.log(`Success! Minted transaction at ${mintTx}`);
      console.log(`Success! Minted ${amount} tokens to ${ata.address.toBase58()}`);
  } catch (error) {
      console.error("Minting Error:", error);
  }
}


