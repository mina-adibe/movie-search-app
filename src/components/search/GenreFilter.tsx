'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGenres } from '@/lib/hooks/useGenres';
import { cn } from '@/lib/utils';

interface GenreFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function GenreFilter({ value, onChange, className }: GenreFilterProps) {
  const { data: genres, isLoading } = useGenres();

  return (
    <Select value={value} onValueChange={onChange} disabled={isLoading}>
      <SelectTrigger className={cn('w-[180px]', className)}>
        <SelectValue placeholder={isLoading ? 'Loading...' : 'All Genres'} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Genres</SelectItem>
        {genres?.map((genre) => (
          <SelectItem key={genre.id} value={genre.id}>
            {genre.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
