import type { App, Directive } from "vue";

// IntersectionObserver 接口的兼容性检查
const isIntersectionObserverSupported = 
  "IntersectionObserver" in window && 
  "IntersectionObserverEntry" in window && 
  "intersectionRatio" in window.IntersectionObserverEntry.prototype;

// 懒加载观察器
const createLazyLoadObserver = () => {
  if (!isIntersectionObserverSupported) {
    console.warn("当前浏览器不支持 IntersectionObserver API，图片懒加载将失效");
    return null;
  }
  
  return new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      // 当图片进入视口时加载图片
      if (entry.isIntersecting) {
        const imgElement = entry.target as HTMLImageElement;
        const lazyImgSrc = imgElement.getAttribute("data-lazy-src");
        
        if (lazyImgSrc) {
          // 创建新的图片对象，用于预加载
          const img = new Image();
          
          // 当图片加载成功时设置到实际的img元素
          img.onload = () => {
            imgElement.src = lazyImgSrc;
            imgElement.classList.add("lazy-loaded");
            imgElement.classList.remove("lazy-loading");
            imgElement.removeAttribute("data-lazy-src");
          };
          
          // 图片加载失败时处理
          img.onerror = () => {
            imgElement.classList.add("lazy-error");
            imgElement.classList.remove("lazy-loading");
            console.error(`图片 ${lazyImgSrc} 加载失败`);
          };
          
          // 开始加载图片
          imgElement.classList.add("lazy-loading");
          img.src = lazyImgSrc;
          
          // 加载后取消观察该元素
          observer.unobserve(imgElement);
        }
      }
    });
  }, {
    // 当图片进入视口之前的200px就开始加载，提前预加载
    rootMargin: "200px 0px",
    threshold: 0.01
  });
};

// 创建全局观察器实例
let lazyLoadObserver = null;

/**
 * v-lazy-load 指令：图片懒加载
 * 使用方法：<img v-lazy-load="图片URL" alt="图片描述" />
 */
const lazyLoad: Directive = {
  created(el, binding) {
    if (!binding.value) return;
    
    // 先设置一个占位符或低质量预览图
    if (!el.src) {
      el.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjwvc3ZnPg==";
    }
    
    // 存储实际图片URL
    el.setAttribute("data-lazy-src", binding.value);
    
    // 添加样式类
    el.classList.add("lazy");
  },
  
  mounted(el, binding) {
    if (!binding.value) return;
    
    // 确保观察器已创建
    if (!lazyLoadObserver) {
      lazyLoadObserver = createLazyLoadObserver();
    }
    
    // 降级处理：如果不支持IntersectionObserver，直接加载图片
    if (!lazyLoadObserver) {
      el.src = binding.value;
      return;
    }
    
    // 开始观察元素
    lazyLoadObserver.observe(el);
  },
  
  beforeUnmount(el) {
    // 取消观察，避免内存泄漏
    if (lazyLoadObserver) {
      lazyLoadObserver.unobserve(el);
    }
  },
  
  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      // 图片URL改变，更新data-lazy-src属性
      el.setAttribute("data-lazy-src", binding.value);
      
      // 如果已经在视口中，则直接加载新图片
      if (lazyLoadObserver) {
        lazyLoadObserver.unobserve(el);
        lazyLoadObserver.observe(el);
      }
    }
  }
};

export function setupLazyLoad(app: App) {
  app.directive("lazy-load", lazyLoad);
}

export default {
  install(app: App) {
    setupLazyLoad(app);
  }
}; 