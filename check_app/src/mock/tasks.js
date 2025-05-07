/**
 * 打卡任务 Mock 数据
 */
const tasks = [
  {
    id: 1,
    name: "晨跑",
    description: "每天早上6点跑步3公里",
    category: 1, // 运动
    user: 1, // 李明
    start_date: "2024-05-01",
    end_date: "2024-06-30",
    status: "active",
    reminder: true,
    reminder_time: "06:00:00",
    frequency_type: "daily",
    frequency_days: [],
    created_at: "2024-04-30T10:00:00Z",
    updated_at: "2024-04-30T10:00:00Z"
  },
  {
    id: 2,
    name: "读书",
    description: "每天阅读30分钟",
    category: 3, // 阅读
    user: 1, // 李明
    start_date: "2024-05-01",
    end_date: null,
    status: "active",
    reminder: true,
    reminder_time: "21:00:00",
    frequency_type: "daily",
    frequency_days: [],
    created_at: "2024-04-30T11:00:00Z",
    updated_at: "2024-04-30T11:00:00Z"
  },
  {
    id: 3,
    name: "冥想",
    description: "早晚各15分钟冥想",
    category: 4, // 冥想
    user: 1, // 李明
    start_date: "2024-05-01",
    end_date: null,
    status: "active",
    reminder: true,
    reminder_time: "07:00:00",
    frequency_type: "daily",
    frequency_days: [],
    created_at: "2024-05-01T08:00:00Z",
    updated_at: "2024-05-01T08:00:00Z"
  },
  {
    id: 4,
    name: "英语口语",
    description: "练习英语口语",
    category: 2, // 学习
    user: 1, // 李明
    start_date: "2024-05-01",
    end_date: null,
    status: "active",
    reminder: true,
    reminder_time: "19:00:00",
    frequency_type: "weekly",
    frequency_days: [1, 3, 5], // 周一、周三、周五
    created_at: "2024-05-01T14:00:00Z",
    updated_at: "2024-05-01T14:00:00Z"
  },
  {
    id: 5,
    name: "写日记",
    description: "记录每天的感悟",
    category: 3, // 阅读
    user: 1, // 李明
    start_date: "2024-05-01",
    end_date: null,
    status: "active",
    reminder: true,
    reminder_time: "22:00:00",
    frequency_type: "daily",
    frequency_days: [],
    created_at: "2024-05-02T09:00:00Z",
    updated_at: "2024-05-02T09:00:00Z"
  },
  {
    id: 6,
    name: "八杯水",
    description: "每天喝够八杯水",
    category: 6, // 喝水
    user: 1, // 李明
    start_date: "2024-05-01",
    end_date: null,
    status: "active",
    reminder: true,
    reminder_time: "09:00:00",
    frequency_type: "daily",
    frequency_days: [],
    created_at: "2024-05-05T10:00:00Z",
    updated_at: "2024-05-05T10:00:00Z"
  },
  {
    id: 7,
    name: "记账",
    description: "记录每日收支",
    category: 5, // 记账
    user: 1, // 李明
    start_date: "2024-05-01",
    end_date: null,
    status: "active",
    reminder: true,
    reminder_time: "21:30:00",
    frequency_type: "daily",
    frequency_days: [],
    created_at: "2024-05-06T16:00:00Z",
    updated_at: "2024-05-06T16:00:00Z"
  },
  {
    id: 8,
    name: "数学作业",
    description: "完成数学作业",
    category: 2, // 学习
    user: 2, // 小明
    start_date: "2024-05-01",
    end_date: "2024-06-30",
    status: "active",
    reminder: true,
    reminder_time: "18:00:00",
    frequency_type: "weekly",
    frequency_days: [1, 2, 3, 4, 5], // 周一至周五
    created_at: "2024-05-01T09:00:00Z",
    updated_at: "2024-05-01T09:00:00Z"
  },
  {
    id: 9,
    name: "钢琴练习",
    description: "每天练习钢琴30分钟",
    category: 2, // 学习
    user: 3, // 小红
    start_date: "2024-05-01",
    end_date: null,
    status: "active",
    reminder: true,
    reminder_time: "17:00:00",
    frequency_type: "daily",
    frequency_days: [],
    created_at: "2024-05-01T10:00:00Z",
    updated_at: "2024-05-01T10:00:00Z"
  }
]

export default tasks 