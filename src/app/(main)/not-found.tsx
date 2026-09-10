import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-6xl font-bold">404</h1>
        <h2 className="text-2xl font-bold">Page Not Found</h2>
        <p className="text-muted-foreground">
          The page you are looking for does not exist or has been moved.
          Try searching for a movie, show, or explore the BingeWise platform.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link href="/" className="btn-primary h-12 px-8 text-sm font-semibold">
            <Home className="h-4 w-4 inline mr-2" />
            Go Home
          </Link>
          <Link
            href="/search"
            className="btn-outline h-12 px-8 text-sm font-semibold"
          >
            <Search className="h-4 w-4 inline mr-2" />
            Search
          </Link>
        </div>
      </div>
    </div>
  );
}