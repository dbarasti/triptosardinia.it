import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import path from 'path';
import fs from 'fs/promises';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await context.params;
  if (!pathSegments?.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const relativePath = pathSegments.join('/');
  const ext = path.extname(relativePath).toLowerCase();
  const contentType = MIME[ext] ?? 'application/octet-stream';

  const supabase = getSupabaseServer();
  if (supabase) {
    const bucket = pathSegments[0];
    const objectKey = pathSegments.slice(1).join('/');
    const { data, error } = await supabase.storage.from(bucket).download(objectKey);
    if (error || !data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const body = await data.arrayBuffer();
    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  const filePath = path.join(PUBLIC_DIR, relativePath);
  try {
    await fs.access(filePath);
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const body = await fs.readFile(filePath);
  return new NextResponse(body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
