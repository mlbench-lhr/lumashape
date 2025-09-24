// /pages/api/layouts/addToWorkspace.ts or /app/api/layouts/addToWorkspace/route.ts (depending on your Next.js version)
import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Layout from "../../../../lib/models/layout";
import jwt from 'jsonwebtoken';

interface JwtPayload {
    email: string;
    [key: string]: any;
}

export async function POST(request: Request) {
    try {
        await dbConnect();

        // Get auth token from headers
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No valid token provided' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        let decoded: JwtPayload;

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        } catch (error) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const userEmail = decoded.email;
        const { layoutId } = await request.json();

        if (!layoutId) {
            return NextResponse.json({ error: 'Layout ID is required' }, { status: 400 });
        }

        // Find the original layout
        const originalLayout = await Layout.findById(layoutId);
        if (!originalLayout) {
            return NextResponse.json({ error: 'Layout not found' }, { status: 404 });
        }

        // Check if user already has this layout in their workspace
        const existingUserLayout = await Layout.findOne({
            userEmail,
            originalLayoutId: layoutId
        });

        if (existingUserLayout) {
            return NextResponse.json({
                error: 'Layout already exists in your workspace',
                layout: existingUserLayout
            }, { status: 409 });
        }

        // Check if user has already downloaded this layout
        const hasAlreadyDownloaded = originalLayout.downloadedByUsers.includes(userEmail);

        // Create a new layout for the user's workspace
        const newLayout = new Layout({
            originalLayoutId: originalLayout._id,
            userEmail,
            name: originalLayout.name,
            brand: originalLayout.brand,
            canvas: originalLayout.canvas,
            tools: originalLayout.tools,
            stats: {
                totalTools: originalLayout.stats.totalTools,
                validLayout: originalLayout.stats.validLayout,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            snapshotUrl: originalLayout.snapshotUrl,
            metadata: originalLayout.metadata,
            published: false,
            downloads: 0,
            publishedDate: null,
            downloadedByUsers: []
        });

        // Save the new layout
        await newLayout.save();

        // Update the original layout's download count and downloadedByUsers if not already downloaded
        if (!hasAlreadyDownloaded) {
            await Layout.findByIdAndUpdate(layoutId, {
                $inc: { downloads: 1 },
                $addToSet: { downloadedByUsers: userEmail }
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Layout added to workspace successfully',
            layout: newLayout
        });

    } catch (error) {
        console.error('Error adding layout to workspace:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}