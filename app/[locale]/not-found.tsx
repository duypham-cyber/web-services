import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Heading } from '@/components/ui/Heading';
import { Section } from '@/components/ui/Section';
import { TextLink } from '@/components/ui/TextLink';

/**
 * 404 trong layout [locale] (có header/footer, đúng ngôn ngữ). Next tự thêm robots noindex cho mã 404.
 * P1: agent trang thợ & công ty có thể thêm minh họa (KHANG chỉ khi có văn bản quyền).
 */
export default async function NotFound() {
  const t = await getTranslations('errors.notFound');
  const tc = await getTranslations('common');
  return (
    <Section tone="blue-50" aria-labelledby="not-found-title" className="min-h-[60svh]">
      <Eyebrow>{t('eyebrow')}</Eyebrow>
      <Heading level={1} id="not-found-title" className="mt-3">
        {t('title')}
      </Heading>
      <p className="mt-5 max-w-text text-lead text-(--surface-muted)">{t('lead')}</p>
      <ul className="mt-8 flex flex-col gap-3">
        <li>
          <TextLink href="/giai-phap/hang-dien-may" variant="arrow">
            {t('links.solutions')}
          </TextLink>
        </li>
        <li>
          <TextLink href="/doi-tac-tho" variant="arrow">
            {t('links.partners')}
          </TextLink>
        </li>
        <li>
          <TextLink href="/lien-he" variant="arrow">
            {t('links.contact')}
          </TextLink>
        </li>
      </ul>
      <Button href="/" variant="blue" className="mt-10">
        {tc('cta.backHome')}
      </Button>
    </Section>
  );
}
