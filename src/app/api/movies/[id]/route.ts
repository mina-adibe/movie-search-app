import { NextRequest, NextResponse } from 'next/server';
import { getMovieById } from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Movie ID is required' }, { status: 400 });
    }

    const movie = await getMovieById(id);

    return NextResponse.json(movie);
  } catch (error) {
    console.error('Error fetching movie:', error);

    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Failed to fetch movie' }, { status: 500 });
  }
}
