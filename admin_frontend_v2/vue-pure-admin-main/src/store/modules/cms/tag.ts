import { defineStore } from "pinia";
import { store } from "../../utils";
import type { TagState, Tag, TagListItem } from "../../../../types/cms/tag";
import { 
  getTags, 
  getTagById, 
  createTag, 
  updateTag, 
  deleteTag 
} from "@/api/cms/tag";

export const useTagStore = defineStore("tag", {
  state: (): TagState => ({
    tags: [],
    total: 0,
    loading: false,
    currentTag: null
  }),
  getters: {
    getTagById: state => (id: number): TagListItem | undefined => {
      return state.tags.find(tag => tag.id === id);
    }
  },
  actions: {
    /** 获取标签列表 */
    async fetchTags(params: any = {}) {
      this.loading = true;
      try {
        const { data } = await getTags(params);
        if (data) {
          this.tags = data.list;
          this.total = data.total;
          return data;
        }
        return null;
      } catch (error) {
        console.error("获取标签列表失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 获取标签详情 */
    async fetchTagDetail(id: number) {
      this.loading = true;
      try {
        const { data } = await getTagById(id);
        if (data) {
          this.currentTag = data;
          return data;
        }
        return null;
      } catch (error) {
        console.error("获取标签详情失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 创建标签 */
    async createTag(tagData: any) {
      this.loading = true;
      try {
        const result = await createTag(tagData);
        return result;
      } catch (error) {
        console.error("创建标签失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 更新标签 */
    async updateTag(id: number, tagData: any) {
      this.loading = true;
      try {
        const result = await updateTag(id, tagData);
        if (result.success) {
          // 更新标签信息
          const index = this.tags.findIndex(tag => tag.id === id);
          if (index !== -1) {
            this.tags[index] = { ...this.tags[index], ...tagData };
          }
        }
        return result;
      } catch (error) {
        console.error("更新标签失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 删除标签 */
    async deleteTag(id: number) {
      this.loading = true;
      try {
        const result = await deleteTag(id);
        if (result.success) {
          // 删除成功后更新列表
          this.tags = this.tags.filter(tag => tag.id !== id);
        }
        return result;
      } catch (error) {
        console.error("删除标签失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 重置状态 */
    resetState() {
      this.tags = [];
      this.total = 0;
      this.currentTag = null;
    }
  }
});

export function useTagStoreHook() {
  return useTagStore(store);
} 