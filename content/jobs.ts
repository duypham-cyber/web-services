import type { LocalizedText, PublishStatus } from './schemas';

/**
 * Tin tuyển thợ cho /doi-tac-tho#viec-dang-tuyen. Chủ sở hữu: agent trang thợ & công ty.
 * Nguồn: research/raw/requirement.txt (site cũ /requirement, crawl 01/10/2026).
 *
 * Đã sửa so với site cũ:
 *   - Cả 6 tin cũ dùng CHUNG mã "BBSV0924561" → bỏ mã đó, mỗi tin có `id` riêng; mã hiển thị chờ bộ phận tuyển thợ cấp.
 *   - 2 tin "[HCM] Thợ lắp đặt máy lạnh" (3 và 6 vị trí) trùng chức danh → gộp làm 1, số vị trí để null (chờ xác nhận).
 *   - Tin cũ đều ghi "hết hạn", không có ngày đăng/hạn nộp → `status: 'draft'`, `validThrough: null`.
 *
 * Luật hiển thị (contracts/site-shell-p0.md mục 5, EDGE CASES): production CHỈ hiện tin `approved` có `validThrough`
 * chưa qua (so với ngày build). Bản xem trước (DRAFT_PREVIEW=1) hiện cả tin nháp kèm nhãn "Nháp".
 * JobPosting JSON-LD (P1, agent SEO) chỉ dùng tin hiển thị được ở production và đủ trường bắt buộc.
 */
export type JobPosting = {
  /** Duy nhất, kebab-case. */
  id: string;
  title: LocalizedText;
  /** Mã tỉnh trong content/provinces.ts. */
  provinceCode: string;
  /** "CTV" trên site cũ = cộng tác viên. */
  employment: 'collaborator';
  /** null = chưa xác nhận số vị trí. */
  openings: number | null;
  status: PublishStatus;
  /** YYYY-MM-DD */
  postedAt: string | null;
  /** YYYY-MM-DD. null hoặc đã qua → không hiển thị ở production. */
  validThrough: string | null;
  /** Mã tin do bộ phận tuyển thợ cấp (duy nhất). null = chưa có. */
  code: string | null;
  source: string;
  note?: string;
};

export const jobPostings: readonly JobPosting[] = [
  {
    id: 'hcm-tho-lap-dat-may-lanh',
    title: { vi: 'Thợ lắp đặt máy lạnh', en: 'Air conditioner installer' },
    provinceCode: '79',
    employment: 'collaborator',
    openings: null,
    status: 'draft',
    postedAt: null,
    validThrough: null,
    code: null,
    source: 'research/raw/requirement.txt — tin 1 và tin 6',
    note: 'Site cũ có 2 tin cùng chức danh ở HCM (3 và 6 vị trí); đã gộp, chờ xác nhận số vị trí.',
  },
  {
    id: 'hai-phong-ky-thuat-dien-lanh',
    title: { vi: 'Nhân viên kỹ thuật điện lạnh', en: 'Refrigeration and air-conditioning technician' },
    provinceCode: '31',
    employment: 'collaborator',
    openings: 2,
    status: 'draft',
    postedAt: null,
    validThrough: null,
    code: null,
    source: 'research/raw/requirement.txt — tin 2',
  },
  {
    id: 'bac-ninh-nhan-vien-bao-tri',
    title: { vi: 'Nhân viên bảo trì', en: 'Maintenance technician' },
    provinceCode: '24',
    employment: 'collaborator',
    openings: 5,
    status: 'draft',
    postedAt: null,
    validThrough: null,
    code: null,
    source: 'research/raw/requirement.txt — tin 3',
  },
  {
    id: 'ha-noi-ky-thuat-nha-bep',
    title: { vi: 'Nhân viên kỹ thuật thiết bị nhà bếp', en: 'Kitchen appliance technician' },
    provinceCode: '01',
    employment: 'collaborator',
    openings: 4,
    status: 'draft',
    postedAt: null,
    validThrough: null,
    code: null,
    source: 'research/raw/requirement.txt — tin 4',
  },
  {
    id: 'hue-ky-thuat-smart-home',
    title: { vi: 'Nhân viên kỹ thuật nhà thông minh', en: 'Smart home technician' },
    provinceCode: '46',
    employment: 'collaborator',
    openings: 2,
    status: 'draft',
    postedAt: null,
    validThrough: null,
    code: null,
    source: 'research/raw/requirement.txt — tin 5',
  },
];

/**
 * Tin được hiển thị. `today` = ngày build dạng YYYY-MM-DD (trang tĩnh: tin hết hạn tự gỡ ở lần build sau).
 * Bản xem trước hiện mọi tin (kể cả nháp) để anh Duy rà.
 */
export function visibleJobs(today: string, draftPreview: boolean): JobPosting[] {
  return jobPostings.filter((job) => {
    if (draftPreview) return true;
    return job.status === 'approved' && job.validThrough !== null && job.validThrough >= today;
  });
}
