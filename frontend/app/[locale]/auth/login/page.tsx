'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

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
  const locale = (pathname.split('/')[1] || 'fr') as 'fr' | 'en';
  const { login } = useAuth();

  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = {
    fr: {
      title: 'Connexion',
      subtitle: 'Connectez-vous à votre compte AfroMarket',
      email: 'Email',
      emailPlaceholder: 'vous@exemple.com',
      password: 'Mot de passe',
      passwordPlaceholder: '••••••••',
      submit: 'Se connecter',
      submitting: 'Connexion en cours...',
      noAccount: 'Pas de compte ?',
      register: 'Créer un compte',
      errors: {
        emailRequired: 'L\'email est requis',
        emailInvalid: 'Format d\'email invalide',
        passwordRequired: 'Le mot de passe est requis',
        invalidCredentials: 'Email ou mot de passe incorrect'
      }
    },
    en: {
      title: 'Login',
      subtitle: 'Sign in to your AfroMarket account',
      email: 'Email',
      emailPlaceholder: 'you@example.com',
      password: 'Password',
      passwordPlaceholder: '••••••••',
      submit: 'Sign in',
      submitting: 'Signing in...',
      noAccount: 'No account?',
      register: 'Create an account',
      errors: {
        emailRequired: 'Email is required',
        emailInvalid: 'Invalid email format',
        passwordRequired: 'Password is required',
        invalidCredentials: 'Invalid email or password'
      }
    }
  }[locale];

  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      newErrors.email = t.errors.emailRequired;
    } else if (!emailRegex.test(trimmedEmail)) {
      newErrors.email = t.errors.emailInvalid;
    }

    if (!formData.password) {
      newErrors.password = t.errors.passwordRequired;
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
      await login(formData.email.trim(), formData.password);
      const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
      router.push(returnUrl || `/${locale}`);
    } catch (error) {
      setErrors({ general: t.errors.invalidCredentials });
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    if (errors.general) setErrors(prev => ({ ...prev, general: undefined }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2 mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-heading font-bold text-2xl">A</span>
            </div>
          </Link>
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card-dashboard space-y-6" data-testid="login-form">
          {/* General error */}
          {errors.general && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl" data-testid="login-error">
              {errors.general}
            </div>
          )}

          {/* Email field */}
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
                placeholder={t.emailPlaceholder}
                className={`input-default pl-12 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                disabled={isSubmitting}
                data-testid="login-email-input"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password field */}
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
                placeholder={t.passwordPlaceholder}
                className={`input-default pl-12 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                disabled={isSubmitting}
                data-testid="login-password-input"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary flex items-center justify-center gap-2"
            data-testid="login-submit-btn"
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

          {/* Register link */}
          <p className="text-center text-sm text-muted-foreground">
            {t.noAccount}{' '}
            <Link href={`/${locale}/auth/register`} className="text-primary font-medium hover:underline" data-testid="register-link">
              {t.register}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
