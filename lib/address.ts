export const PUBLIC_KEY = process.env.PUBLIC_KEY!;
export const PRIVATE_KEY = process.env.PRIVATE_KEY!;
export const TOKEN_MINT_ADDRESS = process.env.TOKEN_MINT_ADDRESS!;

export function convertToTokenDecimalUnit(amount: number){
    const res = amount*LAMPORTS_PER_SOL;
    console.log(res);
    return res;
}