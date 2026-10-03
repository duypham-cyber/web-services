import type { ReactNode } from 'react';
import type { AppMessages } from '@/i18n/types';
import type { PublicConsent } from '@/lib/leads/consent';
import type { B2BIntent, LeadLocale } from '@/lib/leads/rules';

type Leads = AppMessages['leads'];

/** Chữ chung của mọi form lead — server cắt từ messages leads.json rồi truyền qua props (client chỉ có common/errors). */
export type LeadFormCopy = Pick<Leads, 'form' | 'consent' | 'errors' | 'fieldErrors' | 'thanks'>;

/** Kênh liên hệ trong thông báo lỗi và màn hình cảm ơn. zalo = null khi link chưa duyệt ở production (D-06). */
export type LeadContact = {
  phoneDisplay: string;
  tel: string;
  zalo: { url: string; draftLabel: string | null } | null;
};

/** Props chung do Server Component (LeadB2BBlock / LeadTechnicianBlock) dựng từ getLeadFormState(). */
export type LeadFormBaseProps = {
  locale: LeadLocale;
  endpoint: string;
  consent: PublicConsent;
  turnstileSiteKey: string;
  copy: LeadFormCopy;
  contact: LeadContact;
  /** Nhãn "Nháp" (chỉ bản xem trước) — null ở production. */
  draftLabel: string | null;
  /** Ghi chú cho người duyệt cạnh câu đồng ý nháp (chỉ bản xem trước). */
  consentDraftNote: string | null;
  /** Câu thời gian gọi lại đã dựng sẵn ở server (SLA đã duyệt, hoặc bản xem trước kèm Nháp). null = ẩn. */
  callback: { text: string; draft: boolean } | null;
  /** Khối Gọi · Zalo · email (server render) — hiện thay form khi API trả 503 LEADS_DISABLED lúc chạy. */
  fallback: ReactNode;
};

export type ProvinceOption = { code: string; name: string; region: 'north' | 'central' | 'south' };

export type LeadB2BProps = LeadFormBaseProps & {
  b2b: Leads['b2b'];
  provinces: ProvinceOption[];
  /** Intent cho phép trên trang này; phần tử đầu là mặc định. Có cả quote và demo → hiện nút chuyển. */
  intents: B2BIntent[];
  /** Câu gọi lại theo intent demo (khác câu b2b). */
  callbackDemo: { text: string; draft: boolean } | null;
  /** Id khối (neo) — mặc định 'bao-gia'. */
  blockId: string;
};

export type LeadTechnicianProps = LeadFormBaseProps & {
  technician: Leads['technician'];
  provinces: ProvinceOption[];
  /** Lộ trình gia nhập 4 bước (tiêu đề từng bước) cho màn hình cảm ơn. */
  steps: string[];
};
