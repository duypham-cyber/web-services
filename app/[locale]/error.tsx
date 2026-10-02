'use client';

import { RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Heading } from '@/components/ui/Heading';
import { Section } from '@/components/ui/Section';

/**
 * Lỗi khi render một trang (error boundary của [locale]). KHÔNG hiện stack trace (rules/logging.md);
 * chỉ hiện mã digest để người dùng báo hỗ trợ. Messages "errors" được gửi xuống client (i18n/messages.ts).
 * Sentry (staging/production) sẽ do agent QA/devops gắn sau, không console.log ở production.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('errors.error');
  return (
    <Section tone="blue-50" aria-labelledby="error-title" className="min-h-[60svh]">
      <Heading level={1} id="error-title">
        {t('title')}
      </Heading>
      <p className="mt-5 max-w-text text-lead text-(--surface-muted)">{t('lead')}</p>
      {error.digest ? <p className="mt-3 text-small text-(--surface-muted)">{t('reference', { digest: error.digest })}</p> : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="blue" onClick={() => reset()} iconStart={<RotateCcw aria-hidden="true" size={18} strokeWidth={1.75} />}>
          {t('retry')}
        </Button>
        <Button href="/" variant="ghost">
          {t('home')}
        </Button>
      </div>
    </Section>
  );
}
