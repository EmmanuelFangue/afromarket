'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
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
  const t = useTranslations('auth.login');
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      newErrors.email = t('errors.emailRequired');
    } else if (!emailRegex.test(trimmedEmail)) {
      newErrors.email = t('errors.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('errors.passwordRequired');
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
      router.push(returnUrl || '/');
    } catch (error) {
      setErrors({ general: t('errors.invalidCredentials') });
    } finally {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
            {t('subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          {/* Email field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t('email')}
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange('email')}
              placeholder={t('emailPlaceholder')}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
                errors.email
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t('password')}
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange('password')}
              placeholder={t('passwordPlaceholder')}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
                errors.password
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              disabled={isSubmitting}
            />
            {errors.password && (
              <p id="password-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.password}
              </p>
            )}
          </div>

          {/* General error */}
          {errors.general && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg"
            >
              {errors.general}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? t('submitting') : t('submit')}
          </button>

          {/* Links */}
          <div className="text-center text-sm">
            <Link
              href="/auth/register"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t('noAccount')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
