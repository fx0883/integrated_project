/**
 * 任务模板 Mock 数据
 */
const templates = [
  {
    id: 1,
    name: "每日跑步",
    description: "每天跑步30分钟",
    category: 1, // 运动
    is_system: true,
    user: null,
    reminder: true,
    reminder_time: "07:00:00",
    created_at: "2024-03-01T09:00:00Z",
    updated_at: "2024-03-01T09:00:00Z",
    translations: {
      name: {
        "en-US": "Daily Running"
      },
      description: {
        "en-US": "Run for 30 minutes every day"
      }
    }
  },
  {
    id: 2,
    name: "每日阅读",
    description: "每天阅读30分钟",
    category: 3, // 阅读
    is_system: true,
    user: null,
    reminder: true,
    reminder_time: "21:00:00",
    created_at: "2024-03-01T09:05:00Z",
    updated_at: "2024-03-01T09:05:00Z",
    translations: {
      name: {
        "en-US": "Daily Reading"
      },
      description: {
        "en-US": "Read for 30 minutes every day"
      }
    }
  },
  {
    id: 3,
    name: "每周英语学习",
    description: "每周一三五学习英语",
    category: 2, // 学习
    is_system: true,
    user: null,
    reminder: true,
    reminder_time: "19:00:00",
    created_at: "2024-03-01T09:10:00Z",
    updated_at: "2024-03-01T09:10:00Z",
    translations: {
      name: {
        "en-US": "Weekly English Study"
      },
      description: {
        "en-US": "Study English on Monday, Wednesday, and Friday"
      }
    }
  },
  {
    id: 4,
    name: "每日冥想",
    description: "每天冥想15分钟",
    category: 4, // 冥想
    is_system: false,
    user: 1, // 李明
    reminder: true,
    reminder_time: "07:30:00",
    created_at: "2024-03-02T10:00:00Z",
    updated_at: "2024-03-02T10:00:00Z",
    translations: {
      name: {
        "en-US": "Daily Meditation"
      },
      description: {
        "en-US": "Meditate for 15 minutes every day"
      }
    }
  },
  {
    id: 5,
    name: "健身训练",
    description: "每周三次健身训练",
    category: 1, // 运动
    is_system: false,
    user: 1, // 李明
    reminder: true,
    reminder_time: "18:00:00",
    created_at: "2024-03-05T15:00:00Z",
    updated_at: "2024-03-05T15:00:00Z",
    translations: {
      name: {
        "en-US": "Fitness Training"
      },
      description: {
        "en-US": "Work out three times a week"
      }
    }
  }
]

export default templates 