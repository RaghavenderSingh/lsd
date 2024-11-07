import { LAMPORTS_PER_SOL } from "@solana/web3.js";



export function convertToTokenDecimalUnit(amount: number){
    const res = amount*LAMPORTS_PER_SOL;
    console.log(res);
    return res;
}