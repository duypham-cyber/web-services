import { BookOpen, Lightbulb, Workflow, type LucideIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Heading } from '@/components/ui/Heading';
import { Section, type SectionTone } from '@/components/ui/Section';
import { TextLink } from '@/components/ui/TextLink';
import { articles } from '@/content/articles';
import type { Article } from '@/content/schemas';
import type { Locale } from '@/i18n/routing';
import { formatDate } from '@/lib/format';
import { MediaFrame, type MediaImage } from './MediaFrame';
import { SectionHeader } from './SectionHeader';

type Category = Article['category'];

const CATEGORY_ICON: Record<Category, LucideIcon> = {
  b2b: Workflow,
  'installation-guide': BookOpen,
  'technical-knowledge': Lightbulb,
};

/** Thứ tự ưu tiên nhóm khi CHƯA có ngày đăng: trang chủ B2B nên mở đầu bằng bài cho doanh nghiệp. */
const CATEGORY_ORDER: readonly Category[] = ['b2b', 'installation-guide', 'technical-knowledge'];

type ArticleCard = {
  key: string;
  title: string;
  category: Category;
  slug: string;
  /** Các trường dưới đây chỉ có khi agent SEO bổ sung nội dung bài (content/articles/*): ẩn nếu thiếu. */
  publishedAt?: string;
  excerpt?: string;
  readingMinutes?: number;
  image?: MediaImage | null;
};

const asString = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v : undefined);
const asNumber = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

/**
 * 3 bài cho trang chủ: mới nhất theo `publishedAt` nếu dữ liệu bài có ngày; chưa có ngày thì lấy bài đầu tiên của mỗi
 * nhóm (B2B → hướng dẫn → kiến thức kỹ thuật) để trang chủ không lệch về một chủ đề (giả định, ghi trong báo cáo).
 * content/articles.ts thuộc agent SEO — CHỈ ĐỌC; trường tùy chọn đọc an toàn để không vỡ khi schema thay đổi.
 */
function pickArticles(locale: Locale): ArticleCard[] {
  const cards: ArticleCard[] = articles.map((a) => {
    const extra = a as Article & Record<string, unknown>;
    const excerptField = extra.excerpt ?? extra.description;
    return {
      key: a.key,
      title: a.title[locale],
      category: a.category,
      slug: a.slug[locale],
      publishedAt: asString(extra.publishedAt),
      excerpt:
        excerptField && typeof excerptField === 'object' ? asString((excerptField as Record<string, unknown>)[locale]) : undefined,
      readingMinutes: asNumber(extra.readingMinutes),
    };
  });

  if (cards.some((c) => c.publishedAt)) {
    return [...cards].sort((x, y) => (y.publishedAt ?? '').localeCompare(x.publishedAt ?? '')).slice(0, 3);
  }
  return CATEGORY_ORDER.flatMap((cat) => cards.find((c) => c.category === cat) ?? []).slice(0, 3);
}

/** P7 KIẾN THỨC (P1): 3 thẻ bài — nhóm · ngày · thời gian đọc · trích 2 dòng (phần nào chưa có dữ liệu thì ẩn). */
export async function KnowledgeSection({ locale, tone }: { locale: Locale; tone: SectionTone }) {
  const t = await getTranslations('home');
  const cards = pickArticles(locale);
  if (cards.length === 0) return null;

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

      <StaggerGrid as="ul" className="mt-12 grid gap-6 md:grid-cols-3 lg:mt-16" itemClassName="flex">
        {cards.map((card) => (
          <Card key={card.key} as="article" interactive padding="none" className="flex w-full flex-col overflow-hidden">
            <MediaFrame
              ratio="16/10"
              rounded={false}
              image={card.image}
              icon={CATEGORY_ICON[card.category]}
              sizes="(min-width: 768px) 33vw, 100vw"
            />
            <div className="flex flex-1 flex-col p-6">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-small text-(--surface-muted)">
                <Chip variant="blue">{t(`knowledge.categories.${card.category}`)}</Chip>
                {card.publishedAt ? <time dateTime={card.publishedAt}>{formatDate(card.publishedAt, locale)}</time> : null}
                {card.readingMinutes ? <span>{t('knowledge.readingTime', { minutes: card.readingMinutes })}</span> : null}
              </p>
              <Heading level={3} className="mt-4">
                {card.title}
              </Heading>
              {card.excerpt ? <p className="mt-3 line-clamp-2 text-small text-(--surface-muted)">{card.excerpt}</p> : null}
              <TextLink
                href={{ pathname: '/kien-thuc/[slug]', params: { slug: card.slug } }}
                variant="arrow"
                className="mt-auto pt-6 after:absolute after:inset-0 after:rounded-lg"
              >
                {t('knowledge.read')}
                <span className="sr-only">: {card.title}</span>
              </TextLink>
            </div>
          </Card>
        ))}
      </StaggerGrid>
    </Section>
  );
}
