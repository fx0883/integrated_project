/**
 * Icon组件类型定义
 */

// Icon组件尺寸定义
export type IconSize = "small" | "default" | "large" | number;

// Icon组件颜色定义
export interface IconColors {
  primary?: string;
  secondary?: string;
  info?: string;
  success?: string;
  warning?: string;
  danger?: string;
}

// Icon组件属性定义
export interface IconProps {
  // 图标名称或图标路径
  icon: string;
  // 图标大小
  size?: IconSize;
  // 图标颜色
  color?: string;
  // 是否使用Iconfont图标
  iconfont?: boolean;
  // 是否在线加载图标
  online?: boolean;
  // 是否进行旋转
  spin?: boolean;
  // 旋转速度
  spin_speed?: string;
  // 自定义样式
  style?: object;
  // 自定义类名
  class?: string;
} 