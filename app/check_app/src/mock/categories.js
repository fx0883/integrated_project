/**
 * 打卡类型 Mock 数据
 */
const categories = [
  {
    id: 1,
    name: "运动",
    description: "每日锻炼身体",
    is_system: true,
    icon: "medal",
    user: null,
    created_at: "2024-03-01T08:00:00Z",
    updated_at: "2024-03-01T08:00:00Z",
    translations: {
      name: {
        "en-US": "Exercise"
      },
      description: {
        "en-US": "Daily physical exercise"
      }
    }
  },
  {
    id: 2,
    name: "学习",
    description: "提升知识和技能",
    is_system: true,
    icon: "bookmark",
    user: null,
    created_at: "2024-03-01T08:05:00Z",
    updated_at: "2024-03-01T08:05:00Z",
    translations: {
      name: {
        "en-US": "Study"
      },
      description: {
        "en-US": "Improve knowledge and skills"
      }
    }
  },
  {
    id: 3,
    name: "阅读",
    description: "培养阅读习惯",
    is_system: true,
    icon: "book",
    user: null,
    created_at: "2024-03-01T08:10:00Z",
    updated_at: "2024-03-01T08:10:00Z",
    translations: {
      name: {
        "en-US": "Reading"
      },
      description: {
        "en-US": "Develop reading habits"
      }
    }
  },
  {
    id: 4,
    name: "冥想",
    description: "减压放松心情",
    is_system: false,
    icon: "heart",
    user: 1,
    created_at: "2024-03-02T09:00:00Z",
    updated_at: "2024-03-02T09:00:00Z",
    translations: {
      name: {
        "en-US": "Meditation"
      },
      description: {
        "en-US": "Relax and reduce stress"
      }
    }
  },
  {
    id: 5,
    name: "记账",
    description: "记录每日收支",
    is_system: false,
    icon: "wallet",
    user: 1,
    created_at: "2024-03-03T10:00:00Z",
    updated_at: "2024-03-03T10:00:00Z",
    translations: {
      name: {
        "en-US": "Accounting"
      },
      description: {
        "en-US": "Record daily income and expenses"
      }
    }
  },
  {
    id: 6,
    name: "喝水",
    description: "保持身体水分",
    is_system: false,
    icon: "water",
    user: 1,
    created_at: "2024-03-05T14:00:00Z",
    updated_at: "2024-03-05T14:00:00Z",
    translations: {
      name: {
        "en-US": "Drinking Water"
      },
      description: {
        "en-US": "Stay hydrated"
      }
    }
  }
]

export default categories 