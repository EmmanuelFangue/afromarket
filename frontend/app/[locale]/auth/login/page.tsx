'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'fr';
  const { login } = useAuth();

  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      newErrors.email = "L'email est requis";
    } else if (!emailRegex.test(trimmedEmail)) {
      newErrors.email = "Format d'email invalide";
    }

    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[LoginPage] Form submitted');
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      console.log('[LoginPage] Calling login...');
      await login(formData.email.trim(), formData.password);
      console.log('[LoginPage] Login successful, redirecting...');
      const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
      const redirectTo = returnUrl || `/${locale}`;
      console.log('[LoginPage] Redirecting to:', redirectTo);
      router.push(redirectTo);
    } catch (error) {
      console.error('[LoginPage] Login failed:', error);
      setErrors({ general: "Email ou mot de passe incorrect" });
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-heading font-bold text-2xl">A</span>
            </div>
          </div>
          <h1 className="font-heading text-3xl font-bold text-center text-foreground">
            Connexion
          </h1>
          <p className="mt-2 text-center text-muted-foreground">
            Connectez-vous à votre compte
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-card border border-border p-8 rounded-2xl shadow-sm">
          {/* Email field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange('email')}
              placeholder="vous@exemple.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={`w-full px-4 py-2 border rounded-xl bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors ${
                errors.email ? 'border-destructive' : 'border-border'
              }`}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-sm text-destructive">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange('password')}
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={`w-full px-4 py-2 border rounded-xl bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors ${
                errors.password ? 'border-destructive' : 'border-border'
              }`}
              disabled={isSubmitting}
            />
            {errors.password && (
              <p id="password-error" className="mt-1 text-sm text-destructive">
                {errors.password}
              </p>
            )}
          </div>

          {/* General error */}
          {errors.general && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-4 bg-destructive/10 text-destructive rounded-xl"
            >
              {errors.general}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? "Connexion en cours..." : "Se connecter"}
          </button>

          {/* Links */}
          <div className="text-center text-sm">
            <Link
              href={`/${locale}/auth/register`}
              className="text-primary hover:underline font-medium"
            >
              Pas de compte ? Inscrivez-vous
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
