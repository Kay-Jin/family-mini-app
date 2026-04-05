/**
 * 设计令牌 — 与 docs/ui-ux-design-system-v1.1.md 保持一致
 * （WXSS 无法直接 import，样式以 app.wxss 为准；此处供 JS/文档引用）
 */
const TOKENS = {
  color: {
    bgCanvas: "#F7F1E8",
    bgSubtle: "#F3E9DC",
    bgElevated: "#FFFFFF",
    textPrimary: "#2A221B",
    textSecondary: "#655A4F",
    brand: "#567A58",
    brandPressed: "#476849",
    accentWarm: "#D6A35E",
    accentWood: "#8C6346",
    borderSubtle: "rgba(42,34,27,0.10)",
    success: "#3DBE6E",
    attention: "#E8B860",
    critical: "#C44D4D",
  },
  typography: {
    titleLg: 36,
    titleMd: 32,
    body: 30,
    bodySm: 26,
    caption: 24,
    seniorScale: 1.14,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 20,
    pill: 999,
  },
  shadow: {
    card: "0 8rpx 20rpx rgba(86,122,88,0.10)",
    floating: "0 10rpx 28rpx rgba(42,34,27,0.14)",
  },
  touch: {
    minTarget: 88,
    minTargetSenior: 96,
  },
};

module.exports = { TOKENS };
