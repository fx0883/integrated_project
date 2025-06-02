import { defineStore } from "pinia";
import { store } from "../../utils";
import type { CategoryState, CategoryDetail, CategoryListItem } from "../../../../types/cms/category";
import { 
  getCategories, 
  getCategoryById, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from "@/api/cms/category";

export const useCategoryStore = defineStore("category", {
  state: (): CategoryState => ({
    categories: [],
    total: 0,
    loading: false,
    currentCategory: null
  }),
  getters: {
    getCategoryById: state => (id: number): CategoryListItem | undefined => {
      return state.categories.find(category => category.id === id);
    },
    getRootCategories: state => {
      return state.categories.filter(category => !category.parent_id);
    },
    getChildCategories: state => (parentId: number) => {
      return state.categories.filter(category => category.parent_id === parentId);
    }
  },
  actions: {
    /** 获取分类列表 */
    async fetchCategories(params: any = {}) {
      this.loading = true;
      try {
        const { data } = await getCategories(params);
        if (data) {
          this.categories = data.list;
          this.total = data.total;
          return data;
        }
        return null;
      } catch (error) {
        console.error("获取分类列表失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 获取分类详情 */
    async fetchCategoryDetail(id: number) {
      this.loading = true;
      try {
        const { data } = await getCategoryById(id);
        if (data) {
          this.currentCategory = data;
          return data;
        }
        return null;
      } catch (error) {
        console.error("获取分类详情失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 创建分类 */
    async createCategory(categoryData: any) {
      this.loading = true;
      try {
        const result = await createCategory(categoryData);
        return result;
      } catch (error) {
        console.error("创建分类失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 更新分类 */
    async updateCategory(id: number, categoryData: any) {
      this.loading = true;
      try {
        const result = await updateCategory(id, categoryData);
        if (result.success) {
          // 更新分类信息
          const index = this.categories.findIndex(category => category.id === id);
          if (index !== -1) {
            this.categories[index] = { ...this.categories[index], ...categoryData };
          }
        }
        return result;
      } catch (error) {
        console.error("更新分类失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 删除分类 */
    async deleteCategory(id: number) {
      this.loading = true;
      try {
        const result = await deleteCategory(id);
        if (result.success) {
          // 删除成功后更新列表
          this.categories = this.categories.filter(category => category.id !== id);
        }
        return result;
      } catch (error) {
        console.error("删除分类失败:", error);
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

export function useCategoryStoreHook() {
  return useCategoryStore(store);
} 