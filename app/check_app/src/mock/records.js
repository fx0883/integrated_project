/**
 * 打卡记录 Mock 数据
 */
import { formatDate } from '@/utils/date'

// 获取今天的日期
const today = new Date()
const yesterday = new Date(today)
yesterday.setDate(yesterday.getDate() - 1)
const dayBeforeYesterday = new Date(today)
dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2)

// 格式化为 YYYY-MM-DD
const todayStr = formatDate(today)
const yesterdayStr = formatDate(yesterday)
const dayBeforeYesterdayStr = formatDate(dayBeforeYesterday)

const records = [
  {
    id: 1,
    task: 1, // 晨跑
    user: 1, // 李明
    check_date: todayStr,
    check_time: "06:15:00",
    remarks: "今天跑了3.2公里，感觉很好",
    comment: "",
    completion_time: "06:45:00",
    created_at: `${todayStr}T06:45:00Z`
  },
  {
    id: 2,
    task: 2, // 读书
    user: 1, // 李明
    check_date: todayStr,
    check_time: "21:10:00",
    remarks: "今天读了《三体》第5章",
    comment: "",
    completion_time: "21:45:00",
    created_at: `${todayStr}T21:45:00Z`
  },
  {
    id: 3,
    task: 3, // 冥想
    user: 1, // 李明
    check_date: todayStr,
    check_time: "07:05:00",
    remarks: "早上冥想15分钟，晚上待完成",
    comment: "",
    completion_time: "07:20:00",
    created_at: `${todayStr}T07:20:00Z`
  },
  {
    id: 4,
    task: 1, // 晨跑
    user: 1, // 李明
    check_date: yesterdayStr,
    check_time: "06:05:00",
    remarks: "昨天跑了3.5公里，比平时多一点",
    comment: "",
    completion_time: "06:40:00",
    created_at: `${yesterdayStr}T06:40:00Z`
  },
  {
    id: 5,
    task: 2, // 读书
    user: 1, // 李明
    check_date: yesterdayStr,
    check_time: "21:15:00",
    remarks: "昨天读了《三体》第4章",
    comment: "",
    completion_time: "21:50:00",
    created_at: `${yesterdayStr}T21:50:00Z`
  },
  {
    id: 6,
    task: 3, // 冥想
    user: 1, // 李明
    check_date: yesterdayStr,
    check_time: "07:00:00",
    remarks: "早晚各冥想15分钟",
    comment: "",
    completion_time: "07:15:00",
    created_at: `${yesterdayStr}T07:15:00Z`
  },
  {
    id: 7,
    task: 3, // 冥想
    user: 1, // 李明
    check_date: yesterdayStr,
    check_time: "22:00:00",
    remarks: "晚上冥想完成",
    comment: "",
    completion_time: "22:15:00",
    created_at: `${yesterdayStr}T22:15:00Z`
  },
  {
    id: 8,
    task: 1, // 晨跑
    user: 1, // 李明
    check_date: dayBeforeYesterdayStr,
    check_time: "06:10:00",
    remarks: "前天跑了3公里",
    comment: "",
    completion_time: "06:45:00",
    created_at: `${dayBeforeYesterdayStr}T06:45:00Z`
  },
  {
    id: 9,
    task: 4, // 英语口语
    user: 1, // 李明
    check_date: dayBeforeYesterdayStr,
    check_time: "19:05:00",
    remarks: "练习了30分钟英语口语",
    comment: "",
    completion_time: "19:40:00",
    created_at: `${dayBeforeYesterdayStr}T19:40:00Z`
  },
  {
    id: 10,
    task: 8, // 数学作业
    user: 2, // 小明
    check_date: yesterdayStr,
    check_time: "18:30:00",
    remarks: "完成了今天的数学作业",
    comment: "进步很大",
    completion_time: "19:30:00",
    created_at: `${yesterdayStr}T19:30:00Z`
  },
  {
    id: 11,
    task: 9, // 钢琴练习
    user: 3, // 小红
    check_date: yesterdayStr,
    check_time: "17:10:00",
    remarks: "练习了《小星星》和《致爱丽丝》",
    comment: "弹得很好",
    completion_time: "17:45:00",
    created_at: `${yesterdayStr}T17:45:00Z`
  },
  {
    id: 12,
    task: 9, // 钢琴练习
    user: 3, // 小红
    check_date: todayStr,
    check_time: "17:05:00",
    remarks: "今天练习了《月光》",
    comment: "",
    completion_time: "17:40:00",
    created_at: `${todayStr}T17:40:00Z`
  }
]

export default records 