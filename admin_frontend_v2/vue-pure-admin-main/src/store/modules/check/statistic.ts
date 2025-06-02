import { defineStore } from "pinia";
import { store } from "../../utils";
import { getCheckStatistics, getCheckTaskStatistic } from "@/api/check";
import { formatResponse, handleResponse } from "@/utils/http/response";
import { message } from "@/utils/message";

interface CheckStatisticState {
  statisticData: {
    total_tasks: number;
    total_users: number;
    total_records: number;
    avg_completion_rate: number;
    daily_trend: Array<{date: string; count: number}>;
    task_list: Array<{
      task_id: number;
      task_title: string;
      category_name: string;
      total_users: number;
      total_records: number;
      completion_rate: number;
    }>;
    user_ranking: Array<{
      user_id: number;
      user_name: string;
      complete_count: number;
      completion_rate: number;
    }>;
  };
  
  taskStatistic: {
    task_id: number;
    task_title: string;
    category_name: string;
    start_date: string;
    end_date: string;
    total_users: number;
    total_records: number;
    completion_rate: number;
    daily_data: Array<{date: string; count: number}>;
    user_data: Array<{user_id: number; user_name: string; completion_rate: number}>;
  } | null;
  
  loading: boolean;
}

export const useCheckStatisticStore = defineStore("checkStatistic", {
  state: (): CheckStatisticState => ({
    statisticData: {
      total_tasks: 0,
      total_users: 0,
      total_records: 0,
      avg_completion_rate: 0,
      daily_trend: [],
      task_list: [],
      user_ranking: []
    },
    taskStatistic: null,
    loading: false
  }),
  
  getters: {
    // 获取任务列表排序（按完成率降序）
    getTaskRanking: state => {
      return [...state.statisticData.task_list].sort((a, b) => 
        b.completion_rate - a.completion_rate
      );
    },
    
    // 获取用户排名（按完成数量降序）
    getUserRanking: state => {
      return [...state.statisticData.user_ranking].sort((a, b) => 
        b.complete_count - a.complete_count
      );
    }
  },
  
  actions: {
    /** 获取整体打卡统计数据 */
    async fetchStatistics(params?: Record<string, any>) {
      this.loading = true;
      try {
        const response = await getCheckStatistics(params);
        const standardResponse = formatResponse(response);
        const data = handleResponse(standardResponse);
        
        if (data) {
          this.statisticData = {
            total_tasks: data.total_tasks || 0,
            total_users: data.total_users || 0,
            total_records: data.total_records || 0,
            avg_completion_rate: data.avg_completion_rate || 0,
            daily_trend: data.daily_trend || [],
            task_list: data.task_list || [],
            user_ranking: data.user_ranking || []
          };
          return data;
        }
        return null;
      } catch (error) {
        console.error("获取打卡统计数据失败:", error);
        message("获取打卡统计数据失败", { type: "error" });
        return null;
      } finally {
        this.loading = false;
      }
    },
    
    /** 获取单个任务统计数据 */
    async fetchTaskStatistic(taskId: number, params?: Record<string, any>) {
      this.loading = true;
      try {
        const response = await getCheckTaskStatistic(taskId, params);
        const standardResponse = formatResponse(response);
        const data = handleResponse(standardResponse);
        
        if (data) {
          this.taskStatistic = {
            task_id: data.task_id,
            task_title: data.task_title,
            category_name: data.category_name,
            start_date: data.start_date,
            end_date: data.end_date,
            total_users: data.total_users || 0,
            total_records: data.total_records || 0,
            completion_rate: data.completion_rate || 0,
            daily_data: data.daily_data || [],
            user_data: data.user_data || []
          };
          return data;
        }
        return null;
      } catch (error) {
        console.error("获取任务统计数据失败:", error);
        message("获取任务统计数据失败", { type: "error" });
        return null;
      } finally {
        this.loading = false;
      }
    },
    
    /** 重置统计数据 */
    resetStatistics() {
      this.statisticData = {
        total_tasks: 0,
        total_users: 0,
        total_records: 0,
        avg_completion_rate: 0,
        daily_trend: [],
        task_list: [],
        user_ranking: []
      };
      this.taskStatistic = null;
    }
  }
});

export function useCheckStatisticStoreHook() {
  return useCheckStatisticStore(store);
} 