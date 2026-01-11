import { Film } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t py-6">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Film className="h-4 w-4" />
          <span>Buffalo Movie Search</span>
        </div>
        <p className="text-sm text-muted-foreground">&copy; {currentYear} All rights reserved.</p>
      </div>
    </footer>
  );
}
