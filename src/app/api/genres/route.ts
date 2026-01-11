import { NextResponse } from 'next/server';
import { getGenres } from '@/lib/api';

// Cache genres for 24 hours since they rarely change
export const revalidate = 86400;

export async function GET() {
  try {
    const genres = await getGenres();

    return NextResponse.json({ genres });
  } catch (error) {
    console.error('Error fetching genres:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Failed to fetch genres' }, { status: 500 });
  }
}
