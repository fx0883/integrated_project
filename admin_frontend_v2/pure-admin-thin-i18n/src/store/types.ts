import type { RouteRecordName } from "vue-router";

export type cacheType = {
  mode: string;
  name?: RouteRecordName;
};

export type positionType = {
  startIndex?: number;
  length?: number;
};

export type appType = {
  sidebar: {
    opened: boolean;
    withoutAnimation: boolean;
    // 判断是否手动点击Collapse
    isClickCollapse: boolean;
  };
  layout: string;
  device: string;
  viewportSize: { width: number; height: number };
};

export type multiType = {
  path: string;
  name: string;
  meta: any;
  query?: object;
  params?: object;
};

export type setType = {
  title: string;
  fixedHeader: boolean;
  hiddenSideBar: boolean;
};

export type userType = {
  id?: number;
  avatar?: string;
  username?: string;
  nickname?: string;
  email?: string;
  is_admin?: boolean;
  is_super_admin?: boolean;
  is_member?: boolean;
  phone?: string;
  status?: string;
  last_login_ip?: string;
  tenant?: number;
  parent?: number;
  roles?: Array<string>;
  permissions?: Array<string>;
  isRemembered?: boolean;
  loginDay?: number;
  loading?: {
    getCurrentAdmin: boolean;
    updateCurrentAdmin: boolean;
  };
};
