// Biểu tượng tia chớp tạm (KHÔNG phải logo chính thức — chờ file logo gốc + quyền sử dụng)
export default function Bolt({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="#004AAD" />
      <path d="M13.5 3 6 13.2h5l-1.2 7.8L18 10.4h-5.1z" fill="#EF8426" />
    </svg>
  );
}
