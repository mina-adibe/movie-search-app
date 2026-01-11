'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Film } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MovieListItem } from '@/types/movie';

interface MovieCardProps {
  movie: MovieListItem;
  className?: string;
}

export function MovieCard({ movie, className }: MovieCardProps) {
  return (
    <Link href={`/movie/${movie.id}`}>
      <Card
        className={cn(
          'group h-full cursor-pointer overflow-hidden p-0 transition-all hover:shadow-lg hover:ring-2 hover:ring-primary/20',
          className
        )}
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
          {movie.posterUrl ? (
            <Image
              src={movie.posterUrl}
              alt={`${movie.title} poster`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Film className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {movie.rating && movie.rating !== 'NR' && (
            <Badge
              variant="secondary"
              className="absolute right-2 top-2 bg-background/80 backdrop-blur-sm"
            >
              {movie.rating}
            </Badge>
          )}
        </div>
        <div className="p-4">
          <h3 className="line-clamp-2 text-sm font-medium leading-tight">{movie.title}</h3>
        </div>
      </Card>
    </Link>
  );
}
