# 水产养殖系统数据库模型

本文档描述了水产养殖系统的数据库表结构设计，作为系统开发的基础模型。系统已集成到多租户架构中，通过租户ID字段实现数据隔离。

## 数据库表结构概览

| 序号 | 表名 | 描述 |
|------|------|------|
| 1 | 池塘信息表(ponds) | 记录养殖池塘的基本信息 |
| 2 | 水质监测表(water_quality) | 记录水质监测数据 |
| 3 | 投喂记录表(feeding_records) | 记录日常投喂情况 |
| 4 | 生长记录表(growth_records) | 记录养殖品种的生长情况 |
| 5 | 病害防治表(disease_prevention) | 记录疾病防治情况 |
| 6 | 药品管理表(medicines) | 记录药品使用和库存 |
| 7 | 设备管理表(equipment) | 记录养殖设备信息 |
| 8 | 生产批次表(production_batches) | 记录养殖批次信息 |
| 9 | 销售记录表(sales_records) | 记录产品销售情况 |
| 10 | 成本记录表(cost_records) | 记录养殖成本信息 |
| 11 | 养殖品种表(species) | 记录养殖的品种信息 |
| 12 | 饲料管理表(feeds) | 记录饲料使用和库存 |
| 13 | 环境监测表(environment_monitoring) | 记录养殖环境监测数据 |
| 14 | 角色表(roles) | 定义系统角色 |
| 15 | 权限表(permissions) | 定义系统权限 |
| 16 | 角色权限关联表(role_permissions) | 关联角色和权限 |
| 17 | 用户角色关联表(user_roles) | 关联用户和角色 |
| 18 | 操作日志表(operation_logs) | 记录系统操作日志 |

## 多租户集成说明

系统采用共享数据库、共享架构(Shared Database, Shared Schema)的多租户架构模式：

1. 所有表都包含`tenant_id`字段，用于关联到租户表
2. 每个租户只能访问和管理自己的数据
3. 用户通过系统现有的用户管理模块管理，不再单独设计用户表
4. 表中的`created_by`字段关联到系统用户表的ID
5. 角色和权限系统支持多租户隔离，每个租户可以有自己的角色定义

## 表结构详细设计

### 1. 池塘信息表 (ponds)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | BIGINT UNSIGNED | 池塘ID | 主键, 自增 |
| tenant_id | BIGINT UNSIGNED | 租户ID | 外键, 非空 |
| name | VARCHAR(50) | 池塘名称 | 非空 |
| area | DECIMAL(10,2) | 面积(亩) | 非空 |
| depth | DECIMAL(5,2) | 深度(米) | 非空 |
| location | VARCHAR(255) | 位置描述 | |
| pond_type | VARCHAR(50) | 池塘类型 | |
| status | TINYINT UNSIGNED | 使用状态 | 非空, 默认1(使用中) |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间, ON UPDATE当前时间 |
| created_by | BIGINT UNSIGNED | 创建人ID | 外键, 非空, 关联用户表 |
| updated_by | BIGINT UNSIGNED | 更新人ID | 外键, 关联用户表 |

### 2. 水质监测表 (water_quality)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | BIGINT UNSIGNED | 记录ID | 主键, 自增 |
| tenant_id | BIGINT UNSIGNED | 租户ID | 外键, 非空 |
| pond_id | BIGINT UNSIGNED | 池塘ID | 外键, 非空 |
| test_time | TIMESTAMP | 检测时间 | 非空 |
| temperature | DECIMAL(5,2) | 水温(℃) | |
| ph | DECIMAL(4,2) | pH值 | |
| dissolved_oxygen | DECIMAL(5,2) | 溶解氧(mg/L) | |
| ammonia_nitrogen | DECIMAL(5,2) | 氨氮(mg/L) | |
| nitrite | DECIMAL(5,2) | 亚硝酸盐(mg/L) | |
| transparency | DECIMAL(5,2) | 透明度(cm) | |
| remark | TEXT | 备注 | |
| created_by | BIGINT UNSIGNED | 记录人ID | 外键, 非空, 关联用户表 |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间, ON UPDATE当前时间 |
| updated_by | BIGINT UNSIGNED | 更新人ID | 外键, 关联用户表 |

### 3. 投喂记录表 (feeding_records)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | BIGINT UNSIGNED | 记录ID | 主键, 自增 |
| tenant_id | BIGINT UNSIGNED | 租户ID | 外键, 非空 |
| pond_id | BIGINT UNSIGNED | 池塘ID | 外键, 非空 |
| feed_id | BIGINT UNSIGNED | 饲料ID | 外键, 非空 |
| batch_id | BIGINT UNSIGNED | 批次ID | 外键, 非空 |
| feeding_time | TIMESTAMP | 投喂时间 | 非空 |
| feeding_amount | DECIMAL(10,2) | 投喂量(kg) | 非空 |
| feeding_method | VARCHAR(50) | 投喂方式 | |
| remark | TEXT | 备注 | |
| created_by | BIGINT UNSIGNED | 记录人ID | 外键, 非空, 关联用户表 |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间, ON UPDATE当前时间 |
| updated_by | BIGINT UNSIGNED | 更新人ID | 外键, 关联用户表 |

### 4. 生长记录表 (growth_records)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | BIGINT UNSIGNED | 记录ID | 主键, 自增 |
| tenant_id | BIGINT UNSIGNED | 租户ID | 外键, 非空 |
| pond_id | BIGINT UNSIGNED | 池塘ID | 外键, 非空 |
| batch_id | BIGINT UNSIGNED | 批次ID | 外键, 非空 |
| species_id | BIGINT UNSIGNED | 品种ID | 外键, 非空 |
| sample_time | TIMESTAMP | 取样时间 | 非空 |
| sample_count | INT UNSIGNED | 取样数量 | 非空 |
| avg_weight | DECIMAL(8,2) | 平均体重(g) | 非空 |
| avg_length | DECIMAL(8,2) | 平均体长(cm) | |
| survival_rate | DECIMAL(5,2) | 存活率(%) | |
| health_status | VARCHAR(50) | 健康状况 | |
| remark | TEXT | 备注 | |
| created_by | BIGINT UNSIGNED | 记录人ID | 外键, 非空, 关联用户表 |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间, ON UPDATE当前时间 |
| updated_by | BIGINT UNSIGNED | 更新人ID | 外键, 关联用户表 |

### 5. 病害防治表 (disease_prevention)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | BIGINT UNSIGNED | 记录ID | 主键, 自增 |
| tenant_id | BIGINT UNSIGNED | 租户ID | 外键, 非空 |
| pond_id | BIGINT UNSIGNED | 池塘ID | 外键, 非空 |
| batch_id | BIGINT UNSIGNED | 批次ID | 外键, 非空 |
| disease_name | VARCHAR(100) | 疾病名称 | 非空 |
| symptom | TEXT | 症状描述 | |
| treatment_method | TEXT | 治疗方法 | |
| medicine_id | BIGINT UNSIGNED | 药品ID | 外键 |
| dosage | DECIMAL(8,2) | 用药剂量 | |
| unit | VARCHAR(20) | 剂量单位 | |
| treatment_time | TIMESTAMP | 治疗时间 | 非空 |
| treatment_result | VARCHAR(50) | 治疗结果 | |
| remark | TEXT | 备注 | |
| created_by | BIGINT UNSIGNED | 记录人ID | 外键, 非空, 关联用户表 |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间, ON UPDATE当前时间 |
| updated_by | BIGINT UNSIGNED | 更新人ID | 外键, 关联用户表 |

### 6. 药品管理表 (medicines)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | BIGINT UNSIGNED | 药品ID | 主键, 自增 |
| tenant_id | BIGINT UNSIGNED | 租户ID | 外键, 非空 |
| name | VARCHAR(100) | 药品名称 | 非空 |
| category | VARCHAR(50) | 类别 | |
| specification | VARCHAR(100) | 规格 | |
| manufacturer | VARCHAR(100) | 生产厂家 | |
| batch_number | VARCHAR(50) | 批号 | |
| production_date | DATE | 生产日期 | |
| expiry_date | DATE | 有效期 | |
| stock_quantity | DECIMAL(10,2) | 库存数量 | 非空, 默认0 |
| unit | VARCHAR(20) | 单位 | 非空 |
| price | DECIMAL(10,2) | 单价 | |
| remark | TEXT | 备注 | |
| created_by | BIGINT UNSIGNED | 创建人ID | 外键, 非空, 关联用户表 |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间, ON UPDATE当前时间 |
| updated_by | BIGINT UNSIGNED | 更新人ID | 外键, 关联用户表 |

### 7. 设备管理表 (equipment)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | BIGINT UNSIGNED | 设备ID | 主键, 自增 |
| tenant_id | BIGINT UNSIGNED | 租户ID | 外键, 非空 |
| name | VARCHAR(100) | 设备名称 | 非空 |
| equipment_type | VARCHAR(50) | 设备类型 | 非空 |
| model | VARCHAR(50) | 型号 | |
| serial_number | VARCHAR(50) | 序列号 | |
| purchase_date | DATE | 购买日期 | |
| warranty_period | INT UNSIGNED | 保修期(月) | |
| supplier | VARCHAR(100) | 供应商 | |
| status | TINYINT UNSIGNED | 状态 | 非空, 默认1(正常) |
| location | VARCHAR(100) | 安装位置 | |
| maintenance_cycle | INT UNSIGNED | 维护周期(天) | |
| last_maintenance_time | TIMESTAMP | 上次维护时间 | |
| next_maintenance_time | TIMESTAMP | 下次维护时间 | |
| remark | TEXT | 备注 | |
| created_by | BIGINT UNSIGNED | 创建人ID | 外键, 非空, 关联用户表 |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间, ON UPDATE当前时间 |
| updated_by | BIGINT UNSIGNED | 更新人ID | 外键, 关联用户表 |

### 8. 生产批次表 (production_batches)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | BIGINT UNSIGNED | 批次ID | 主键, 自增 |
| tenant_id | BIGINT UNSIGNED | 租户ID | 外键, 非空 |
| batch_number | VARCHAR(50) | 批次编号 | 非空, 同一租户内唯一 |
| pond_id | BIGINT UNSIGNED | 池塘ID | 外键, 非空 |
| species_id | BIGINT UNSIGNED | 品种ID | 外键, 非空 |
| start_date | DATE | 开始日期 | 非空 |
| expected_end_date | DATE | 预计结束日期 | |
| actual_end_date | DATE | 实际结束日期 | |
| initial_quantity | INT UNSIGNED | 初始数量 | 非空 |
| initial_avg_weight | DECIMAL(8,2) | 初始平均体重(g) | |
| source | VARCHAR(100) | 来源 | |
| status | VARCHAR(20) | 状态 | 非空, 默认'active' |
| remark | TEXT | 备注 | |
| created_by | BIGINT UNSIGNED | 创建人ID | 外键, 非空, 关联用户表 |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间, ON UPDATE当前时间 |
| updated_by | BIGINT UNSIGNED | 更新人ID | 外键, 关联用户表 |

### 9. 销售记录表 (sales_records)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | BIGINT UNSIGNED | 记录ID | 主键, 自增 |
| tenant_id | BIGINT UNSIGNED | 租户ID | 外键, 非空 |
| batch_id | BIGINT UNSIGNED | 批次ID | 外键, 非空 |
| sale_date | DATE | 销售日期 | 非空 |
| quantity | DECIMAL(10,2) | 销售数量 | 非空 |
| unit | VARCHAR(20) | 单位 | 非空 |
| unit_price | DECIMAL(10,2) | 单价 | 非空 |
| total_amount | DECIMAL(12,2) | 总金额 | 非空 |
| customer | VARCHAR(100) | 客户 | |
| contact | VARCHAR(50) | 联系方式 | |
| payment_method | VARCHAR(50) | 支付方式 | |
| payment_status | VARCHAR(20) | 支付状态 | 非空, 默认'unpaid' |
| remark | TEXT | 备注 | |
| created_by | BIGINT UNSIGNED | 记录人ID | 外键, 非空, 关联用户表 |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间, ON UPDATE当前时间 |
| updated_by | BIGINT UNSIGNED | 更新人ID | 外键, 关联用户表 |

### 10. 成本记录表 (cost_records)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | BIGINT UNSIGNED | 记录ID | 主键, 自增 |
| tenant_id | BIGINT UNSIGNED | 租户ID | 外键 |
| batch_id | BIGINT UNSIGNED | 批次ID | 外键 |
| pond_id | BIGINT UNSIGNED | 池塘ID | 外键 |
| cost_type | VARCHAR(50) | 成本类型 | 非空 |
| cost_date | DATE | 成本发生日期 | 非空 |
| amount | DECIMAL(12,2) | 金额 | 非空 |
| description | VARCHAR(255) | 描述 | |
| invoice_number | VARCHAR(50) | 发票号 | |
| remark | TEXT | 备注 | |
| created_by | BIGINT UNSIGNED | 记录人ID | 外键, 关联用户表 |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间, ON UPDATE当前时间 |
| updated_by | BIGINT UNSIGNED | 更新人ID | 外键, 关联用户表 |

### 11. 养殖品种表 (species)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | BIGINT UNSIGNED | 品种ID | 主键, 自增 |
| tenant_id | BIGINT UNSIGNED | 租户ID | 外键, 非空 |
| name | VARCHAR(100) | 品种名称 | 非空 |
| scientific_name | VARCHAR(100) | 学名 | |
| category | VARCHAR(50) | 类别 | |
| growth_cycle | INT UNSIGNED | 生长周期(天) | |
| suitable_temperature | VARCHAR(50) | 适宜温度范围 | |
| suitable_ph | VARCHAR(50) | 适宜pH值范围 | |
| feeding_habits | TEXT | 饮食习性 | |
| disease_resistance | VARCHAR(50) | 抗病性 | |
| market_value | VARCHAR(100) | 市场价值 | |
| remark | TEXT | 备注 | |
| created_by | BIGINT UNSIGNED | 创建人ID | 外键, 非空, 关联用户表 |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间, ON UPDATE当前时间 |
| updated_by | BIGINT UNSIGNED | 更新人ID | 外键, 关联用户表 |

### 12. 饲料管理表 (feeds)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | BIGINT UNSIGNED | 饲料ID | 主键, 自增 |
| tenant_id | BIGINT UNSIGNED | 租户ID | 外键, 非空 |
| name | VARCHAR(100) | 饲料名称 | 非空 |
| type | VARCHAR(50) | 类型 | |
| specification | VARCHAR(100) | 规格 | |
| manufacturer | VARCHAR(100) | 生产厂家 | |
| batch_number | VARCHAR(50) | 批号 | |
| production_date | DATE | 生产日期 | |
| expiry_date | DATE | 有效期 | |
| protein_content | DECIMAL(5,2) | 蛋白质含量(%) | |
| stock_quantity | DECIMAL(10,2) | 库存数量 | 非空, 默认0 |
| unit | VARCHAR(20) | 单位 | 非空 |
| price | DECIMAL(10,2) | 单价 | |
| remark | TEXT | 备注 | |
| created_by | BIGINT UNSIGNED | 创建人ID | 外键, 非空, 关联用户表 |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间, ON UPDATE当前时间 |
| updated_by | BIGINT UNSIGNED | 更新人ID | 外键, 关联用户表 |

### 13. 环境监测表 (environment_monitoring)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | BIGINT UNSIGNED | 记录ID | 主键, 自增 |
| tenant_id | BIGINT UNSIGNED | 租户ID | 外键, 非空 |
| pond_id | BIGINT UNSIGNED | 池塘ID | 外键, 非空 |
| monitor_time | TIMESTAMP | 监测时间 | 非空 |
| air_temperature | DECIMAL(5,2) | 气温(℃) | |
| humidity | DECIMAL(5,2) | 湿度(%) | |
| weather | VARCHAR(50) | 天气状况 | |
| wind_direction | VARCHAR(20) | 风向 | |
| wind_force | VARCHAR(20) | 风力 | |
| rainfall | DECIMAL(5,2) | 降雨量(mm) | |
| remark | TEXT | 备注 | |
| created_by | BIGINT UNSIGNED | 记录人ID | 外键, 非空, 关联用户表 |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间, ON UPDATE当前时间 |
| updated_by | BIGINT UNSIGNED | 更新人ID | 外键, 关联用户表 |

### 14. 角色表 (roles)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | BIGINT UNSIGNED | 角色ID | 主键, 自增 |
| tenant_id | BIGINT UNSIGNED | 租户ID | 外键, 非空 |
| name | VARCHAR(50) | 角色名称 | 非空 |
| code | VARCHAR(50) | 角色编码 | 非空, 租户内唯一 |
| description | VARCHAR(255) | 角色描述 | |
| is_system | TINYINT UNSIGNED | 是否系统角色 | 非空, 默认0 |
| status | TINYINT UNSIGNED | 状态 | 非空, 默认1(启用) |
| created_by | BIGINT UNSIGNED | 创建人ID | 外键, 非空, 关联用户表 |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间, ON UPDATE当前时间 |
| updated_by | BIGINT UNSIGNED | 更新人ID | 外键, 关联用户表 |

### 15. 权限表 (permissions)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | BIGINT UNSIGNED | 权限ID | 主键, 自增 |
| name | VARCHAR(50) | 权限名称 | 非空 |
| code | VARCHAR(100) | 权限代码 | 非空, 唯一 |
| module | VARCHAR(50) | 所属模块 | 非空 |
| type | VARCHAR(20) | 权限类型(view/create/edit/delete) | 非空 |
| description | VARCHAR(255) | 权限描述 | |
| status | TINYINT UNSIGNED | 状态 | 非空, 默认1(启用) |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间, ON UPDATE当前时间 |
| created_by | BIGINT UNSIGNED | 创建人ID | 外键, 非空, 关联用户表 |
| updated_by | BIGINT UNSIGNED | 更新人ID | 外键, 关联用户表 |

### 16. 角色权限关联表 (role_permissions)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | BIGINT UNSIGNED | 记录ID | 主键, 自增 |
| tenant_id | BIGINT UNSIGNED | 租户ID | 外键, 非空 |
| role_id | BIGINT UNSIGNED | 角色ID | 外键, 非空 |
| permission_id | BIGINT UNSIGNED | 权限ID | 外键, 非空 |
| created_by | BIGINT UNSIGNED | 创建人ID | 外键, 非空, 关联用户表 |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间, ON UPDATE当前时间 |
| updated_by | BIGINT UNSIGNED | 更新人ID | 外键, 关联用户表 |

### 17. 用户角色关联表 (user_roles)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | BIGINT UNSIGNED | 记录ID | 主键, 自增 |
| tenant_id | BIGINT UNSIGNED | 租户ID | 外键, 非空 |
| user_id | BIGINT UNSIGNED | 用户ID | 外键, 非空 |
| role_id | BIGINT UNSIGNED | 角色ID | 外键, 非空 |
| created_by | BIGINT UNSIGNED | 创建人ID | 外键, 非空, 关联用户表 |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间, ON UPDATE当前时间 |
| updated_by | BIGINT UNSIGNED | 更新人ID | 外键, 关联用户表 |

### 18. 操作日志表 (operation_logs)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | BIGINT UNSIGNED | 记录ID | 主键, 自增 |
| tenant_id | BIGINT UNSIGNED | 租户ID | 外键, 非空 |
| user_id | BIGINT UNSIGNED | 用户ID | 外键, 非空, 关联用户表 |
| operation_type | VARCHAR(50) | 操作类型 | 非空 |
| operation_module | VARCHAR(50) | 操作模块 | 非空 |
| operation_description | VARCHAR(255) | 操作描述 | 非空 |
| ip_address | VARCHAR(50) | IP地址 | |
| operation_time | TIMESTAMP | 操作时间 | 非空, 默认当前时间 |
| operation_result | TINYINT UNSIGNED | 操作结果(0:失败,1:成功) | 非空, 默认1 |
| operation_params | TEXT | 操作参数 | |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |

## 表关系说明

1. 租户与数据的关系：
   - 每个表都通过tenant_id字段关联到租户表
   - 所有操作都在租户范围内进行，确保数据隔离

2. 用户与记录的关系：
   - 系统使用现有的用户管理模块
   - 记录通过created_by字段关联到用户表的ID
   - 用户只能查看和管理其所属租户的数据
   - 所有业务表增加updated_by字段，完善审计跟踪

3. 池塘与批次的关系：
   - 一个池塘可以有多个养殖批次（不同时间段）
   - 一个批次只能在一个池塘中
   - 生产批次表(production_batches)通过pond_id关联到池塘表(ponds)

4. 批次与记录的关系：
   - 一个批次可以有多个投喂记录、生长记录、水质监测记录等
   - 每个记录都属于特定的批次
   - 投喂记录表(feeding_records)、生长记录表(growth_records)等通过batch_id关联到生产批次表

5. 品种与批次的关系：
   - 一个品种可以有多个养殖批次
   - 一个批次通常养殖一种品种
   - 生产批次表通过species_id关联到养殖品种表(species)

6. 饲料/药品与记录的关系：
   - 饲料被用于多个投喂记录
   - 药品被用于多个疾病防治记录
   - 投喂记录表通过feed_id关联到饲料管理表(feeds)
   - 病害防治表通过medicine_id关联到药品管理表(medicines)

7. 角色与权限的关系：
   - 一个角色可以拥有多个权限
   - 一个权限可以被多个角色拥有
   - 角色权限关联表(role_permissions)实现多对多关系
   - 角色权限关联表通过role_id关联到角色表(roles)，通过permission_id关联到权限表(permissions)

8. 用户与角色的关系：
   - 一个用户可以拥有多个角色
   - 一个角色可以被多个用户拥有
   - 用户角色关联表(user_roles)实现多对多关系
   - 用户角色关联表通过user_id关联到系统用户表，通过role_id关联到角色表

9. 角色与租户的关系：
   - 角色定义在租户级别，每个租户可以有自己的角色定义
   - 系统预定义角色(is_system=1)由平台管理，租户无法修改
   - 角色表包含tenant_id字段，确保角色在租户内隔离

10. 权限模型：
    - 权限表不包含tenant_id，由平台统一定义
    - 通过角色权限关联表在租户级别分配权限
    - 权限表按模块和操作类型组织，提供细粒度的权限控制

11. 操作日志与监控：
    - 所有重要操作通过操作日志表(operation_logs)进行记录
    - 操作日志按租户隔离，关联到具体用户
    - 记录操作类型、模块、结果等信息，便于审计和问题排查

## 索引设计

为提高查询效率，建议在以下字段上创建索引：

1. 各表的主键字段：`id`(主键索引，自动创建)
2. 所有表的`tenant_id`字段：创建普通索引，提高租户隔离查询效率
3. 外键字段：如`pond_id`, `batch_id`, `species_id`等，创建普通索引
4. 频繁查询的字段：
   - `batch_number`：创建普通索引
   - `status`：创建普通索引（结合tenant_id的复合索引）
   - `sale_date`, `cost_date`等时间字段：创建普通索引
5. 时间相关字段：
   - `created_at`：创建普通索引
   - `test_time`, `feeding_time`, `monitor_time`等业务时间字段：创建普通索引
6. 以下字段应创建唯一索引：
   - 角色表的`tenant_id`和`code`组合：确保租户内角色编码唯一
   - 权限表的`code`字段：确保系统内权限代码唯一
   - 生产批次表的`tenant_id`和`batch_number`组合：确保租户内批次编号唯一
7. 其他推荐索引：
   - 角色权限关联表的`role_id`和`permission_id`字段：创建复合索引
   - 用户角色关联表的`user_id`和`role_id`字段：创建复合索引
   - 操作日志表的`operation_time`字段：创建普通索引

## 权限控制说明

1. 基于RBAC(基于角色的访问控制)模型
   - 用户关联到角色
   - 角色关联到权限
   - 系统根据用户所属角色的权限确定操作许可

2. 权限分类
   - 功能模块权限：控制用户对系统各功能模块的访问
   - 数据操作权限：控制用户对数据的查看(view)、创建(create)、编辑(edit)、删除(delete)操作

3. 权限代码命名规则
   - 格式：`module.operation`
   - 示例：`pond.view`, `pond.create`, `pond.edit`, `pond.delete`

4. 预定义角色
   - 超级管理员：系统最高权限，可管理所有租户
   - 租户管理员：租户内最高权限，可管理租户内所有模块
   - 养殖技术员：负责养殖技术相关模块
   - 销售人员：负责销售相关模块
   - 数据录入员：负责数据录入
   - 系统管理员：负责系统配置和角色权限管理
   - 只读用户：只有查看权限，不能修改数据

## 注意事项

1. 数据库引擎与字符集
   - 所有表应使用InnoDB存储引擎，支持事务和外键约束
   - 所有表的字符集应使用utf8mb4，排序规则使用utf8mb4_unicode_ci，以支持完整的Unicode字符集

2. 数据隔离与安全
   - 所有操作都应在租户上下文中进行，确保数据隔离
   - 系统应自动为所有新记录设置当前租户ID
   - 所有接口应进行权限验证，确保用户只能访问有权限的数据
   - 数据库应配置适当的连接数限制，防止资源耗尽

3. 字段设计规范
   - ID类字段统一使用BIGINT UNSIGNED类型，便于未来扩展
   - 状态类字段使用TINYINT UNSIGNED，提高存储效率
   - 所有有外键关系的字段数据类型必须保持一致
   - 所有日期时间类型使用TIMESTAMP标准类型，并设置默认值和自动更新

4. 审计与日志
   - 所有表都应包含created_at, created_by, updated_at, updated_by审计字段
   - 更新时间字段设置ON UPDATE CURRENT_TIMESTAMP自动更新
   - 创建人/更新人字段设为非空，明确责任
   - 角色和权限变更操作应记录审计日志
   - 重要操作应通过操作日志表详细记录

5. 性能优化
   - 针对大数据量的表（如水质监测表、投喂记录表等），应考虑数据分区或归档策略
   - 批量操作应使用事务，保证数据一致性
   - 用户权限应在每次会话开始时加载并缓存，提高性能
   - 查询时尽可能使用索引字段进行过滤，避免全表扫描
   - 对于频繁查询但不常更新的数据，可考虑使用缓存机制

6. 扩展性考虑
   - 表设计预留扩展字段，便于后续功能扩展
   - 枚举类字段（如状态、类型等）预留足够空间，便于增加新的选项
   - 设计时考虑水平扩展能力，避免强耦合

7. 数据备份
   - 建立定期备份机制，确保数据安全
   - 对于重要数据变更，考虑实现数据变更历史记录表 