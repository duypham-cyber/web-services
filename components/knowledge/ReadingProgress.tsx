import styles from './reading-progress.module.css';

/**
 * Thanh tiến độ đọc (scroll-progress) chỉ bằng CSS — xem reading-progress.module.css. Trang trí: aria-hidden.
 * Server Component, không gửi JS xuống trình duyệt.
 */
export function ReadingProgress() {
  return <div aria-hidden="true" className={styles.bar} />;
}
