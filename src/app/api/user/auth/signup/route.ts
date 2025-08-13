import dbConnect from "@/utils/dbConnect";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const {email, password, username} = await req.json();

    if (!email || !password || !username) {
        return NextResponse.json(
            { error: 'All fields (email, password, username) are required' },
            { status: 400 }
        );
    }

        try {
        // Simulate a dummy response for testing without connecting to DB
        const dummyResponse = {
            message: 'User successfully created (dummy response)',
            data: { email, username },
        };

        // Simulate a delay for response (optional, to mimic DB operation)
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Return dummy response
        return NextResponse.json(dummyResponse, { status: 200 });

    } catch (error) {
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        );
    }
}