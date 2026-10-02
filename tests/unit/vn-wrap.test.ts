import { describe, expect, it } from 'vitest';
import { keepCompounds } from '@/lib/vn-wrap';

const NB = ' ';
const show = (s: string) => s.replaceAll(NB, '~');

describe('keepCompounds (lib/vn-wrap.ts) — giữ từ ghép tiếng Việt cùng dòng ở tiêu đề', () => {
  it('nối âm tiết của từ ghép bằng NBSP, giữ dấu cách giữa các từ', () => {
    expect(show(keepCompounds('Đơn ổn định, thu nhập minh bạch'))).toBe('Đơn ổn~định, thu~nhập minh~bạch');
    expect(show(keepCompounds('Khung giá vật tư tham khảo (thợ thu tại chỗ)'))).toBe('Khung~giá vật~tư tham~khảo (thợ thu tại chỗ)');
    expect(show(keepCompounds('Không chỉ là đơn vị trung gian'))).toBe('Không chỉ là đơn~vị trung~gian');
    expect(show(keepCompounds('Hạ tầng lắp đặt toàn quốc cho hãng điện máy'))).toBe(
      'Hạ~tầng lắp~đặt toàn~quốc cho hãng điện~máy',
    );
  });

  it('cụm ba âm tiết và tên riêng', () => {
    expect(show(keepCompounds('Robot và tự động hóa trong gia đình'))).toBe('Robot và tự~động~hóa trong gia~đình');
    expect(show(keepCompounds('Lắp đặt tại TP. Hồ Chí Minh'))).toBe('Lắp~đặt tại TP. Hồ~Chí~Minh');
  });

  it('không nối khi có dấu câu xen giữa; dấu câu ở hai đầu cụm vẫn nối', () => {
    expect(show(keepCompounds('Thu, nhập'))).toBe('Thu, nhập');
    expect(show(keepCompounds('Ngành điện lạnh 2026: dịch vụ quyết định'))).toBe('Ngành điện~lạnh 2026: dịch~vụ quyết~định');
    expect(show(keepCompounds('“Lắp đặt” đúng cách'))).toBe('“Lắp~đặt” đúng cách');
  });

  it('không phân biệt hoa thường; số + đơn vị giữ cùng dòng', () => {
    expect(show(keepCompounds('LẮP ĐẶT trong 30 phút, 5 bước'))).toBe('LẮP~ĐẶT trong 30~phút, 5~bước');
  });

  it('bản EN: chỉ "after-sales" đổi sang gạch nối không ngắt, chữ khác giữ nguyên', () => {
    expect(keepCompounds('Standardizing after-sales installation')).toBe('Standardizing after‑sales installation');
    expect(keepCompounds('Steady jobs, transparent earnings')).toBe('Steady jobs, transparent earnings');
  });

  it('chuỗi không có dấu cách trả nguyên', () => {
    expect(keepCompounds('Bluebolt')).toBe('Bluebolt');
    expect(keepCompounds('')).toBe('');
  });
});
