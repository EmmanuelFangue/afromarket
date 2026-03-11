'use client';

import { useAuth } from '../../../../../contexts/AuthContext';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface MediaItem {
  id: string;
  url: string;
  type: number;
  orderIndex: number;
  fileName: string | null;
  fileSizeBytes: number | null;
}

interface ProductData {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  sku: string | null;
  isAvailable: boolean;
  status: number; // 0=Draft, 1=Active, 2=Suspended
  media: MediaItem[];
}

export default function EditProductPage() {
  const { isAuthenticated, isLoading, getAccessToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = pathname.split('/')[1] || 'fr';
  const productId = params.id as string;

  // Product loading
  const [isFetchingProduct, setIsFetchingProduct] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form state (pre-filled after product loads)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'CAD',
    sku: '',
    isAvailable: true,
  });

  // Existing media management
  const [existingMedia, setExistingMedia] = useState<MediaItem[]>([]);
  const [mediaToRemove, setMediaToRemove] = useState<string[]>([]);

  // New image uploads
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/auth/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, locale, pathname]);

  // Fetch product on mount
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    let cancelled = false;

    const fetchProduct = async () => {
      try {
        setIsFetchingProduct(true);
        const token = await getAccessToken();
        if (!token) {
          setFetchError('Session expirée. Veuillez vous reconnecter.');
          return;
        }

        const response = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.status === 404) {
          if (!cancelled) setFetchError('Produit introuvable.');
          return;
        }
        if (response.status === 401 || response.status === 403) {
          if (!cancelled) setFetchError('Session expirée. Veuillez vous reconnecter.');
          return;
        }
        if (!response.ok) throw new Error('Impossible de charger le produit.');

        const data: ProductData = await response.json();

        if (data.status !== 0) {
          if (!cancelled) setFetchError('Seuls les produits en brouillon peuvent être modifiés.');
          return;
        }

        if (!cancelled) {
          setFormData({
            title: data.title,
            description: data.description,
            price: data.price.toString(),
            currency: data.currency,
            sku: data.sku ?? '',
            isAvailable: data.isAvailable,
          });
          setExistingMedia(data.media);
        }
      } catch (err: any) {
        if (!cancelled) setFetchError(err.message || 'Erreur lors du chargement.');
      } finally {
        if (!cancelled) setIsFetchingProduct(false);
      }
    };

    fetchProduct();
    return () => { cancelled = true; };
  }, [isAuthenticated, isLoading, productId, getAccessToken]);

  if (isLoading || !isAuthenticated) return null;

  const visibleExistingMedia = existingMedia.filter(m => !mediaToRemove.includes(m.id));
  const totalImageCount = visibleExistingMedia.length + newImages.length;

  const handleRemoveExisting = (mediaId: string) => {
    setMediaToRemove(prev => [...prev, mediaId]);
  };

  const handleAddNewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSubmitting) return;
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    if (totalImageCount + newFiles.length > 10) {
      alert(`Maximum 10 photos. Vous pouvez en ajouter ${10 - totalImageCount}.`);
      return;
    }

    setNewImages(prev => [...prev, ...newFiles]);

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveNew = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (visibleExistingMedia.length + newImages.length === 0) {
      setError('Le produit doit avoir au moins une photo.');
      setIsSubmitting(false);
      return;
    }

    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Non authentifié');

      // Step 1: Upload new images if any
      let newMediaToAdd: Array<{
        url: string; type: number; fileName: string | null;
        altText: null; fileSizeBytes: number | null;
      }> = [];

      if (newImages.length > 0) {
        const formDataImages = new FormData();
        newImages.forEach(img => formDataImages.append('images', img));

        const uploadResponse = await fetch(`${BACKEND_URL}/api/products/upload-images`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formDataImages,
        });

        if (!uploadResponse.ok) {
          const err = await uploadResponse.json();
          throw new Error(err.message || 'Erreur lors de l\'upload des images.');
        }

        const { imageUrls } = await uploadResponse.json();
        newMediaToAdd = imageUrls.map((url: string, index: number) => ({
          url,
          type: 0,
          fileName: newImages[index]?.name ?? null,
          altText: null,
          fileSizeBytes: newImages[index]?.size ?? null,
        }));
      }

      // Step 2: Submit update
      const updatePayload: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        currency: formData.currency,
        isAvailable: formData.isAvailable,
      };

      if (formData.sku) updatePayload.sku = formData.sku;
      if (mediaToRemove.length > 0) updatePayload.mediaToRemove = mediaToRemove;
      if (newMediaToAdd.length > 0) updatePayload.mediaToAdd = newMediaToAdd;

      const updateResponse = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!updateResponse.ok) {
        const err = await updateResponse.json();
        throw new Error(err.error || err.message || 'Erreur lors de la mise à jour.');
      }

      router.push(`/${locale}/merchant/products/${productId}`);
    } catch (err: any) {
      console.error('[EditProduct] Error:', err);
      setError(err.message || 'Une erreur est survenue.');
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isFetchingProduct) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Chargement du produit...</p>
      </div>
    );
  }

  // Error state (not found, not Draft, etc.)
  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{fetchError}</p>
            <button
              onClick={() => router.push(`/${locale}/merchant/products`)}
              className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← Retour à mes produits
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push(`/${locale}/merchant/products/${productId}`)}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4 block"
          >
            ← Retour au produit
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Modifier le produit
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Brouillon — les modifications ne seront visibles qu'après publication.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre du produit <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
              minLength={3}
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
              minLength={10}
              maxLength={5000}
            />
          </div>

          {/* Price + Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="price"
                step="0.01"
                min="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Devise
              </label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="CAD">CAD</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="XOF">XOF</option>
                <option value="XAF">XAF</option>
              </select>
            </div>
          </div>

          {/* SKU */}
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              SKU <span className="text-gray-400 text-xs">(optionnel)</span>
            </label>
            <input
              type="text"
              id="sku"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              maxLength={100}
            />
          </div>

          {/* Availability toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isAvailable"
              checked={formData.isAvailable}
              onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Produit disponible à la vente
            </label>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Photos du produit <span className="text-red-500">*</span>
              <span className="text-gray-400 text-xs ml-1">({totalImageCount}/10)</span>
            </label>

            <div className="space-y-4">
              {/* Existing images */}
              {visibleExistingMedia.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Photos actuelles</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {visibleExistingMedia.map((media, index) => (
                      <div key={media.id} className="relative group">
                        <img
                          src={media.url}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExisting(media.id)}
                          disabled={isSubmitting}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Supprimer cette photo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New images to upload */}
              {newImagePreviews.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Nouvelles photos</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {newImagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Nouvelle photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-blue-300 dark:border-blue-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNew(index)}
                          disabled={isSubmitting}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Annuler l'ajout"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                          Nouvelle
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add more images */}
              {totalImageCount < 10 && (
                <div className="flex items-center justify-center w-full">
                  <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg bg-gray-50 dark:bg-gray-700 transition-colors ${
                    isSubmitting
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}>
                    <div className="flex flex-col items-center justify-center py-3">
                      <svg className="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 20 16" xmlns="http://www.w3.org/2000/svg">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Ajouter des photos</span> (PNG, JPG, WEBP — max. 5MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      multiple
                      disabled={isSubmitting}
                      onChange={handleAddNewImages}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/${locale}/merchant/products/${productId}`)}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
