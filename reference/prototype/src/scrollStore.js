// Trạng thái cuộn dùng chung giữa DOM (GSAP ScrollTrigger) và vòng render 3D — không qua React state để tránh re-render.
export const scrollStore = { progress: 0 };
// Mốc tiến độ: camera tới khung "màn hình lấp khung" tại CAMERA_END; HTML thật hiện dần trong [HANDOFF_IN, HANDOFF_FULL].
export const CAMERA_END = 0.86;
export const HANDOFF_IN = 0.8;
export const HANDOFF_FULL = 0.93;
