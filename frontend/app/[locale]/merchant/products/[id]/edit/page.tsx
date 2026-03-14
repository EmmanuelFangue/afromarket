'use client';

import { useAuth } from '../../../../../contexts/AuthContext';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, ImagePlus, X, AlertCircle, Loader2 } from 'lucide-react';

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
  const locale = (pathname.split('/')[1] || 'fr') as 'fr' | 'en';
  const productId = params.id as string;

  const [isFetchingProduct, setIsFetchingProduct] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'CAD',
    sku: '',
    isAvailable: true,
  });

  const [existingMedia, setExistingMedia] = useState<MediaItem[]>([]);
  const [mediaToRemove, setMediaToRemove] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/auth/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, locale, pathname]);

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
          throw new Error(err.message || "Erreur lors de l'upload des images.");
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

  if (isFetchingProduct) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800">{fetchError}</p>
              <button
                onClick={() => router.push(`/${locale}/merchant/products`)}
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à mes produits
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/${locale}/merchant/products/${productId}`)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au produit
          </button>
          <h1 className="font-heading text-3xl font-bold text-foreground">Modifier le produit</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Brouillon — les modifications ne seront visibles qu'après publication.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card-dashboard space-y-6" data-testid="edit-product-form">

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1.5">
              Titre du produit <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-default"
              required
              minLength={3}
              maxLength={200}
              data-testid="input-title"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="input-default resize-none"
              required
              minLength={10}
              maxLength={5000}
              data-testid="input-description"
            />
          </div>

          {/* Price + Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-foreground mb-1.5">
                Prix <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="price"
                step="0.01"
                min="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input-default"
                required
                data-testid="input-price"
              />
            </div>
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-foreground mb-1.5">
                Devise
              </label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="input-default"
                data-testid="select-currency"
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
            <label htmlFor="sku" className="block text-sm font-medium text-foreground mb-1.5">
              SKU <span className="text-muted-foreground text-xs">(optionnel)</span>
            </label>
            <input
              type="text"
              id="sku"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="input-default"
              maxLength={100}
              data-testid="input-sku"
            />
          </div>

          {/* Availability toggle */}
          <div className="flex items-center gap-3 p-4 bg-muted/20 border border-border rounded-xl">
            <input
              type="checkbox"
              id="isAvailable"
              checked={formData.isAvailable}
              onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
              className="w-4 h-4 accent-primary"
              data-testid="checkbox-available"
            />
            <label htmlFor="isAvailable" className="text-sm font-medium text-foreground cursor-pointer">
              Produit disponible à la vente
            </label>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Photos du produit <span className="text-red-500">*</span>
              <span className="text-muted-foreground text-xs ml-1">({totalImageCount}/10)</span>
            </label>

            <div className="space-y-4">
              {/* Existing images */}
              {visibleExistingMedia.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Photos actuelles</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {visibleExistingMedia.map((media, index) => (
                      <div key={media.id} className="relative group rounded-xl overflow-hidden aspect-square border border-border">
                        <img
                          src={media.url}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExisting(media.id)}
                          disabled={isSubmitting}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:cursor-not-allowed"
                          aria-label="Supprimer cette photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New images to upload */}
              {newImagePreviews.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Nouvelles photos</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {newImagePreviews.map((preview, index) => (
                      <div key={index} className="relative group rounded-xl overflow-hidden aspect-square border-2 border-primary/40">
                        <img
                          src={preview}
                          alt={`Nouvelle photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNew(index)}
                          disabled={isSubmitting}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:cursor-not-allowed"
                          aria-label="Annuler l'ajout"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-1.5 left-1.5 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-md font-medium">
                          Nouvelle
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add more images */}
              {totalImageCount < 10 && (
                <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-2xl bg-muted/20 transition-colors ${
                  isSubmitting
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer hover:bg-primary/5 hover:border-primary/40'
                }`}>
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <ImagePlus className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-primary">Ajouter des photos</span> (PNG, JPG, WEBP — max. 5MB)
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
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="submit-edit"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/${locale}/merchant/products/${productId}`)}
              disabled={isSubmitting}
              className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="cancel-btn"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
