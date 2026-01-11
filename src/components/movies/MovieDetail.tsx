'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Film, Clock, Star, Calendar, Users, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Movie } from '@/types/movie';

interface MovieDetailProps {
  movie: Movie;
  favoriteButton?: React.ReactNode;
}

export function MovieDetail({ movie, favoriteButton }: MovieDetailProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-[300px_1fr]">
        {/* Poster */}
        <div className="relative aspect-[2/3] w-full max-w-[300px] overflow-hidden rounded-lg bg-muted">
          {movie.posterUrl ? (
            <Image
              src={movie.posterUrl}
              alt={`${movie.title} poster`}
              fill
              sizes="300px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Film className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold">{movie.title}</h1>
              {favoriteButton}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {movie.rating && movie.rating !== 'NR' && (
                <Badge variant="outline">{movie.rating}</Badge>
              )}
              {movie.releaseYear > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{movie.releaseYear}</span>
                </div>
              )}
              {movie.durationDisplay && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{movie.durationDisplay}</span>
                </div>
              )}
              {movie.ratingValue > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{movie.ratingDisplay}</span>
                </div>
              )}
            </div>
          </div>

          {movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <Badge key={genre.id} variant="secondary">
                  {genre.title}
                </Badge>
              ))}
            </div>
          )}

          {movie.summary && (
            <div>
              <h2 className="mb-2 text-lg font-semibold">Summary</h2>
              <p className="text-muted-foreground leading-relaxed">{movie.summary}</p>
            </div>
          )}

          {movie.directors.length > 0 && (
            <div>
              <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                <Video className="h-5 w-5" />
                {movie.directors.length === 1 ? 'Director' : 'Directors'}
              </h2>
              <p className="text-muted-foreground">{movie.directors.join(', ')}</p>
            </div>
          )}

          {movie.mainActors.length > 0 && (
            <div>
              <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                <Users className="h-5 w-5" />
                Cast
              </h2>
              <p className="text-muted-foreground">{movie.mainActors.join(', ')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MovieDetailSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-9 w-32" />

      <div className="grid gap-8 md:grid-cols-[300px_1fr]">
        <Skeleton className="aspect-[2/3] w-full max-w-[300px] rounded-lg" />

        <div className="space-y-6">
          <div>
            <Skeleton className="h-9 w-3/4" />
            <div className="mt-4 flex gap-3">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>

          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>

          <div>
            <Skeleton className="mb-2 h-6 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </div>

          <div>
            <Skeleton className="mb-2 h-6 w-24" />
            <Skeleton className="h-4 w-48" />
          </div>

          <div>
            <Skeleton className="mb-2 h-6 w-16" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>
    </div>
  );
}
