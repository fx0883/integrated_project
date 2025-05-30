# 水产养殖系统数据库模型

本文档描述了水产养殖系统的数据库表结构设计，作为系统开发的基础模型。

## 数据库表结构概览

| 序号 | 表名 | 描述 |
|------|------|------|
| 1 | 用户表 | 存储系统用户信息 |
| 2 | 池塘信息表 | 记录养殖池塘的基本信息 |
| 3 | 水质监测表 | 记录水质监测数据 |
| 4 | 投喂记录表 | 记录日常投喂情况 |
| 5 | 生长记录表 | 记录养殖品种的生长情况 |
| 6 | 病害防治表 | 记录疾病防治情况 |
| 7 | 药品管理表 | 记录药品使用和库存 |
| 8 | 设备管理表 | 记录养殖设备信息 |
| 9 | 生产批次表 | 记录养殖批次信息 |
| 10 | 销售记录表 | 记录产品销售情况 |
| 11 | 成本记录表 | 记录养殖成本信息 |
| 12 | 养殖品种表 | 记录养殖的品种信息 |
| 13 | 饲料管理表 | 记录饲料使用和库存 |
| 14 | 环境监测表 | 记录养殖环境监测数据 |

## 表结构详细设计

### 1. 用户表 (users)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | INT | 用户ID | 主键, 自增 |
| username | VARCHAR(50) | 用户名 | 非空, 唯一 |
| password | VARCHAR(255) | 密码(加密存储) | 非空 |
| real_name | VARCHAR(50) | 真实姓名 | |
| phone | VARCHAR(20) | 电话号码 | |
| email | VARCHAR(100) | 电子邮箱 | |
| role | VARCHAR(20) | 用户角色 | 非空, 默认'user' |
| status | TINYINT | 用户状态 | 非空, 默认1(启用) |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间 |

### 2. 池塘信息表 (ponds)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | INT | 池塘ID | 主键, 自增 |
| name | VARCHAR(50) | 池塘名称 | 非空 |
| area | DECIMAL(10,2) | 面积(亩) | 非空 |
| depth | DECIMAL(5,2) | 深度(米) | 非空 |
| location | VARCHAR(255) | 位置描述 | |
| pond_type | VARCHAR(50) | 池塘类型 | |
| status | TINYINT | 使用状态 | 非空, 默认1(使用中) |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间 |

### 3. 水质监测表 (water_quality)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | INT | 记录ID | 主键, 自增 |
| pond_id | INT | 池塘ID | 外键, 非空 |
| test_time | TIMESTAMP | 检测时间 | 非空 |
| temperature | DECIMAL(5,2) | 水温(℃) | |
| ph | DECIMAL(4,2) | pH值 | |
| dissolved_oxygen | DECIMAL(5,2) | 溶解氧(mg/L) | |
| ammonia_nitrogen | DECIMAL(5,2) | 氨氮(mg/L) | |
| nitrite | DECIMAL(5,2) | 亚硝酸盐(mg/L) | |
| transparency | DECIMAL(5,2) | 透明度(cm) | |
| remark | TEXT | 备注 | |
| created_by | INT | 记录人ID | 外键 |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |

### 4. 投喂记录表 (feeding_records)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | INT | 记录ID | 主键, 自增 |
| pond_id | INT | 池塘ID | 外键, 非空 |
| feed_id | INT | 饲料ID | 外键, 非空 |
| batch_id | INT | 批次ID | 外键, 非空 |
| feeding_time | TIMESTAMP | 投喂时间 | 非空 |
| feeding_amount | DECIMAL(10,2) | 投喂量(kg) | 非空 |
| feeding_method | VARCHAR(50) | 投喂方式 | |
| remark | TEXT | 备注 | |
| created_by | INT | 记录人ID | 外键 |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |

### 5. 生长记录表 (growth_records)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | INT | 记录ID | 主键, 自增 |
| pond_id | INT | 池塘ID | 外键, 非空 |
| batch_id | INT | 批次ID | 外键, 非空 |
| species_id | INT | 品种ID | 外键, 非空 |
| sample_time | TIMESTAMP | 取样时间 | 非空 |
| sample_count | INT | 取样数量 | 非空 |
| avg_weight | DECIMAL(8,2) | 平均体重(g) | 非空 |
| avg_length | DECIMAL(8,2) | 平均体长(cm) | |
| survival_rate | DECIMAL(5,2) | 存活率(%) | |
| health_status | VARCHAR(50) | 健康状况 | |
| remark | TEXT | 备注 | |
| created_by | INT | 记录人ID | 外键 |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |

### 6. 病害防治表 (disease_prevention)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | INT | 记录ID | 主键, 自增 |
| pond_id | INT | 池塘ID | 外键, 非空 |
| batch_id | INT | 批次ID | 外键, 非空 |
| disease_name | VARCHAR(100) | 疾病名称 | |
| symptom | TEXT | 症状描述 | |
| treatment_method | TEXT | 治疗方法 | |
| medicine_id | INT | 药品ID | 外键 |
| dosage | DECIMAL(8,2) | 用药剂量 | |
| treatment_time | TIMESTAMP | 治疗时间 | 非空 |
| treatment_result | VARCHAR(50) | 治疗结果 | |
| remark | TEXT | 备注 | |
| created_by | INT | 记录人ID | 外键 |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |

### 7. 药品管理表 (medicines)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | INT | 药品ID | 主键, 自增 |
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
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间 |

### 8. 设备管理表 (equipment)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | INT | 设备ID | 主键, 自增 |
| name | VARCHAR(100) | 设备名称 | 非空 |
| equipment_type | VARCHAR(50) | 设备类型 | 非空 |
| model | VARCHAR(50) | 型号 | |
| serial_number | VARCHAR(50) | 序列号 | |
| purchase_date | DATE | 购买日期 | |
| warranty_period | INT | 保修期(月) | |
| supplier | VARCHAR(100) | 供应商 | |
| status | TINYINT | 状态 | 非空, 默认1(正常) |
| location | VARCHAR(100) | 安装位置 | |
| maintenance_cycle | INT | 维护周期(天) | |
| last_maintenance_time | TIMESTAMP | 上次维护时间 | |
| remark | TEXT | 备注 | |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间 |

### 9. 生产批次表 (production_batches)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | INT | 批次ID | 主键, 自增 |
| batch_number | VARCHAR(50) | 批次编号 | 非空, 唯一 |
| pond_id | INT | 池塘ID | 外键, 非空 |
| species_id | INT | 品种ID | 外键, 非空 |
| start_date | DATE | 开始日期 | 非空 |
| expected_end_date | DATE | 预计结束日期 | |
| actual_end_date | DATE | 实际结束日期 | |
| initial_quantity | INT | 初始数量 | 非空 |
| initial_avg_weight | DECIMAL(8,2) | 初始平均体重(g) | |
| source | VARCHAR(100) | 来源 | |
| status | VARCHAR(20) | 状态 | 非空, 默认'active' |
| remark | TEXT | 备注 | |
| created_by | INT | 创建人ID | 外键 |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间 |

### 10. 销售记录表 (sales_records)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | INT | 记录ID | 主键, 自增 |
| batch_id | INT | 批次ID | 外键, 非空 |
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
| created_by | INT | 记录人ID | 外键 |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |

### 11. 成本记录表 (cost_records)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | INT | 记录ID | 主键, 自增 |
| batch_id | INT | 批次ID | 外键 |
| pond_id | INT | 池塘ID | 外键 |
| cost_type | VARCHAR(50) | 成本类型 | 非空 |
| cost_date | DATE | 成本发生日期 | 非空 |
| amount | DECIMAL(12,2) | 金额 | 非空 |
| description | VARCHAR(255) | 描述 | |
| invoice_number | VARCHAR(50) | 发票号 | |
| remark | TEXT | 备注 | |
| created_by | INT | 记录人ID | 外键 |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |

### 12. 养殖品种表 (species)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | INT | 品种ID | 主键, 自增 |
| name | VARCHAR(100) | 品种名称 | 非空 |
| scientific_name | VARCHAR(100) | 学名 | |
| category | VARCHAR(50) | 类别 | |
| growth_cycle | INT | 生长周期(天) | |
| suitable_temperature | VARCHAR(50) | 适宜温度范围 | |
| suitable_ph | VARCHAR(50) | 适宜pH值范围 | |
| feeding_habits | TEXT | 饮食习性 | |
| disease_resistance | VARCHAR(50) | 抗病性 | |
| market_value | VARCHAR(100) | 市场价值 | |
| remark | TEXT | 备注 | |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间 |

### 13. 饲料管理表 (feeds)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | INT | 饲料ID | 主键, 自增 |
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
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |
| updated_at | TIMESTAMP | 更新时间 | 非空, 默认当前时间 |

### 14. 环境监测表 (environment_monitoring)

| 字段名 | 数据类型 | 描述 | 约束 |
|--------|----------|------|------|
| id | INT | 记录ID | 主键, 自增 |
| pond_id | INT | 池塘ID | 外键, 非空 |
| monitor_time | TIMESTAMP | 监测时间 | 非空 |
| air_temperature | DECIMAL(5,2) | 气温(℃) | |
| humidity | DECIMAL(5,2) | 湿度(%) | |
| weather | VARCHAR(50) | 天气状况 | |
| wind_direction | VARCHAR(20) | 风向 | |
| wind_force | VARCHAR(20) | 风力 | |
| rainfall | DECIMAL(5,2) | 降雨量(mm) | |
| remark | TEXT | 备注 | |
| created_by | INT | 记录人ID | 外键 |
| created_at | TIMESTAMP | 创建时间 | 非空, 默认当前时间 |

## 表关系说明

1. 用户表与其他表的关系：
   - 用户可以创建多个记录（投喂记录、水质监测记录等）
   - 用户可以管理多个池塘和批次

2. 池塘与批次的关系：
   - 一个池塘可以有多个养殖批次（不同时间段）
   - 一个批次只能在一个池塘中

3. 批次与记录的关系：
   - 一个批次可以有多个投喂记录、生长记录、水质监测记录等
   - 每个记录都属于特定的批次

4. 品种与批次的关系：
   - 一个品种可以有多个养殖批次
   - 一个批次通常养殖一种品种

5. 饲料/药品与记录的关系：
   - 饲料被用于多个投喂记录
   - 药品被用于多个疾病防治记录

## 索引设计

为提高查询效率，建议在以下字段上创建索引：

1. 各表的主键字段
2. 外键字段（pond_id, batch_id, species_id等）
3. 频繁查询的字段（如username, batch_number等）
4. 时间相关字段（如created_at, feeding_time, monitor_time等）

## 注意事项

1. 所有表应使用InnoDB存储引擎，支持事务和外键约束
2. 所有表的字符集应使用utf8mb4，以支持完整的Unicode字符集
3. 敏感数据如用户密码应进行加密存储
4. 针对大数据量的表（如水质监测表、投喂记录表等），应考虑数据分区或归档策略 