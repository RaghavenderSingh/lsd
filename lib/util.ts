import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_DECIMALS } from "./mint";


export function convertToTokenDecimalUnit(amount: number){
    const res = amount*TOKEN_DECIMALS;
    console.log(res);
    return res;
}