/**
 * 菜单管理相关类型定义
 */

// 菜单项接口
export interface Menu {
  id: number;
  name: string;
  code: string;
  path: string;
  component: string;
  redirect: string | null;
  title: string;
  icon: string | null;
  extra_icon: string | null;
  rank: number;
  show_link: boolean;
  show_parent: boolean;
  roles: string[];
  auths: string[];
  keep_alive: boolean;
  frame_src: string | null;
  frame_loading: boolean;
  hidden_tag: boolean;
  dynamic_level: number | null;
  active_path: string | null;
  transition_name: string | null;
  enter_transition: string | null;
  leave_transition: string | null;
  parent_id: number | null;
  is_active: boolean;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

// 菜单树形结构接口
export interface MenuTree extends Menu {
  children: MenuTree[];
}

// 转场动画配置
export interface TransitionConfig {
  name: string;
  enterTransition?: string;
  leaveTransition?: string;
}

// 菜单列表请求参数
export interface MenuListParams {
  search?: string;         // 搜索关键词
  is_active?: boolean;     // 状态筛选
  parent_id?: number;      // 父菜单ID
  page?: number;           // 页码
  page_size?: number;      // 每页条数
}

// 菜单创建/更新参数
export interface MenuCreateUpdateParams {
  name: string;                // 菜单名称
  code: string;                // 菜单标识码
  path: string;                // 路由路径
  component: string;           // 组件路径
  redirect?: string | null;    // 重定向地址
  title?: string;              // 菜单标题
  icon?: string | null;        // 菜单图标
  extra_icon?: string | null;  // 额外图标
  rank?: number;               // 排序值
  show_link?: boolean;         // 是否显示
  show_parent?: boolean;       // 是否显示父级菜单
  roles?: string[];            // 菜单角色列表
  auths?: string[];            // 菜单权限列表
  keep_alive?: boolean;        // 是否缓存路由
  frame_src?: string | null;   // iframe链接
  frame_loading?: boolean;     // 是否显示iframe加载动画
  hidden_tag?: boolean;        // 是否隐藏标签
  dynamic_level?: number | null; // 动态路由层级
  active_path?: string | null; // 激活菜单的路径
  transition_name?: string | null; // 页面动画名称
  enter_transition?: string | null; // 进场动画
  leave_transition?: string | null; // 离场动画
  parent_id?: number | null;   // 父级菜单ID
  is_active?: boolean;         // 是否启用
  remarks?: string | null;     // 备注信息
} 