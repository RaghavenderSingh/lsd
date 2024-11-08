import { Connection, Keypair, PublicKey} from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, getAccount } from "@solana/spl-token";
import bs58 from 'bs58';

const mint = new PublicKey(process.env.NEXT_PUBLIC_TOKEN_MINT_ADDRESS!);
const connection = new Connection("https://api.devnet.solana.com/", "confirmed");
const private_key = process.env.NEXT_PUBLIC_PRIVATE_KEY!;
const wallet = bs58.decode(private_key);
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

export async function getStakedTokenBalance(userAddress: PublicKey): Promise<number> {
  try {
    // Fetch the user's staked token account
    const stakedTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      new PublicKey(userAddress)
    );

    // Check the user's staked token balance
    const userTokenAccount = await getAccount(connection, stakedTokenAccount.address);
    const stakedTokens = Number(userTokenAccount.amount) / Math.pow(10, 6);
    console.log(`User has ${stakedTokens} tokens staked.`);
    return stakedTokens;
  } catch (error) {
    console.error("Error fetching staked token balance:", error);
    return 0;
  }
}