'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { Mail, Lock, User, Loader2, ArrowRight, ShoppingBag, Store } from 'lucide-react';

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

type Role = 'user' | 'merchant';

export default function RegisterPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] || 'fr') as 'fr' | 'en';
  const { register } = useAuth();

  const [role, setRole] = useState<Role>('user');
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: ''
  });
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = {
    fr: {
      title: 'Créer un compte',
      subtitle: 'Rejoignez AfroMarket et découvrez les commerces africains au Canada',
      roleLabel: 'Je souhaite…',
      roleUser: 'Acheter & explorer',
      roleUserDesc: 'Parcourir et découvrir les commerces africains',
      roleMerchant: 'Vendre mes produits',
      roleMerchantDesc: 'Ouvrir ma boutique et gérer mes produits',
      firstName: 'Prénom',
      lastName: 'Nom',
      email: 'Email',
      password: 'Mot de passe',
      confirmPassword: 'Confirmer le mot de passe',
      submit: 'Créer mon compte',
      submitting: 'Création en cours...',
      hasAccount: 'Déjà un compte ?',
      login: 'Se connecter',
      errors: {
        firstNameRequired: 'Le prénom est requis',
        lastNameRequired: 'Le nom est requis',
        emailRequired: "L'email est requis",
        emailInvalid: "Format d'email invalide",
        passwordRequired: 'Le mot de passe est requis',
        passwordWeak: 'Min. 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial',
        confirmRequired: 'La confirmation est requise',
        passwordMismatch: 'Les mots de passe ne correspondent pas',
        registrationFailed: "Échec de l'inscription. Veuillez réessayer.",
      }
    },
    en: {
      title: 'Create an account',
      subtitle: 'Join AfroMarket and discover African businesses in Canada',
      roleLabel: 'I want to…',
      roleUser: 'Buy & explore',
      roleUserDesc: 'Browse and discover African businesses',
      roleMerchant: 'Sell my products',
      roleMerchantDesc: 'Open my store and manage my products',
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password',
      submit: 'Create my account',
      submitting: 'Creating...',
      hasAccount: 'Already have an account?',
      login: 'Sign in',
      errors: {
        firstNameRequired: 'First name is required',
        lastNameRequired: 'Last name is required',
        emailRequired: 'Email is required',
        emailInvalid: 'Invalid email format',
        passwordRequired: 'Password is required',
        passwordWeak: 'Min. 8 characters, 1 uppercase, 1 number, 1 special char',
        confirmRequired: 'Confirmation is required',
        passwordMismatch: 'Passwords do not match',
        registrationFailed: 'Registration failed. Please try again.',
      }
    }
  }[locale];

  const validateForm = (): boolean => {
    const newErrors: RegisterFormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=-]).{8,}$/;

    if (!formData.firstName.trim()) newErrors.firstName = t.errors.firstNameRequired;
    if (!formData.lastName.trim()) newErrors.lastName = t.errors.lastNameRequired;

    if (!formData.email.trim()) {
      newErrors.email = t.errors.emailRequired;
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = t.errors.emailInvalid;
    }

    if (!formData.password) {
      newErrors.password = t.errors.passwordRequired;
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = t.errors.passwordWeak;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t.errors.confirmRequired;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t.errors.passwordMismatch;
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
        password: formData.password,
        role,
      });
      router.push(role === 'merchant' ? `/${locale}/merchant/dashboard` : `/${locale}`);
    } catch (error) {
      setErrors({ general: t.errors.registrationFailed });
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof RegisterFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    if (errors.general) setErrors(prev => ({ ...prev, general: undefined }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2 mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-heading font-bold text-2xl">A</span>
            </div>
          </Link>
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="card-dashboard space-y-5" data-testid="register-form">
          {/* General error */}
          {errors.general && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl" data-testid="register-error">
              {errors.general}
            </div>
          )}

          {/* Role selection */}
          <div>
            <p className="block text-sm font-medium text-foreground mb-3">{t.roleLabel}</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Regular user */}
              <button
                type="button"
                onClick={() => setRole('user')}
                data-testid="role-user"
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all ${
                  role === 'user'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/40 hover:bg-muted/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'
                }`}>
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${role === 'user' ? 'text-primary' : 'text-foreground'}`}>
                    {t.roleUser}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{t.roleUserDesc}</p>
                </div>
              </button>

              {/* Merchant */}
              <button
                type="button"
                onClick={() => setRole('merchant')}
                data-testid="role-merchant"
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all ${
                  role === 'merchant'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/40 hover:bg-muted/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  role === 'merchant' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'
                }`}>
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${role === 'merchant' ? 'text-primary' : 'text-foreground'}`}>
                    {t.roleMerchant}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{t.roleMerchantDesc}</p>
                </div>
              </button>
            </div>
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                {t.firstName}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleChange('firstName')}
                  className={`input-default pl-12 ${errors.firstName ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                  data-testid="register-firstname-input"
                />
              </div>
              {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                {t.lastName}
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={handleChange('lastName')}
                className={`input-default ${errors.lastName ? 'border-red-500' : ''}`}
                disabled={isSubmitting}
                data-testid="register-lastname-input"
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              {t.email}
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleChange('email')}
                className={`input-default pl-12 ${errors.email ? 'border-red-500' : ''}`}
                disabled={isSubmitting}
                data-testid="register-email-input"
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              {t.password}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={handleChange('password')}
                className={`input-default pl-12 ${errors.password ? 'border-red-500' : ''}`}
                disabled={isSubmitting}
                data-testid="register-password-input"
              />
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
              {t.confirmPassword}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                className={`input-default pl-12 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                disabled={isSubmitting}
                data-testid="register-confirm-input"
              />
            </div>
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary flex items-center justify-center gap-2"
            data-testid="register-submit-btn"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t.submitting}
              </>
            ) : (
              <>
                {t.submit}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Login link */}
          <p className="text-center text-sm text-muted-foreground">
            {t.hasAccount}{' '}
            <Link href={`/${locale}/auth/login`} className="text-primary font-medium hover:underline" data-testid="login-link">
              {t.login}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
