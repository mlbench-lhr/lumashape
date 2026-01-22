import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/utils/dbConnect';
import User from '@/lib/models/User';

// Define types for our request data
interface PositionInches {
    x: number;
    y: number;
}

interface Tool {
    tool_id: string;
    name: string;
    brand: string;
    dxf_link: string;
    position_inches: PositionInches & { z?: number };
    rotation_degrees: number;
    height_diagonal_inches: number;
    depth_inches?: number;
    flip_horizontal: boolean;
    flip_vertical: boolean;
    opacity: number;
    smooth: number;
    // Allow custom shapes forwarded by client (including text)
    is_custom_shape?: boolean;
    shape_type?: "rectangle" | "circle" | "polygon" | "fingercut" | "text";
    shape_data?: unknown;
    cut_depth_inches?: number;
}

interface CanvasInformation {
    width_inches: number;
    height_inches: number;
    thickness_inches: number;
    has_overlaps: boolean;
}

interface LayoutMetadata {
    layout_name: string;
    brand: string;
    container_type: string;
}

interface RequestData {
    canvas_information: CanvasInformation;
    layout_metadata: LayoutMetadata;
    tools: Tool[];
    output_filename: string;
    upload_to_s3: boolean;
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const auth = request.headers.get('Authorization');
        if (!auth || !auth.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = auth.split(' ')[1];
        let decoded: { email: string };
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { email: string };
        } catch {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const user = await User.findOne({ email: decoded.email })
          .select('email subscriptionPlan subscriptionStatus dxfDownloadsUsed')
          .lean();
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const url = new URL(request.url);
        const purpose = String(
            request.headers.get('x-dxf-purpose') ||
            url.searchParams.get('purpose') ||
            'download'
        ).toLowerCase();
        const isMetered = purpose !== 'cart' && purpose !== 'internal';

        const limit = 10;
        const used = typeof (user as any).dxfDownloadsUsed === 'number' ? (user as any).dxfDownloadsUsed : 0;
        const isPro = (user as any).subscriptionStatus === 'active' && (user as any).subscriptionPlan === 'Pro';
        if (isMetered && !isPro && used >= limit) {
            return NextResponse.json({ error: 'DXF downloads are locked. Upgrade to Pro to continue.', dxf_usage: { used, remaining: 0, limit } }, { status: 402 });
        }

        const requestData = await request.json() as RequestData;
        if (requestData.tools && Array.isArray(requestData.tools)) {
            requestData.tools = requestData.tools.map(tool => {
                if (tool.position_inches && typeof tool.position_inches === 'object') {
                    const x = typeof tool.position_inches.x === 'number' ? tool.position_inches.x : parseFloat(String(tool.position_inches.x)) || 0;
                    const y = typeof tool.position_inches.y === 'number' ? tool.position_inches.y : parseFloat(String(tool.position_inches.y)) || 0;
                    tool.position_inches = { x, y };
                }
                if (typeof tool.height_diagonal_inches !== 'number') {
                    tool.height_diagonal_inches = parseFloat(String(tool.height_diagonal_inches)) || 5.0;
                }
                if (tool.dxf_link) tool.dxf_link = tool.dxf_link.trim();
                return tool;
            });
        }

        const response = await fetch('https://lumashape-canvas-dxf-generation.hf.space/api/compose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: 'Failed to generate DXF file', details: errorText }, { status: response.status });
        }

        const data = await response.json();

        if (isMetered && !isPro) {
            const newUsed = Math.min(used + 1, limit);
            await User.findOneAndUpdate(
              { email: decoded.email, dxfDownloadsUsed: { $lt: limit } },
              { $inc: { dxfDownloadsUsed: 1 } }
            );
            return NextResponse.json({ ...data, dxf_usage: { used: newUsed, remaining: Math.max(limit - newUsed, 0), limit } });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
