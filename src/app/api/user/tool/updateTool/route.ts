import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from "@/utils/dbConnect";
import Tool from '@/lib/models/Tool';
import User from '@/lib/models/User';

export async function PUT(request: NextRequest) {
    try {
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

        // Parse request body
        const body = await request.json();
        const {
            toolId,
            toolBrand,
            toolType,
            SKUorPartNumber,
            depth,
        } = body;

        // Validate required fields
        if (!toolId) {
            return NextResponse.json(
                { error: 'Tool ID is required' },
                { status: 400 }
            );
        }

        if (!toolBrand || !toolType || !depth) {
            return NextResponse.json(
                { error: 'Brand, tool type, and depth are required' },
                { status: 400 }
            );
        }

        // Prepare update data
        const updateData: any = {
            toolBrand,
            toolType,
            depth,
            updatedAt: new Date()
        };

        if (SKUorPartNumber) {
            updateData.SKUorPartNumber = SKUorPartNumber;
        }


        // Connect to database
        await dbConnect();

        // Reject if user no longer exists (deleted)
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if tool exists and belongs to the user
        const existingTool = await Tool.findOne({
            _id: toolId,
            userEmail: userEmail
        });

        if (!existingTool) {
            return NextResponse.json(
                { error: 'Tool not found or access denied' },
                { status: 404 }
            );
        }

        // Update the tool
        const updatedTool = await Tool.findByIdAndUpdate(
            toolId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedTool) {
            return NextResponse.json(
                { error: 'Failed to update tool' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Tool updated successfully',
            tool: updatedTool
        }, { status: 200 });

    } catch (error) {
        console.error('Error updating tool:', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}