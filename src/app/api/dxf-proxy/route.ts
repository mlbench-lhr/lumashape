import { NextRequest, NextResponse } from 'next/server';

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
    position_inches: PositionInches;
    rotation_degrees: number;
    height_diagonal_inches: number;
    thickness_inches: number;
    flip_horizontal: boolean;
    flip_vertical: boolean;
    opacity: number;
    smooth: number;
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
    console.log("DXF Proxy API called");

    try {
        const requestData = await request.json() as RequestData;
        
        // Extract canvas dimensions for position validation
        const canvasWidth = requestData.canvas_information.width_inches;
        const canvasHeight = requestData.canvas_information.height_inches;

        // Fix for position_inches objects
        if (requestData.tools && Array.isArray(requestData.tools)) {
            requestData.tools = requestData.tools.map(tool => {
                // Ensure position_inches is properly formatted
                if (tool.position_inches && typeof tool.position_inches === 'object') {
                    // Make sure x and y values are numbers
                    const x = typeof tool.position_inches.x === 'number' ? 
                        tool.position_inches.x : parseFloat(String(tool.position_inches.x)) || 0;
                    const y = typeof tool.position_inches.y === 'number' ? 
                        tool.position_inches.y : parseFloat(String(tool.position_inches.y)) || 0;
                    
                    // Don't clamp positions - allow tools to be positioned as they appear visually
                    tool.position_inches = { x, y };
                }

                // Ensure height_diagonal_inches is a number
                if (typeof tool.height_diagonal_inches !== 'number') {
                    tool.height_diagonal_inches = parseFloat(String(tool.height_diagonal_inches)) || 5.0;
                }

                // Remove any extra spaces in dxf_link
                if (tool.dxf_link) {
                    tool.dxf_link = tool.dxf_link.trim();
                }
                
                return tool;
            });
        }

        console.log("Processed request data:", JSON.stringify(requestData, null, 2));

        // Forward the request to Hugging Face API
        const response = await fetch(
            "https://lumashape-canvas-dxf-generation.hf.space/api/compose",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error from Hugging Face API:", errorText);
            return NextResponse.json(
                { error: "Failed to generate DXF file", details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log("Response from Hugging Face API:", data);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in DXF proxy:", error);
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        );
    }
}
