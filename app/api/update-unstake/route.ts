import { NextResponse } from "next/server";
import prisma from '@/app/db';

export async function POST(request: Request) {
  try {
    const { unstakeId, signature, status } = await request.json();

    if (!unstakeId || !signature || !status) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const updatedStake = await prisma.stake.update({
      where: { id: unstakeId },
      data: {
        signature,
        status
      }
    });

    return NextResponse.json({
      message: "Stake record updated",
      stake: updatedStake
    });

  } catch (error) {
    console.error("Update stake error:", error);
    return NextResponse.json({ error: "Failed to update stake record" }, { status: 500 });
  }
}