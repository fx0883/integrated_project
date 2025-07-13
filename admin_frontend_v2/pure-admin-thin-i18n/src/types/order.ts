/**
 * 订单管理相关类型定义
 */

// 订单支付状态
export type PaymentStatus = "paid" | "unpaid" | "partial" | "refunded" | "cancelled";

// 发票状态
export type InvoiceStatus = "issued" | "pending" | "not_required";

// 服务类型
export type ServiceType = "文档翻译" | "口译服务" | "校对服务" | "本地化服务" | "其他";

// 订单基本信息接口
export interface Order {
  id: number;                 // 订单ID
  order_number: string;       // 订单编号，自动生成，格式如：PQ-202507-1234
  created_at: string;         // 创建时间
  updated_at: string;         // 更新时间
  is_deleted: boolean;        // 是否删除（软删除标记）
  
  // 客户关联信息
  customer: number;           // 客户ID
  customer_name: string;      // 客户名称（冗余字段，便于显示）
  customer_contact?: number;  // 联系人ID
  customer_contact_info?: {   // 联系人信息（冗余对象，便于显示）
    id: number;
    username: string;
    display_name: string;
    phone: string;
    email: string;
  };
  
  // 创建者信息
  created_by_info?: {         // 创建者信息
    id: number;
    username: string;
    display_name: string;
  };
  
  // 订单业务信息
  source_platform?: string;   // 来源平台，如"官网"、"邮件咨询"等
  project_manager?: string;   // 项目负责人
  customer_type?: string;     // 客户类型，如"新客户"、"老客户"
  order_date?: string;        // 下单日期，格式：YYYY-MM-DD
  service_type: ServiceType;  // 服务类型
  service_type_display?: string; // 服务类型显示名称
  language: string;           // 语种，如"中英"、"中日"等
  customer_count: string;     // 客户数量，如"5000字"、"1天"等
  translation_count?: string; // 翻译数量
  service_time?: string;      // 服务时间，格式：YYYY-MM-DD
  project_location?: string;  // 项目地点，如"线上"、"北京"等
  
  // 价格和费用信息
  translator?: string;         // 译员姓名
  customer_price?: string;     // 客户单价，如"0.5元/字"
  customer_total_amount: string; // 客户总价
  translator_fee?: string;     // 译员费用
  translator_price?: string;   // 译员单价，如"0.25元/字"
  translator_payment_status?: string; // 译员支付状态，如"已付款"、"待付款"
  translator_payment_method?: string; // 译员支付方式，如"支付宝"、"微信"
  project_fee?: string;        // 项目费用
  project_details?: string;    // 项目明细
  cost_details?: string;       // 费用明细
  refund_amount?: string;      // 退款金额
  refund_reason?: string;      // 退款原因
  
  // 利润相关（计算字段）
  profit?: number;             // 毛利 = 客户总价 - 译员费用 - 项目费用
  profit_rate?: number;        // 毛利率 = 毛利 / 客户总价
  formatted_profit?: string;   // 格式化的毛利，如"¥600.00"
  formatted_profit_rate?: string; // 格式化的毛利率，如"30.00%"
  
  // 支付信息
  payment_status: PaymentStatus;  // 支付状态
  payment_status_display?: string; // 支付状态显示名称，如"已支付"
  payment_date?: string;       // 支付日期，格式：YYYY-MM-DD
  payment_method?: string;     // 支付方式，如"微信支付"、"支付宝"、"银行转账"
  payment_remarks?: string;    // 支付备注
  
  // 发票信息
  invoice_status?: InvoiceStatus;  // 发票状态
  invoice_status_display?: string; // 发票状态显示名称
  invoice_info?: string;       // 发票信息
  
  // 合同和地址信息
  contract_number?: string;    // 合同编号
  contract_info?: string;      // 合同信息
  contract_remarks?: string;   // 合同备注
  delivery_address?: string;   // 收件地址
  order_address?: string;      // 订单地址
  
  // 备注和其他信息
  remarks?: string;            // 备注
  follow_up_record?: string;   // 回访记录
  tenant?: number;             // 所属租户ID
  
  // 历史记录相关
  history_count?: number;      // 历史版本数量
}

// 订单列表请求参数接口
export interface OrderListParams {
  payment_status?: PaymentStatus; // 支付状态过滤
  service_type?: ServiceType;    // 服务类型过滤
  language?: string;            // 语种过滤
  customer_id?: number;         // 按客户ID筛选
  customer_type?: string;       // 按客户类型筛选
  service_time?: string;        // 服务时间筛选
  search?: string;              // 搜索关键词
  page?: number;                // 页码
  page_size?: number;           // 每页条数
  ordering?: string;            // 排序字段
  start_date?: string;          // 开始日期，格式：YYYY-MM-DD
  end_date?: string;            // 结束日期，格式：YYYY-MM-DD
}

// 创建/更新订单请求参数接口
export interface OrderCreateUpdateParams {
  customer: number;             // 客户ID
  source_platform?: string;     // 来源平台
  project_manager?: string;     // 项目负责人
  customer_type?: string;       // 客户类型
  order_date?: string;          // 下单日期
  service_type: ServiceType;    // 服务类型
  language: string;             // 语种
  customer_count: string;       // 客户数量
  translation_count?: string;   // 翻译数量
  service_time?: string;        // 服务时间
  project_location?: string;    // 项目地点
  customer_contact?: number;    // 客户联系人ID
  translator?: string;          // 译员
  customer_price?: string;      // 客户单价
  customer_total_amount: string; // 客户总价
  translator_fee?: string;      // 译员费用
  translator_price?: string;    // 翻译单价
  translator_payment_status?: string; // 译费支付状态
  translator_payment_method?: string; // 译费支付方式
  project_fee?: string;         // 项目费用
  project_details?: string;     // 项目明细
  cost_details?: string;        // 费用明细
  refund_amount?: string;       // 项目退款
  refund_reason?: string;       // 退款原因
  payment_status?: PaymentStatus; // 支付状态
  payment_date?: string;        // 支付日期
  payment_method?: string;      // 支付方式
  payment_remarks?: string;     // 支付备注
  invoice_status?: InvoiceStatus; // 发票状态
  invoice_info?: string;        // 发票信息
  contract_number?: string;     // 合同编号
  contract_info?: string;       // 合同信息
  contract_remarks?: string;    // 合同备注
  delivery_address?: string;    // 收件地址
  order_address?: string;       // 订单地址
  remarks?: string;             // 备注
  follow_up_record?: string;    // 回访记录
}

// 订单历史记录接口
export interface OrderHistory {
  id: number;                   // 历史记录ID
  order: number;                // 关联的订单ID
  version: number;              // 版本号，从1开始递增
  modified_by: number;          // 修改人ID
  modified_by_name: string;     // 修改人用户名
  modified_at: string;          // 修改时间
  change_details: string;       // 变更详情JSON字符串
  change_details_data?: {       // 变更详情解析后的对象
    action: string;             // 操作类型，如"create"、"update"
    changes?: {                 // 变更的字段
      [key: string]: {
        old: any;               // 旧值
        new: any;               // 新值
      }
    };
    message?: string;           // 消息，如"创建订单"
  };
  snapshot: string;             // 订单完整快照的JSON字符串
  snapshot_data?: Order;        // 解析后的订单快照对象
}

// 订单统计数据接口
export interface OrderStatistics {
  period: string;               // 统计周期，如"monthly"
  start_date: string;           // 开始日期
  end_date: string;             // 结束日期
  total_orders: number;         // 订单总数
  customer_total_amount: string; // 订单总金额
  total_profit: string;         // 总毛利
  average_profit_rate: number;  // 平均毛利率
  
  // 按周期分组的统计
  by_period: Array<{
    period: string;             // 周期标识，如"2025-01"
    count: number;              // 订单数量
    customer_total_amount: string; // 客户总金额
    profit: string;             // 毛利
    profit_rate: number;        // 毛利率
  }>;
  
  // 按服务类型分组的统计
  by_service_type: Array<{
    service_type: string;       // 服务类型
    count: number;              // 订单数量
    customer_total_amount: string; // 客户总金额
    profit: string;             // 毛利
    profit_rate: number;        // 毛利率
  }>;
  
  // 按支付状态分组的统计
  by_payment_status: Array<{
    payment_status: string;     // 支付状态
    count: number;              // 订单数量
    customer_total_amount: string; // 客户总金额
    profit: string;             // 毛利
    profit_rate: number;        // 毛利率
  }>;
}

// 订单提醒数据接口
export interface OrderReminders {
  count: number;                // 提醒总数
  results: Array<{
    id: number;                 // 订单ID
    order_number: string;       // 订单编号
    customer_name: string;      // 客户名称
    service_type: string;       // 服务类型
    service_time: string;       // 服务时间
    days_remaining: number;     // 剩余天数
    customer_total_amount: string; // 客户总价
    payment_status: string;     // 支付状态
    translator: string;         // 译员
    project_manager: string;    // 项目负责人
  }>;
  summary: {
    total: number;              // 总订单数
    urgent: number;             // 紧急订单数（3天内）
    paid: number;               // 已支付订单数
    unpaid: number;             // 未支付订单数
    total_amount: string;       // 总金额
  };
}

// 批量操作请求参数接口
export interface OrderBulkOperationParams {
  order_ids: number[];          // 订单ID数组
  operation_type: "update" | "delete"; // 操作类型
  data?: Partial<OrderCreateUpdateParams>; // 更新数据（仅在update操作时需要）
}

// 批量操作响应接口
export interface OrderBulkOperationResponse {
  success_count: number;        // 成功处理的记录数
  failed_count: number;         // 失败的记录数
  failed_ids?: number[];        // 失败的订单ID数组
  error_messages?: Record<string, string>; // 错误信息，键为订单ID
}

// 订单导入接口
export interface OrderImportResponse {
  total: number;                // 总记录数
  success_count: number;        // 成功导入数
  failed_count: number;         // 失败数量
  errors?: Array<{
    row: number;                // 行号
    error: string;              // 错误信息
  }>;
}

// 订单图表数据接口
export interface OrderChartData {
  labels: string[];             // 图表标签
  datasets: Array<{
    label: string;              // 数据集标签
    data: number[];             // 数据值数组
  }>;
} 