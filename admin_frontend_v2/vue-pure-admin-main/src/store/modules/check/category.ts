import { defineStore } from "pinia";
import { store } from "../../utils";
import type { CheckCategoryState, CheckCategory } from "../../../../types/check";
import { 
  getCheckCategories, 
  getCheckCategoryById, 
  createCheckCategory, 
  updateCheckCategory, 
  deleteCheckCategory 
} from "@/api/check";

export const useCheckCategoryStore = defineStore("checkCategory", {
  state: (): CheckCategoryState => ({
    categories: [],
    total: 0,
    loading: false,
    currentCategory: null
  }),
  getters: {
    getCategoryById: state => (id: number): CheckCategory | undefined => {
      return state.categories.find(category => category.id === id);
    }
  },
  actions: {
    /** 获取打卡类型列表 */
    async fetchCategories(params: any = {}) {
      this.loading = true;
      try {
        const { data } = await getCheckCategories(params);
        if (data) {
          this.categories = data.list;
          this.total = data.total;
          return data;
        }
        return null;
      } catch (error) {
        console.error("获取打卡类型列表失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 获取打卡类型详情 */
    async fetchCategoryDetail(id: number) {
      this.loading = true;
      try {
        const result = await getCheckCategoryById(id);
        if (result.success && result.data) {
          this.currentCategory = result.data;
          return result.data;
        }
        return null;
      } catch (error) {
        console.error("获取打卡类型详情失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 创建打卡类型 */
    async createCategory(categoryData: any) {
      this.loading = true;
      try {
        const result = await createCheckCategory(categoryData);
        return result;
      } catch (error) {
        console.error("创建打卡类型失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 更新打卡类型 */
    async updateCategory(id: number, categoryData: any) {
      this.loading = true;
      try {
        const result = await updateCheckCategory(id, categoryData);
        if (result.success) {
          // 更新打卡类型信息
          const index = this.categories.findIndex(category => category.id === id);
          if (index !== -1) {
            this.categories[index] = { ...this.categories[index], ...categoryData };
          }
        }
        return result;
      } catch (error) {
        console.error("更新打卡类型失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 删除打卡类型 */
    async deleteCategory(id: number) {
      this.loading = true;
      try {
        const result = await deleteCheckCategory(id);
        if (result.success) {
          // 删除成功后更新列表
          this.categories = this.categories.filter(category => category.id !== id);
        }
        return result;
      } catch (error) {
        console.error("删除打卡类型失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 重置状态 */
    resetState() {
      this.categories = [];
      this.total = 0;
      this.currentCategory = null;
    }
  }
});

export function useCheckCategoryStoreHook() {
  return useCheckCategoryStore(store);
} 