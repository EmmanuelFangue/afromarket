'use client';

import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, ImagePlus, X, AlertCircle, Loader2 } from 'lucide-react';

export default function NewProductPage() {
  const { isAuthenticated, isLoading, getAccessToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] || 'fr') as 'fr' | 'en';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'CAD',
    sku: '',
  });

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessError, setBusinessError] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/auth/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, locale, pathname]);

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    const fetchBusiness = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const token = await getAccessToken();
        if (!token) {
          setBusinessError('Session expirée. Veuillez vous reconnecter.');
          return;
        }
        const response = await fetch(`${backendUrl}/api/business/my-businesses`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Impossible de récupérer votre commerce');
        const businesses = await response.json();
        if (!businesses || businesses.length === 0) {
          setBusinessError("Vous devez créer un commerce avant d'ajouter des produits.");
        } else {
          setBusinessId(businesses[0].id);
        }
      } catch (err: any) {
        setBusinessError(err.message || 'Erreur lors du chargement du commerce');
      }
    };

    fetchBusiness();
  }, [isAuthenticated, isLoading, getAccessToken]);

  if (isLoading || !isAuthenticated) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const totalImages = images.length + newFiles.length;

    if (totalImages > 10) {
      alert(`Vous ne pouvez ajouter que ${10 - images.length} photo(s) supplémentaire(s). Maximum 10 photos.`);
      return;
    }

    setImages([...images, ...newFiles]);

    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!businessId) {
      setError("Commerce introuvable. Veuillez créer un commerce d'abord.");
      setIsSubmitting(false);
      return;
    }

    if (images.length === 0) {
      setError('Veuillez ajouter au moins une photo du produit.');
      setIsSubmitting(false);
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = await getAccessToken();
      if (!token) throw new Error('Non authentifié');

      const formDataImages = new FormData();
      images.forEach((image) => formDataImages.append('images', image));

      const uploadResponse = await fetch(`${backendUrl}/api/products/upload-images`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataImages,
      });

      if (!uploadResponse.ok) {
        const err = await uploadResponse.json();
        throw new Error(err.message || "Erreur lors de l'upload des images");
      }

      const { imageUrls } = await uploadResponse.json();

      const productData = {
        businessId,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        currency: formData.currency,
        sku: formData.sku || null,
        isAvailable: true,
        media: imageUrls.map((url: string, index: number) => ({
          url,
          type: 0,
          fileName: images[index]?.name ?? null,
          altText: null,
          fileSizeBytes: images[index]?.size ?? null,
        })),
      };

      const createResponse = await fetch(`${backendUrl}/api/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!createResponse.ok) {
        const err = await createResponse.json();
        throw new Error(err.message || err.error || 'Erreur lors de la création du produit');
      }

      router.push(`/${locale}/merchant/products`);
    } catch (err: any) {
      console.error('[NewProduct] Error:', err);
      setError(err.message || 'Une erreur est survenue');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <h1 className="font-heading text-3xl font-bold text-foreground">Ajouter un produit</h1>
        </div>

        {/* Business error banner */}
        {businessError && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 text-sm">{businessError}</p>
              <button
                onClick={() => router.push(`/${locale}/merchant/dashboard`)}
                className="mt-2 text-sm text-primary hover:underline font-medium"
              >
                Créer un commerce →
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card-dashboard space-y-6" data-testid="new-product-form">

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
              placeholder="Ex: Jollof Rice Party Size"
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
              placeholder="Décrivez votre produit en détail..."
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
                placeholder="0.00"
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
              placeholder="Ex: PROD-001"
              data-testid="input-sku"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Photos du produit <span className="text-red-500">*</span>
              <span className="text-muted-foreground text-xs ml-1">(max 10, 5MB chacune)</span>
            </label>

            <div className="space-y-4">
              {images.length < 10 && (
                <label
                  className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-border rounded-2xl cursor-pointer bg-muted/20 hover:bg-primary/5 hover:border-primary/40 transition-colors"
                  data-testid="image-upload-zone"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <ImagePlus className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-foreground">
                        <span className="font-medium text-primary">Cliquez pour ajouter</span> ou glissez-déposez
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WEBP (MAX. 5MB)</p>
                      <p className="text-xs text-primary mt-1 font-medium">{images.length}/10 photos</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    multiple
                    onChange={handleImageUpload}
                  />
                </label>
              )}

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden aspect-square border border-border">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                        aria-label="Supprimer l'image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-md">
                        {index + 1}/{imagePreviews.length}
                      </div>
                    </div>
                  ))}
                </div>
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
              disabled={isSubmitting || !!businessError}
              className="flex-1 btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="submit-product"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Création en cours...' : 'Créer le produit'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
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
