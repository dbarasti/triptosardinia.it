import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const interests = await db.getAllInterests();
  const experiences = await db.getAllExperiencesForAdmin();
  const expMap = new Map(experiences.map((e) => [e.id, e]));

  const header = [
    'id',
    'experience_id',
    'experience_title_en',
    'party_size',
    'dates_of_interest',
    'created_at',
    'session_id',
    'email',
    'name',
  ].join(',');

  const escape = (v: string | number | undefined | null): string => {
    if (v == null) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const rows = interests.map((i) => {
    const exp = expMap.get(i.experience_id);
    return [
      i.id,
      i.experience_id,
      exp ? exp.title_en : '',
      i.party_size,
      (i.dates_of_interest || []).join(';'),
      i.created_at,
      i.session_id ?? '',
      i.email ?? '',
      i.name ?? '',
    ]
      .map(escape)
      .join(',');
  });

  const csv = [header, ...rows].join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="coast-experience-leads.csv"',
    },
  });
}
