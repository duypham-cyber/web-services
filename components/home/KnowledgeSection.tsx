import { getTranslations } from 'next-intl/server';
import { ArticleCard } from '@/components/knowledge/ArticleCard';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { Section, type SectionTone } from '@/components/ui/Section';
import { TextLink } from '@/components/ui/TextLink';
import { listArticles } from '@/content/articles/all';
import type { Locale } from '@/i18n/routing';
import { SectionHeader } from './SectionHeader';

/** Số bài trên trang chủ (docs/03 mục 13.4 P7). */
const HOME_ARTICLES = 3;

/**
 * P7 KIẾN THỨC (P1): 3 bài MỚI NHẤT theo ngày đăng — dữ liệu và thẻ bài của khu vực Kiến thức (agent SEO, CHỈ ĐỌC):
 * listArticles() (content/articles/all.ts, đã sắp mới nhất trước) + <ArticleCard/> (components/knowledge).
 * Thẻ CHỈ CÓ CHỮ (media={false}): ảnh bài cũ lệch art direction (docs/03 mục 11.4: stock, ảnh AI) nên trang chủ không
 * dùng ảnh bài cho tới khi có ảnh đạt — nhóm · tiêu đề · trích 2 dòng · ngày · phút đọc.
 */
export async function KnowledgeSection({ locale, tone }: { locale: Locale; tone: SectionTone }) {
  const t = await getTranslations('home');
  const latest = listArticles().slice(0, HOME_ARTICLES);
  if (latest.length === 0) return null;

  return (
    <Section id="kien-thuc" tone={tone} aria-labelledby="kien-thuc-title">
      <SectionHeader
        id="kien-thuc-title"
        eyebrow={t('knowledge.eyebrow')}
        title={t('knowledge.title')}
        lead={t('knowledge.lead')}
        action={
          <TextLink href="/kien-thuc" variant="arrow">
            {t('knowledge.cta')}
          </TextLink>
        }
      />

      <StaggerGrid as="ul" className="mt-12 grid gap-6 md:grid-cols-3 lg:mt-16" itemClassName="grid">
        {latest.map((article) => (
          <ArticleCard key={article.key} article={article} locale={locale} headingLevel={3} media={false} />
        ))}
      </StaggerGrid>
    </Section>
  );
}
