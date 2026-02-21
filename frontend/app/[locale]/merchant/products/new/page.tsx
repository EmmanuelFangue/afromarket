'use client';

import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NewProductPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'fr';

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/auth/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, locale, pathname]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement product creation
    console.log('Creating product:', formData);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            ← Retour
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Ajouter un produit
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom du produit
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Prix (€)
            </label>
            <input
              type="number"
              id="price"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Catégorie
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Sélectionner une catégorie</option>
              <option value="electronics">Électronique</option>
              <option value="clothing">Vêtements</option>
              <option value="food">Alimentation</option>
              <option value="other">Autre</option>
            </select>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Créer le produit
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
