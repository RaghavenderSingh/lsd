import prisma from '@/app/db';
import { NextResponse } from 'next/server';


export async function POST(request: Request) {
  try {
    const { walletAddress, recipientAddress, amount, signature } = await request.json();
    
    await prisma.stake.create({
      data: {
        walletAddress,
        recipientAddress,
        amount,
        signature,
        status: 'pending',
        createdAt: new Date(),
      },
    });
  
    return NextResponse.json({ message: 'Stake transaction saved' }, { status: 200 });
  } catch (error: any) {
    console.error('Error saving stake transaction:', error.message || error, error.stack);
    return NextResponse.json({ error: 'Error saving stake transaction' }, { status: 500 });
  }
}