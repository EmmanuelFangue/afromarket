'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Send, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

interface ContactFormProps {
  businessId: string;
  businessName: string;
}

interface FormData {
  name: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

const inputCls = (err?: string) =>
  `w-full h-12 px-4 bg-stone-50 border rounded-xl outline-none transition-all text-sm text-foreground placeholder:text-muted-foreground/60 ${
    err
      ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
      : 'border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
  }`;

const textareaCls = (err?: string) =>
  `w-full px-4 py-3 bg-stone-50 border rounded-xl outline-none transition-all resize-none text-sm text-foreground placeholder:text-muted-foreground/60 ${
    err
      ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
      : 'border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
  }`;

export default function ContactForm({ businessId, businessName }: ContactFormProps) {
  const t = useTranslations('contactForm');

  const [formData, setFormData] = useState<FormData>({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) newErrors.name = t('validation.nameRequired');

    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail)              newErrors.email = t('validation.emailRequired');
    else if (!validateEmail(trimmedEmail)) newErrors.email = t('validation.emailInvalid');

    const trimmedMessage = formData.message.trim();
    if (!trimmedMessage)             newErrors.message = t('validation.messageRequired');
    else if (trimmedMessage.length < 10) newErrors.message = t('validation.messageMinLength');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // TODO: Replace with actual API call when messaging backend is ready
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitStatus('success');
      setFormData({ name: '', email: '', message: '' });
      setErrors({});
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    if (submitStatus !== 'idle') setSubmitStatus('idle');
  };

  return (
    <div className="card-business p-8 mb-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
          <Send className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            {t('title')}
          </h2>
          <p className="text-muted-foreground mt-0.5">{t('subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Name + Email — side by side on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact-name" className="block text-sm font-medium text-foreground mb-2">
              {t('name')}
            </label>
            <input
              type="text"
              id="contact-name"
              value={formData.name}
              onChange={handleChange('name')}
              placeholder={t('namePlaceholder')}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'contact-name-error' : undefined}
              className={inputCls(errors.name)}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p id="contact-name-error" className="mt-1.5 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="contact-email" className="block text-sm font-medium text-foreground mb-2">
              {t('email')}
            </label>
            <input
              type="email"
              id="contact-email"
              value={formData.email}
              onChange={handleChange('email')}
              placeholder={t('emailPlaceholder')}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'contact-email-error' : undefined}
              className={inputCls(errors.email)}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p id="contact-email-error" className="mt-1.5 text-xs text-red-600">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="contact-message" className="block text-sm font-medium text-foreground mb-2">
            {t('message')}
          </label>
          <textarea
            id="contact-message"
            value={formData.message}
            onChange={handleChange('message')}
            placeholder={t('messagePlaceholder')}
            rows={5}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'contact-message-error' : undefined}
            className={textareaCls(errors.message)}
            disabled={isSubmitting}
          />
          {errors.message && (
            <p id="contact-message-error" className="mt-1.5 text-xs text-red-600">{errors.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
        >
          {isSubmitting
            ? <><Loader2 className="w-4 h-4 animate-spin" />{t('sending')}</>
            : <><Send className="w-4 h-4" />{t('send')}</>
          }
        </button>

        {/* Status messages */}
        {submitStatus === 'success' && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm"
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            {t('success')}
          </div>
        )}

        {submitStatus === 'error' && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {t('error')}
          </div>
        )}
      </form>
    </div>
  );
}
