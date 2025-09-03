import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from "@/utils/dbConnect";
import Tool from "@/lib/models/Tool";

export async function GET(request: NextRequest) {
    try {
        // Extract toolId from query parameters
        const { searchParams } = new URL(request.url);
        const toolId = searchParams.get('toolId');

        if (!toolId) {
            return NextResponse.json(
                { error: 'Tool ID is required' },
                { status: 400 }
            );
        }

        // Get authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Authorization token required' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);

        // Verify JWT token
        interface JwtPayload {
            email: string;
            iat?: number;
            exp?: number;
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "your-secret-key"
        ) as JwtPayload;

        const userEmail = decoded.email;


        // Connect to database
        await dbConnect();

        // Find the tool by ID and ensure it belongs to the authenticated user
        const tool = await Tool.findOne({
            _id: toolId,
            userEmail: userEmail
        });

        if (!tool) {
            return NextResponse.json(
                { error: 'Tool not found or access denied' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            tool: tool
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching tool:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}