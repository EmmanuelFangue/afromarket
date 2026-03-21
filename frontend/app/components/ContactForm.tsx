'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { sendMessage } from '../lib/api';

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

export default function ContactForm({ businessId, businessName }: ContactFormProps) {
  const t = useTranslations('contactForm');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('validation.nameRequired');
    }

    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      newErrors.email = t('validation.emailRequired');
    } else if (!validateEmail(trimmedEmail)) {
      newErrors.email = t('validation.emailInvalid');
    }

    const trimmedMessage = formData.message.trim();
    if (!trimmedMessage) {
      newErrors.message = t('validation.messageRequired');
    } else if (trimmedMessage.length < 10) {
      newErrors.message = t('validation.messageMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      await sendMessage({
        businessId,
        senderName: formData.name.trim(),
        senderEmail: formData.email.trim(),
        content: formData.message.trim(),
      });

      setSubmitStatus('success');
      setFormData({ name: '', email: '', message: '' });
      setErrors({});
    } catch (error) {
      console.error('Failed to send message:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (submitStatus !== 'idle') {
      setSubmitStatus('idle');
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm p-8">
      <h2 className="font-heading text-2xl font-bold text-card-foreground mb-2">
        {t('title')}
      </h2>
      <p className="text-muted-foreground mb-6">
        {t('subtitle')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name field */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-foreground mb-1"
          >
            {t('name')}
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={handleChange('name')}
            placeholder={t('namePlaceholder')}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            className={`w-full px-4 py-2 border rounded-xl bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors ${
              errors.name ? 'border-destructive' : 'border-border'
            }`}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p id="name-error" className="mt-1 text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Email field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground mb-1"
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
            className={`w-full px-4 py-2 border rounded-xl bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors ${
              errors.email ? 'border-destructive' : 'border-border'
            }`}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        {/* Message field */}
        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-foreground mb-1"
          >
            {t('message')}
          </label>
          <textarea
            id="message"
            value={formData.message}
            onChange={handleChange('message')}
            placeholder={t('messagePlaceholder')}
            rows={5}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'message-error' : undefined}
            className={`w-full px-4 py-2 border rounded-xl bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none transition-colors ${
              errors.message ? 'border-destructive' : 'border-border'
            }`}
            disabled={isSubmitting}
          />
          {errors.message && (
            <p id="message-error" className="mt-1 text-sm text-destructive">{errors.message}</p>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isSubmitting ? t('sending') : t('send')}
        </button>

        {/* Success message */}
        {submitStatus === 'success' && (
          <div
            role="status"
            aria-live="polite"
            className="p-4 bg-success/10 text-success rounded-xl"
          >
            {t('success')}
          </div>
        )}

        {/* Error message */}
        {submitStatus === 'error' && (
          <div
            role="alert"
            aria-live="assertive"
            className="p-4 bg-destructive/10 text-destructive rounded-xl"
          >
            {t('error')}
          </div>
        )}
      </form>
    </div>
  );
}
