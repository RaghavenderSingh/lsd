import { 
    createBurnCheckedInstruction, 
    getAccount, 
    getMint, 
    getOrCreateAssociatedTokenAccount, 
    mintTo 
  } from "@solana/spl-token";
  import { 
    Connection, 
    Keypair, 
    PublicKey, 
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL, 
    TransactionInstruction
  } from "@solana/web3.js";
  import bs58 from 'bs58';
  
  const mint = new PublicKey(process.env.NEXT_PUBLIC_TOKEN_MINT_ADDRESS!);
  const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com", "confirmed");
  const private_key = process.env.NEXT_PUBLIC_PRIVATE_KEY!;
  const wallet = bs58.decode(private_key);
  const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));
  const token_decimals = 6;
  export const burnTokens = async (
    fromAddress: string, 
    toAddress: string, 
    amount: number,
    returnInstruction = false
  ): Promise<TransactionInstruction | string> => {
    console.log("Burning tokens");
    try {
      const fromPubkey = new PublicKey(fromAddress);
      const toPubkey = new PublicKey(toAddress);
      
      const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        mint,
        fromPubkey
      );
  
      const burnInstruction = createBurnCheckedInstruction(
        fromTokenAccount.address,
        mint,
        fromPubkey,
        amount * LAMPORTS_PER_SOL,
        token_decimals
      );
  
      if (returnInstruction) {
        return burnInstruction;
      }
  
      const transaction = new Transaction();
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;
      transaction.add(burnInstruction);
  
      const signature = await connection.sendTransaction(transaction, [keypair]);
      await connection.confirmTransaction(signature);
  
      console.log(`Success! Burned tokens at ${signature}`);
      return signature;
    } catch (error) {
      console.error("Burning Error:", error);
      throw error;
    }
  }
  export const sendNativeTokens = async (fromAddress: string, toAddress: string, amount: number) => {
    console.log("Sending native tokens");
    try {
      const toPubkey = new PublicKey(toAddress);
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey,
        lamports: amount * LAMPORTS_PER_SOL,
      });
      const transaction = new Transaction().add(transferInstruction);
      const signature = await connection.sendTransaction(transaction, [keypair]);
      await connection.confirmTransaction(signature);
  
      console.log(`Success! Transferred SOL at ${signature}`);
      return signature;
    } catch (error) {
      console.error("Transfer Error:", error);
      throw error;
    }
  }