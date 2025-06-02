import { h, defineComponent } from "vue";
import { Icon } from "@iconify/vue";
import { IconProps } from "./types";

/**
 * 在线图标组件
 * 用于加载Iconify在线图标库
 */
export default defineComponent({
  name: "IconifyIconOnline",
  props: {
    icon: {
      type: String,
      required: true
    },
    color: {
      type: String,
      default: ""
    },
    size: {
      type: [String, Number],
      default: "default"
    },
    spin: {
      type: Boolean,
      default: false
    },
    spin_speed: {
      type: String,
      default: "1s" 
    }
  },
  setup(props, { attrs }) {
    // 计算图标大小
    const getSize = () => {
      const { size } = props;
      if (size === "small") return "1rem";
      if (size === "default") return "1.25rem";
      if (size === "large") return "1.5rem";
      if (typeof size === "number") return `${size}px`;
      return size;
    };

    // 计算旋转动画
    const getSpin = () => {
      if (!props.spin) return {};
      return {
        animation: `spin ${props.spin_speed} infinite linear`
      };
    };

    return () => h(
      Icon,
      {
        icon: props.icon,
        color: props.color,
        width: getSize(),
        height: getSize(),
        style: {
          ...getSpin(),
          outline: "none",
          ...(attrs?.style || {})
        },
        ...attrs
      }
    );
  }
}); 