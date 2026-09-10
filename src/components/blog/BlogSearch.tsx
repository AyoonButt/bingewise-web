import { Search } from "lucide-react";

export function BlogSearch() {
  return (
    <form className="relative" action="/blog" method="get">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="search"
        name="q"
        placeholder="Search articles..."
        className="input-base pl-10"
      />
    </form>
  );
}