import { NextRequest, NextResponse } from 'next/server';
import { searchMovies } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || undefined;
    const genre = searchParams.get('genre') || undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 25;

    const result = await searchMovies({ search, genre, page, limit });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching movies:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Failed to fetch movies' }, { status: 500 });
  }
}
