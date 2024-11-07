
import { NextRequest, NextResponse } from "next/server";

// Validate environment variables

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log(body);
    // Validate request body
    if (!body.description || typeof body.description !== "string") {
      return NextResponse.json(
        { message: "Invalid request format" },
        { status: 400 }
      );
    }

    const description = body.description.split(" ");
    if (description.length < 6) {
      return NextResponse.json(
        { message: "Invalid description format" },
        { status: 400 }
      );
    }

    const type = description[3];
    const receiverAccount = description[5];

    // Validate transaction type
  
    // Process transaction based on type
   
  } catch (error) {
    return NextResponse.json({ message: error }, { status: 500 });
  }
}