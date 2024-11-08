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

export const burnTokens = async (fromAddress: string, amount: number) => {
    const burnAccount = new PublicKey(fromAddress);
    console.log("Burning tokens");
    try {
        const ata = await getOrCreateAssociatedTokenAccount(
            connection,
            keypair,
            mint,
            burnAccount,
        );

        // Convert the amount to the token's smallest unit
        const tokenDecimals = (await getMint(connection, mint)).decimals;
        const tokenAmount = Math.floor(amount * Math.pow(10, tokenDecimals));

        // Check if the user has enough tokens to burn
        const userTokenAccount = await getAccount(connection, ata.address);
        if (userTokenAccount.amount < BigInt(tokenAmount)) {
            throw new Error("Insufficient funds to burn tokens");
        }

        const burnTx = createBurnCheckedInstruction(
            ata.address,       // The token account to burn from
            mint,               // The mint address
            keypair.publicKey,  // Owner of the token account
            BigInt(tokenAmount),
            tokenDecimals,
        );
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        const messageV0 = new TransactionMessage({
            payerKey: keypair.publicKey,
            recentBlockhash: blockhash,
            instructions: [burnTx],
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);
        transaction.sign([keypair]);

        const txId = await connection.sendTransaction(transaction, { skipPreflight: false, maxRetries: 5 });
        console.log(`Success! Burn transaction ID: ${txId}`);
    }
    catch (error: unknown) {
        console.error("Burning Error:", error);
        if (error instanceof Error && error.message === "Insufficient funds to burn tokens") {
            console.log("User does not have enough tokens to burn.");
        } else {
            console.error("Unexpected error occurred:", error);
        }
    }
};

export const sendNativeTokens = async (fromAddress: string, toAddress: string, amount: number) => {
    const recipientPubKey = new PublicKey(toAddress);
    console.log("Sending native tokens");

    try {
        const transaction = new VersionedTransaction(new TransactionMessage({
            payerKey: keypair.publicKey,
            recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
            instructions: [
                SystemProgram.transfer({
                    fromPubkey: keypair.publicKey,
                    toPubkey: recipientPubKey,
                    lamports: BigInt(amount) * BigInt(1_000_000_000) // Convert SOL to lamports
                })
            ]
        }).compileToV0Message());

        transaction.sign([keypair]);
        const txId = await connection.sendTransaction(transaction, { skipPreflight: false, maxRetries: 5 });
        console.log(`Success! Native transfer transaction ID: ${txId}`);
    } catch (error) {
        console.error("Transfer Error:", error);
    }
}

