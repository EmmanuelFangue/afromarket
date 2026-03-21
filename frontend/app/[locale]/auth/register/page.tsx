'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function RegisterPage() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'fr';
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: RegisterFormErrors = {};

    const trimmedFirstName = formData.firstName.trim();
    if (!trimmedFirstName) {
      newErrors.firstName = "Le prénom est requis";
    }

    const trimmedLastName = formData.lastName.trim();
    if (!trimmedLastName) {
      newErrors.lastName = "Le nom est requis";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      newErrors.email = "L'email est requis";
    } else if (!emailRegex.test(trimmedEmail)) {
      newErrors.email = "Format d'email invalide";
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "La confirmation du mot de passe est requise";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password
      });
      setTimeout(() => {
        window.location.replace(`/${locale}`);
      }, 100);
    } catch (error: any) {
      if (error.message.includes('exists')) {
        setErrors({ email: "Cet email existe déjà" });
      } else {
        setErrors({ general: error.message || "L'inscription a échoué" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof RegisterFormData) => (
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
            Inscription
          </h1>
          <p className="mt-2 text-center text-muted-foreground">
            Créez votre compte AfroMarket
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-card border border-border p-8 rounded-2xl shadow-sm">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-1">
              Prénom
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={handleChange('firstName')}
              placeholder="Votre prénom"
              aria-invalid={!!errors.firstName}
              aria-describedby={errors.firstName ? 'firstName-error' : undefined}
              className={`w-full px-4 py-2 border rounded-xl bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors ${
                errors.firstName ? 'border-destructive' : 'border-border'
              }`}
              disabled={isSubmitting}
            />
            {errors.firstName && <p id="firstName-error" className="mt-1 text-sm text-destructive">{errors.firstName}</p>}
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-1">
              Nom
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={handleChange('lastName')}
              placeholder="Votre nom"
              aria-invalid={!!errors.lastName}
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
              className={`w-full px-4 py-2 border rounded-xl bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors ${
                errors.lastName ? 'border-destructive' : 'border-border'
              }`}
              disabled={isSubmitting}
            />
            {errors.lastName && <p id="lastName-error" className="mt-1 text-sm text-destructive">{errors.lastName}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
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
            {errors.email && <p id="email-error" className="mt-1 text-sm text-destructive">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
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
            {errors.password && <p id="password-error" className="mt-1 text-sm text-destructive">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              placeholder="••••••••"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
              className={`w-full px-4 py-2 border rounded-xl bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors ${
                errors.confirmPassword ? 'border-destructive' : 'border-border'
              }`}
              disabled={isSubmitting}
            />
            {errors.confirmPassword && <p id="confirmPassword-error" className="mt-1 text-sm text-destructive">{errors.confirmPassword}</p>}
          </div>

          {/* General error */}
          {errors.general && (
            <div role="alert" aria-live="assertive" className="p-4 bg-destructive/10 text-destructive rounded-xl">
              {errors.general}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? "Inscription en cours..." : "S'inscrire"}
          </button>

          {/* Link */}
          <div className="text-center text-sm">
            <Link href={`/${locale}/auth/login`} className="text-primary hover:underline font-medium">
              Déjà un compte ? Connectez-vous
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
