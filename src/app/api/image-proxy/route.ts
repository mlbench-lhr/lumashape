import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return new NextResponse('Missing url', { status: 400 });
  }

  const upstream = await fetch(url, { cache: 'no-store' });
  const contentType = upstream.headers.get('content-type') || 'image/jpeg';
  const buf = await upstream.arrayBuffer();

  return new NextResponse(buf, {
    status: upstream.status,
    headers: {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}