import { defineStore } from "pinia";
import { store } from "../../utils";
import type { CheckRecordState, CheckRecord } from "../../../../types/check";
import { 
  getCheckRecords, 
  getCheckRecordById, 
  createCheckRecord, 
  reviewCheckRecord, 
  deleteCheckRecord 
} from "@/api/check";

export const useCheckRecordStore = defineStore("checkRecord", {
  state: (): CheckRecordState => ({
    records: [],
    total: 0,
    loading: false,
    currentRecord: null
  }),
  getters: {
    getRecordById: state => (id: number): CheckRecord | undefined => {
      return state.records.find(record => record.id === id);
    },
    getRecordsByTask: state => (taskId: number): CheckRecord[] => {
      return state.records.filter(record => record.task_id === taskId);
    },
    getRecordsByUser: state => (userId: number): CheckRecord[] => {
      return state.records.filter(record => record.user_id === userId);
    }
  },
  actions: {
    /** 获取打卡记录列表 */
    async fetchRecords(params: any = {}) {
      this.loading = true;
      try {
        const { data } = await getCheckRecords(params);
        if (data) {
          this.records = data.list;
          this.total = data.total;
          return data;
        }
        return null;
      } catch (error) {
        console.error("获取打卡记录列表失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 获取打卡记录详情 */
    async fetchRecordDetail(id: number) {
      this.loading = true;
      try {
        const result = await getCheckRecordById(id);
        if (result.success && result.data) {
          this.currentRecord = result.data;
          return result.data;
        }
        return null;
      } catch (error) {
        console.error("获取打卡记录详情失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 创建打卡记录 */
    async createRecord(recordData: any) {
      this.loading = true;
      try {
        const result = await createCheckRecord(recordData);
        return result;
      } catch (error) {
        console.error("创建打卡记录失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 审核打卡记录 */
    async reviewRecord(id: number, status: 'approved' | 'rejected', comment?: string) {
      this.loading = true;
      try {
        const result = await reviewCheckRecord(id, status, comment);
        if (result.success) {
          // 更新记录状态
          const record = this.records.find(record => record.id === id);
          if (record) {
            record.status = status;
          }
          if (this.currentRecord && this.currentRecord.id === id) {
            this.currentRecord.status = status;
          }
        }
        return result;
      } catch (error) {
        console.error("审核打卡记录失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 删除打卡记录 */
    async deleteRecord(id: number) {
      this.loading = true;
      try {
        const result = await deleteCheckRecord(id);
        if (result.success) {
          // 删除成功后更新列表
          this.records = this.records.filter(record => record.id !== id);
        }
        return result;
      } catch (error) {
        console.error("删除打卡记录失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 重置状态 */
    resetState() {
      this.records = [];
      this.total = 0;
      this.currentRecord = null;
    }
  }
});

export function useCheckRecordStoreHook() {
  return useCheckRecordStore(store);
} 