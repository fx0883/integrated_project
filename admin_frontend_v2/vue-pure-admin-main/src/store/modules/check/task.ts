import { defineStore } from "pinia";
import { store } from "../../utils";
import type { CheckTaskState, CheckTask } from "../../../../types/check";
import { 
  getCheckTasks, 
  getCheckTaskById, 
  createCheckTask, 
  updateCheckTask, 
  deleteCheckTask,
  completeCheckTask,
  cancelCheckTask,
  getCheckTaskStatistic
} from "@/api/check";

export const useCheckTaskStore = defineStore("checkTask", {
  state: (): CheckTaskState => ({
    tasks: [],
    total: 0,
    loading: false,
    currentTask: null
  }),
  getters: {
    getTaskById: state => (id: number): CheckTask | undefined => {
      return state.tasks.find(task => task.id === id);
    },
    getTasksByCategory: state => (categoryId: number): CheckTask[] => {
      return state.tasks.filter(task => task.category_id === categoryId);
    },
    getActiveTasksCount: state => {
      return state.tasks.filter(task => task.status === "active").length;
    }
  },
  actions: {
    /** 获取打卡任务列表 */
    async fetchTasks(params: any = {}) {
      this.loading = true;
      try {
        const { data } = await getCheckTasks(params);
        if (data) {
          this.tasks = data.list;
          this.total = data.total;
          return data;
        }
        return null;
      } catch (error) {
        console.error("获取打卡任务列表失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 获取打卡任务详情 */
    async fetchTaskDetail(id: number) {
      this.loading = true;
      try {
        const result = await getCheckTaskById(id);
        if (result.success && result.data) {
          this.currentTask = result.data;
          return result.data;
        }
        return null;
      } catch (error) {
        console.error("获取打卡任务详情失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 创建打卡任务 */
    async createTask(taskData: any) {
      this.loading = true;
      try {
        const result = await createCheckTask(taskData);
        return result;
      } catch (error) {
        console.error("创建打卡任务失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 更新打卡任务 */
    async updateTask(id: number, taskData: any) {
      this.loading = true;
      try {
        const result = await updateCheckTask(id, taskData);
        if (result.success) {
          // 更新任务信息
          const index = this.tasks.findIndex(task => task.id === id);
          if (index !== -1) {
            this.tasks[index] = { ...this.tasks[index], ...taskData };
          }
          if (this.currentTask && this.currentTask.id === id) {
            this.currentTask = { ...this.currentTask, ...taskData };
          }
        }
        return result;
      } catch (error) {
        console.error("更新打卡任务失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 删除打卡任务 */
    async deleteTask(id: number) {
      this.loading = true;
      try {
        const result = await deleteCheckTask(id);
        if (result.success) {
          // 删除成功后更新列表
          this.tasks = this.tasks.filter(task => task.id !== id);
        }
        return result;
      } catch (error) {
        console.error("删除打卡任务失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 完成打卡任务 */
    async completeTask(id: number) {
      this.loading = true;
      try {
        const result = await completeCheckTask(id);
        if (result.success) {
          // 更新任务状态
          const task = this.tasks.find(task => task.id === id);
          if (task) {
            task.status = "completed";
          }
          if (this.currentTask && this.currentTask.id === id) {
            this.currentTask.status = "completed";
          }
        }
        return result;
      } catch (error) {
        console.error("完成打卡任务失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 取消打卡任务 */
    async cancelTask(id: number) {
      this.loading = true;
      try {
        const result = await cancelCheckTask(id);
        if (result.success) {
          // 更新任务状态
          const task = this.tasks.find(task => task.id === id);
          if (task) {
            task.status = "cancelled";
          }
          if (this.currentTask && this.currentTask.id === id) {
            this.currentTask.status = "cancelled";
          }
        }
        return result;
      } catch (error) {
        console.error("取消打卡任务失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 获取打卡任务统计 */
    async fetchTaskStatistic(id: number, params: any = {}) {
      try {
        const result = await getCheckTaskStatistic(id, params);
        return result;
      } catch (error) {
        console.error("获取打卡任务统计失败:", error);
        return null;
      }
    },

    /** 重置状态 */
    resetState() {
      this.tasks = [];
      this.total = 0;
      this.currentTask = null;
    }
  }
});

export function useCheckTaskStoreHook() {
  return useCheckTaskStore(store);
} 