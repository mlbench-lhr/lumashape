import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from "@/utils/dbConnect";
import Tool from "@/lib/models/Tool";

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
            paperType,
            brand,
            toolType,
            description,
            purchaseLink,
            backgroundImg
        } = body;

        // Validate required fields
        if (!toolId) {
            return NextResponse.json(
                { error: 'Tool ID is required' },
                { status: 400 }
            );
        }

        if (!paperType || !brand || !toolType) {
            return NextResponse.json(
                { error: 'Paper type, brand, and tool type are required' },
                { status: 400 }
            );
        }

        // Validate URL if provided
        if (purchaseLink && purchaseLink.trim()) {
            const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
            if (!urlRegex.test(purchaseLink)) {
                return NextResponse.json(
                    { error: 'Invalid purchase link URL format' },
                    { status: 400 }
                );
            }
        }

        // Connect to database
        await dbConnect();

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

        // Prepare update data
        const updateData = {
            paperType,
            brand,
            toolType,
            description: description || '',
            purchaseLink: purchaseLink || '',
            backgroundImg: backgroundImg || existingTool.backgroundImg,
            updatedAt: new Date()
        };

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