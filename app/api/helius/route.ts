
import { NextRequest, NextResponse } from "next/server";



export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log(body);
   
   
  } catch (error) {
    return NextResponse.json({ message: error }, { status: 500 });
  }
}