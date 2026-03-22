import { Suspense } from 'react';
import SearchComponent from '../../components/SearchComponent';

function SearchFallback() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center py-12 text-muted-foreground">Chargement...</div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<SearchFallback />}>
        <SearchComponent />
      </Suspense>
    </main>
  );
}
