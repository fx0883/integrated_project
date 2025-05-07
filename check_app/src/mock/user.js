/**
 * 用户 Mock 数据
 */
const users = [
  {
    id: 1,
    username: "liming",
    nick_name: "李明",
    parent: null,
    is_admin: true,
    is_super_admin: false,
    is_member: false,
    avatar: "/static/avatar/liming.png",
    status: "active",
    phone: "13800138000",
    email: "liming@example.com",
    date_joined: "2024-03-01T09:00:00Z",
    last_login_ip: "192.168.1.1",
    sub_accounts: [
      {
        id: 2,
        username: "xiaoming",
        nick_name: "小明",
        parent: 1,
        is_admin: false,
        is_super_admin: false,
        is_member: true,
        avatar: "/static/avatar/xiaoming.png",
        status: "active",
        phone: null,
        email: "xiaoming@example.com",
        date_joined: "2024-03-05T10:00:00Z"
      },
      {
        id: 3,
        username: "xiaohong",
        nick_name: "小红",
        parent: 1,
        is_admin: false,
        is_super_admin: false,
        is_member: true,
        avatar: "/static/avatar/xiaohong.png",
        status: "active",
        phone: null,
        email: "xiaohong@example.com",
        date_joined: "2024-03-10T14:00:00Z"
      }
    ]
  }
]

export default users 