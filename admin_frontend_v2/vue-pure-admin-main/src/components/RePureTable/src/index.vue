import { safeDeepClone } from "@/utils/common";

// 添加到setup函数内部末尾
onMounted(() => {
  // 添加一个监听器，用于检测并解决可能的循环引用问题
  console.log("[表格组件] 正在检查表格数据是否存在循环引用风险");
  
  // 监听表格数据变化
  watch(
    () => props.data,
    (newData) => {
      if (!newData || !Array.isArray(newData) || newData.length === 0) {
        return;
      }
      
      try {
        // 尝试安全复制数据，检测循环引用
        const safeCopy = safeDeepClone(newData);
        // 成功则没问题
      } catch (error) {
        console.error("[表格组件] 检测到表格数据可能存在循环引用:", error);
      }
    },
    { immediate: true, deep: true }
  );
}); 