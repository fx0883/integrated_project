# 订单模型需求确认文档

## 概述

本文档用于确认订单管理系统中的 `Order` 模型字段定义，请仔细核对以下字段是否符合业务需求。

## 基础信息

`Order` 模型继承自 `BaseModel`，自动包含以下字段：

| 字段名 | 类型 | 描述 | 备注 |
|-------|------|------|------|
| tenant | ForeignKey | 租户 | 关联到 Tenant 模型 |
| created_at | DateTimeField | 创建时间 | 自动添加 |
| updated_at | DateTimeField | 更新时间 | 自动更新 |
| is_deleted | BooleanField | 是否删除 | 默认 False |

## 订单字段详情

### 1. 订单基本信息

| 字段名 | 类型 | 描述 | 约束条件 | 默认值 |
|-------|------|------|---------|-------|
| order_number | CharField | 订单编号 | 最大长度50，唯一，不可编辑 | 自动生成 |
| customer | ForeignKey | 客户 | 关联到 Customer 模型，保护删除 | 必填 |
| status | CharField | 订单状态 | 最大长度20，选项列表 | 'draft'（草稿） |
| created_by | ForeignKey | 创建人 | 关联到 User 模型，保护删除 | 必填 |

**订单状态选项**:
- draft: 草稿
- pending: 待处理
- in_progress: 进行中
- completed: 已完成
- cancelled: 已取消

### 2. 服务和语种信息

| 字段名 | 类型 | 描述 | 约束条件 | 默认值 |
|-------|------|------|---------|-------|
| service_type | CharField | 服务类型 | 最大长度200 | 必填 |
| language_direction | CharField | 语言方向 | 最大长度50 | 必填 |
| word_count | PositiveIntegerField | 字数 | 正整数 | 0 |
| description | TextField | 项目描述 | 可空 | NULL |

### 3. 人员信息

| 字段名 | 类型 | 描述 | 约束条件 | 默认值 |
|-------|------|------|---------|-------|
| customer_contact | ForeignKey | 客户联系人 | 关联到 Member 模型，保护删除，可空 | NULL |
| translator | CharField | 译员 | 最大长度100，可空 | NULL |

### 4. 时间信息

| 字段名 | 类型 | 描述 | 约束条件 | 默认值 |
|-------|------|------|---------|-------|
| start_date | DateField | 开始日期 | 可空 | NULL |
| due_date | DateField | 截止日期 | 可空 | NULL |
| delivery_date | DateField | 交付日期 | 可空 | NULL |

### 5. 费用信息

| 字段名 | 类型 | 描述 | 约束条件 | 默认值 |
|-------|------|------|---------|-------|
| price | CharField | 单价 | 最大长度100，可空 | NULL |
| total_amount | DecimalField | 总金额 | 10位数字，2位小数 | 0 |
| translator_fee | DecimalField | 译员费用 | 10位数字，2位小数 | 0 |
| other_costs | DecimalField | 其他成本 | 10位数字，2位小数 | 0 |
| project_fee | DecimalField | 项目费用 | 10位数字，2位小数 | 0 |
| project_details | TextField | 项目明细 | 可空 | NULL |

### 6. 支付信息

| 字段名 | 类型 | 描述 | 约束条件 | 默认值 |
|-------|------|------|---------|-------|
| payment_status | CharField | 支付状态 | 最大长度50 | 'unpaid' |
| payment_date | DateField | 支付日期 | 可空 | NULL |
| payment_method | CharField | 支付方式 | 最大长度50，可空 | NULL |
| payment_remarks | TextField | 支付备注 | 可空 | NULL |

### 7. 发票和合同信息

| 字段名 | 类型 | 描述 | 约束条件 | 默认值 |
|-------|------|------|---------|-------|
| invoice_status | CharField | 发票状态 | 最大长度50 | 'not_required' |
| invoice_info | TextField | 发票信息 | 可空 | NULL |
| contract_number | CharField | 合同编号 | 最大长度100，可空 | NULL |
| contract_info | TextField | 合同信息 | 可空 | NULL |
| contract_remarks | TextField | 合同备注 | 可空 | NULL |

### 8. 其他信息

| 字段名 | 类型 | 描述 | 约束条件 | 默认值 |
|-------|------|------|---------|-------|
| remarks | TextField | 备注 | 可空 | NULL |
| tags | TextField | 标签 | 可空 | NULL |
| follow_up_record | TextField | 回访记录 | 可空 | NULL |

## 数据库索引

订单模型包含以下数据库索引以提高查询性能：

1. order_number
2. customer
3. status
4. payment_status

## 方法与功能

订单模型包含以下主要方法：

1. **save()**: 重写保存方法，自动生成订单编号
2. **_generate_order_number()**: 生成唯一的订单编号，格式：PQ-{年份}{月份}-{4位随机数}
3. **calculate_profit()**: 计算订单毛利，公式：总金额 - 译员费用 - 其他成本 - 项目费用
4. **calculate_profit_rate()**: 计算订单毛利率，公式：(总金额 - 译员费用 - 其他成本 - 项目费用) / 总金额

## 确认事项

请确认以下事项：

1. 字段定义是否完整？是否缺少必要的业务字段？
2. 字段类型是否合适？字段长度是否足够？
3. 默认值设置是否合理？
4. 关联关系是否正确？
5. 索引设置是否满足查询需求？
6. 计算逻辑是否符合业务规则？

如有任何问题或建议，请在下方提出：

_____________________________________________________________________

_____________________________________________________________________

_____________________________________________________________________

## 确认

- [ ] 我已仔细阅读并确认上述字段定义符合业务需求
- [ ] 我已提出修改建议并在文档中标注

确认人：________________    日期：________________ 