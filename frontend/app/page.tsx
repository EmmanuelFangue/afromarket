import SearchComponent from "./components/SearchComponent";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-black">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AfroMarket
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Annuaire géolocalisé avec recherche par mots-clés
          </p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <SearchComponent />
      </main>
    </div>
  );
}
