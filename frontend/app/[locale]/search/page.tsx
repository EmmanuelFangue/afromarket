import SearchComponent from '../../components/SearchComponent';

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Rechercher des commerces
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Découvrez les commerces et services africains près de chez vous
          </p>
        </div>

        <SearchComponent />
      </div>
    </div>
  );
}
