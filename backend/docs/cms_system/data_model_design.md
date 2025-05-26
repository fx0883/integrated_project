# CMS系统数据模型设计文档

## 1. 概述

本文档详细描述CMS系统的数据库设计，包括各实体的属性、关系以及索引设计。数据模型设计基于需求分析文档中的功能需求，并针对MySQL数据库进行了优化。本文档最后更新于2023年，与系统实际实现保持一致。

## 2. 实体关系图

```
+-------------+       +--------------+        +------------+
|   Article   |-------| ArticleTag   |--------|    Tag     |
+-------------+       +--------------+        +------------+
      |                                            |
      |                                            |
      v                                            v
+-------------+       +--------------+        +------------+
|  Category   |<------| ArticleCategory |     | TagGroup   |
+-------------+       +--------------+        +------------+
      |                     |
      |                     |
      v                     v
+-------------+       +--------------+        +------------+
| ArticleMeta |       | ArticleVersion|       |  Comment   |
+-------------+       +--------------+        +------------+
      |                                            |
      |                                            |
      v                                            v
+-------------+       +--------------+        +------------+
| ArticleStats|       | Interaction  |--------|    User    |
+-------------+       +--------------+        +------------+
                            |
                            v
+-------------+       +--------------+        +------------+
| UserLevel   |<------| UserLevelRel |        | AccessLog  |
+-------------+       +--------------+        +------------+
                                                    |
                                                    v
                                             +--------------+
                                             | OperationLog |
                                             +--------------+
```

## 3. 数据模型详细设计

### 3.1 核心模型

#### 3.1.1 文章模型 (Article)

**表名**: `cms_article`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 文章唯一标识符 |
| title | VARCHAR(255) | NOT NULL | 文章标题 |
| slug | VARCHAR(255) | NOT NULL, UNIQUE | URL友好的标题格式 |
| content | LONGTEXT | NOT NULL | 文章正文内容 |
| content_type | VARCHAR(20) | NOT NULL, DEFAULT 'markdown' | 内容格式类型，可选值为'markdown'或'html' |
| excerpt | TEXT | NULL | 文章摘要，若为空则自动从正文提取 |
| author_id | INT | NOT NULL, FOREIGN KEY | 文章作者的用户ID |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'draft' | 文章状态：'draft'、'pending'、'published'、'archived' |
| is_featured | BOOLEAN | NOT NULL, DEFAULT FALSE | 标记为特色文章 |
| is_pinned | BOOLEAN | NOT NULL, DEFAULT FALSE | 标记为置顶文章 |
| allow_comment | BOOLEAN | NOT NULL, DEFAULT TRUE | 是否允许评论 |
| visibility | VARCHAR(20) | NOT NULL, DEFAULT 'public' | 文章可见性：'public'、'private'、'password' |
| password | VARCHAR(128) | NULL | 访问密码 |
| created_at | DATETIME | NOT NULL | 文章创建时间 |
| updated_at | DATETIME | NOT NULL | 文章最后更新时间 |
| published_at | DATETIME | NULL | 文章发布时间 |
| cover_image | VARCHAR(255) | NULL | 文章封面图片URL |
| template | VARCHAR(100) | NULL | 文章使用的自定义模板名称 |
| sort_order | INT | NOT NULL, DEFAULT 0 | 手动排序序号 |
| tenant_id | INT | NOT NULL, FOREIGN KEY | 所属租户ID |

**索引**:
- PRIMARY KEY (`id`)
- UNIQUE (`slug`)
- INDEX (`author_id`)
- INDEX (`status`, `created_at`)
- INDEX (`status`, `published_at`)
- INDEX (`tenant_id`, `status`)
- INDEX (`tenant_id`, `published_at`)

#### 3.1.2 分类模型 (Category)

**表名**: `cms_category`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 分类唯一标识符 |
| name | VARCHAR(100) | NOT NULL | 分类名称 |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | URL友好的分类名 |
| description | TEXT | NULL | 分类详细描述 |
| parent_id | INT | NULL, FOREIGN KEY | 父分类ID，用于创建层级分类结构 |
| cover_image | VARCHAR(255) | NULL | 分类封面图片URL |
| created_at | DATETIME | NOT NULL | 分类创建时间 |
| updated_at | DATETIME | NOT NULL | 分类最后更新时间 |
| sort_order | INT | NOT NULL, DEFAULT 0 | 排序序号 |
| tenant_id | INT | NOT NULL, FOREIGN KEY | 所属租户ID |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | 分类是否激活 |
| seo_title | VARCHAR(255) | NULL | 分类页面的SEO标题 |
| seo_description | TEXT | NULL | 分类页面的SEO描述 |

**索引**:
- PRIMARY KEY (`id`)
- UNIQUE (`slug`)
- INDEX (`parent_id`)
- INDEX (`is_active`)
- INDEX (`tenant_id`, `parent_id`)
- INDEX (`tenant_id`, `is_active`)

#### 3.1.3 标签组模型 (TagGroup)

**表名**: `cms_tag_group`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 标签组唯一标识符 |
| name | VARCHAR(50) | NOT NULL | 标签组名称 |
| slug | VARCHAR(50) | NOT NULL, UNIQUE | URL友好的标签组名 |
| description | TEXT | NULL | 标签组详细描述 |
| created_at | DATETIME | NOT NULL | 标签组创建时间 |
| updated_at | DATETIME | NOT NULL | 标签组最后更新时间 |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | 标签组是否激活 |
| tenant_id | INT | NOT NULL, FOREIGN KEY | 所属租户ID |

**索引**:
- PRIMARY KEY (`id`)
- UNIQUE (`slug`)
- INDEX (`is_active`)
- INDEX (`tenant_id`, `is_active`)

#### 3.1.4 标签模型 (Tag)

**表名**: `cms_tag`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 标签唯一标识符 |
| name | VARCHAR(50) | NOT NULL | 标签名称 |
| slug | VARCHAR(50) | NOT NULL, UNIQUE | URL友好的标签名 |
| description | TEXT | NULL | 标签详细描述 |
| group_id | INT | NULL, FOREIGN KEY | 标签组ID |
| created_at | DATETIME | NOT NULL | 标签创建时间 |
| updated_at | DATETIME | NOT NULL | 标签最后更新时间 |
| color | VARCHAR(20) | NULL | 标签颜色代码 |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | 标签是否激活 |
| tenant_id | INT | NOT NULL, FOREIGN KEY | 所属租户ID |

**索引**:
- PRIMARY KEY (`id`)
- UNIQUE (`slug`)
- INDEX (`group_id`)
- INDEX (`is_active`)
- INDEX (`tenant_id`, `is_active`)

#### 3.1.5 评论模型 (Comment)

**表名**: `cms_comment`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 评论唯一标识符 |
| article_id | INT | NOT NULL, FOREIGN KEY | 评论所属文章的ID |
| parent_id | INT | NULL, FOREIGN KEY | 父评论ID，用于实现评论嵌套回复功能 |
| user_id | INT | NULL, FOREIGN KEY | 评论用户ID |
| guest_name | VARCHAR(50) | NULL | 游客评论者的名称 |
| guest_email | VARCHAR(100) | NULL | 游客评论者的邮箱 |
| guest_website | VARCHAR(255) | NULL | 游客评论者的网站URL |
| content | TEXT | NOT NULL | 评论内容 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | 评论状态：'pending'、'approved'、'spam'、'trash' |
| ip_address | VARCHAR(45) | NULL | 评论者IP地址 |
| user_agent | VARCHAR(255) | NULL | 评论者浏览器用户代理信息 |
| created_at | DATETIME | NOT NULL | 评论创建时间 |
| updated_at | DATETIME | NOT NULL | 评论最后更新时间 |
| is_pinned | BOOLEAN | NOT NULL, DEFAULT FALSE | 是否置顶评论 |
| likes_count | INT | NOT NULL, DEFAULT 0 | 评论获得的点赞数量 |
| tenant_id | INT | NOT NULL, FOREIGN KEY | 所属租户ID |

**索引**:
- PRIMARY KEY (`id`)
- INDEX (`article_id`)
- INDEX (`user_id`)
- INDEX (`parent_id`)
- INDEX (`status`, `created_at`)
- INDEX (`tenant_id`, `status`, `created_at`)

### 3.2 关系模型

#### 3.2.1 文章分类关系 (ArticleCategory)

**表名**: `cms_article_category`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 关系记录唯一标识符 |
| article_id | INT | NOT NULL, FOREIGN KEY | 文章ID |
| category_id | INT | NOT NULL, FOREIGN KEY | 分类ID |
| created_at | DATETIME | NOT NULL | 关系创建时间 |
| tenant_id | INT | NOT NULL, FOREIGN KEY | 所属租户ID |

**索引**:
- PRIMARY KEY (`id`)
- UNIQUE (`article_id`, `category_id`)
- INDEX (`category_id`)
- INDEX (`tenant_id`, `article_id`)

#### 3.2.2 文章标签关系 (ArticleTag)

**表名**: `cms_article_tag`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 关系记录唯一标识符 |
| article_id | INT | NOT NULL, FOREIGN KEY | 文章ID |
| tag_id | INT | NOT NULL, FOREIGN KEY | 标签ID |
| created_at | DATETIME | NOT NULL | 关系创建时间 |
| tenant_id | INT | NOT NULL, FOREIGN KEY | 所属租户ID |

**索引**:
- PRIMARY KEY (`id`)
- UNIQUE (`article_id`, `tag_id`)
- INDEX (`tag_id`)
- INDEX (`tenant_id`, `article_id`)

### 3.3 扩展模型

#### 3.3.1 文章元数据 (ArticleMeta)

**表名**: `cms_article_meta`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 元数据唯一标识符 |
| article_id | INT | NOT NULL, FOREIGN KEY, UNIQUE | 文章ID |
| seo_title | VARCHAR(255) | NULL | SEO标题 |
| seo_description | TEXT | NULL | SEO描述 |
| seo_keywords | VARCHAR(255) | NULL | SEO关键词 |
| og_title | VARCHAR(255) | NULL | OpenGraph标题 |
| og_description | TEXT | NULL | OpenGraph描述 |
| og_image | VARCHAR(255) | NULL | OpenGraph图片URL |
| schema_markup | TEXT | NULL | 结构化数据标记 |
| canonical_url | VARCHAR(255) | NULL | 规范URL |
| robots | VARCHAR(100) | NULL | Robots指令 |
| custom_meta | TEXT | NULL | 自定义元数据 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |
| tenant_id | INT | NOT NULL, FOREIGN KEY | 所属租户ID |

**索引**:
- PRIMARY KEY (`id`)
- UNIQUE (`article_id`)
- INDEX (`tenant_id`)

#### 3.3.2 文章统计 (ArticleStatistics)

**表名**: `cms_article_statistics`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 统计记录唯一标识符 |
| article_id | INT | NOT NULL, FOREIGN KEY, UNIQUE | 文章ID |
| views_count | INT | NOT NULL, DEFAULT 0 | 浏览次数 |
| unique_views_count | INT | NOT NULL, DEFAULT 0 | 独立访客浏览次数 |
| likes_count | INT | NOT NULL, DEFAULT 0 | 点赞数 |
| dislikes_count | INT | NOT NULL, DEFAULT 0 | 踩数 |
| comments_count | INT | NOT NULL, DEFAULT 0 | 评论数 |
| shares_count | INT | NOT NULL, DEFAULT 0 | 分享数 |
| bookmarks_count | INT | NOT NULL, DEFAULT 0 | 收藏数 |
| avg_reading_time | INT | NOT NULL, DEFAULT 0 | 平均阅读时长(秒) |
| bounce_rate | DECIMAL(5,2) | NOT NULL, DEFAULT 0 | 跳出率(%) |
| last_updated_at | DATETIME | NOT NULL | 最后更新时间 |
| tenant_id | INT | NOT NULL, FOREIGN KEY | 所属租户ID |

**索引**:
- PRIMARY KEY (`id`)
- UNIQUE (`article_id`)
- INDEX (`views_count`)
- INDEX (`likes_count`)
- INDEX (`tenant_id`)

#### 3.3.3 文章版本 (ArticleVersion)

**表名**: `cms_article_version`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 版本记录唯一标识符 |
| article_id | INT | NOT NULL, FOREIGN KEY | 文章ID |
| title | VARCHAR(255) | NOT NULL | 版本标题 |
| content | LONGTEXT | NOT NULL | 版本内容 |
| content_type | VARCHAR(20) | NOT NULL | 内容类型 |
| excerpt | TEXT | NULL | 版本摘要 |
| editor_id | INT | NOT NULL, FOREIGN KEY | 编辑者ID |
| version_number | INT | NOT NULL | 版本号 |
| change_description | TEXT | NULL | 变更说明 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| diff_data | TEXT | NULL | 差异数据 |
| tenant_id | INT | NOT NULL, FOREIGN KEY | 所属租户ID |

**索引**:
- PRIMARY KEY (`id`)
- UNIQUE (`article_id`, `version_number`)
- INDEX (`editor_id`)
- INDEX (`created_at`)
- INDEX (`tenant_id`, `article_id`)

#### 3.3.4 用户互动 (Interaction)

**表名**: `cms_interaction`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 互动记录唯一标识符 |
| user_id | INT | NOT NULL, FOREIGN KEY | 用户ID |
| article_id | INT | NOT NULL, FOREIGN KEY | 文章ID |
| type | VARCHAR(20) | NOT NULL | 互动类型：'like'、'dislike'、'bookmark'、'share' |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |
| ip_address | VARCHAR(45) | NULL | IP地址 |
| user_agent | VARCHAR(255) | NULL | 用户代理 |
| extra_data | TEXT | NULL | 附加数据 |
| tenant_id | INT | NOT NULL, FOREIGN KEY | 所属租户ID |

**索引**:
- PRIMARY KEY (`id`)
- UNIQUE (`user_id`, `article_id`, `type`)
- INDEX (`article_id`)
- INDEX (`type`, `created_at`)
- INDEX (`tenant_id`, `type`)

#### 3.3.5 用户等级 (UserLevel)

**表名**: `cms_user_level`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 等级唯一标识符 |
| tenant_id | INT | NOT NULL, FOREIGN KEY | 所属租户ID |
| name | VARCHAR(50) | NOT NULL | 等级名称 |
| description | TEXT | NULL | 等级描述 |
| level | INT | NOT NULL | 等级值 |
| max_articles | INT | NOT NULL, DEFAULT 10 | 最大文章数 |
| max_storage_mb | INT | NOT NULL, DEFAULT 100 | 最大存储空间(MB) |
| permissions | TEXT | NULL | 权限 |
| is_default | BOOLEAN | NOT NULL, DEFAULT FALSE | 是否默认 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

**索引**:
- PRIMARY KEY (`id`)
- INDEX (`tenant_id`)
- INDEX (`level`)
- INDEX (`is_default`)

#### 3.3.6 用户等级关系 (UserLevelRelation)

**表名**: `cms_user_level_relation`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 关系唯一标识符 |
| user_id | INT | NOT NULL, FOREIGN KEY | 用户ID |
| level_id | INT | NOT NULL, FOREIGN KEY | 等级ID |
| start_time | DATETIME | NOT NULL | 开始时间 |
| end_time | DATETIME | NULL | 结束时间 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |
| tenant_id | INT | NOT NULL, FOREIGN KEY | 所属租户ID |

**索引**:
- PRIMARY KEY (`id`)
- UNIQUE (`user_id`, `level_id`)
- INDEX (`level_id`)
- INDEX (`tenant_id`, `user_id`)
- INDEX (`end_time`)

#### 3.3.7 访问日志 (AccessLog)

**表名**: `cms_access_log`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 日志唯一标识符 |
| article_id | INT | NOT NULL, FOREIGN KEY | 文章ID |
| user_id | INT | NULL, FOREIGN KEY | 用户ID |
| session_id | VARCHAR(100) | NULL | 会话ID |
| ip_address | VARCHAR(45) | NOT NULL | IP地址 |
| user_agent | VARCHAR(255) | NULL | 用户代理 |
| referer | VARCHAR(255) | NULL | 来源URL |
| created_at | DATETIME | NOT NULL | 访问时间 |
| reading_time | INT | NULL | 阅读时长(秒) |
| country | VARCHAR(50) | NULL | 国家 |
| region | VARCHAR(100) | NULL | 区域/省份 |
| city | VARCHAR(100) | NULL | 城市 |
| device | VARCHAR(50) | NULL | 设备类型 |
| browser | VARCHAR(50) | NULL | 浏览器 |
| os | VARCHAR(50) | NULL | 操作系统 |
| tenant_id | INT | NOT NULL, FOREIGN KEY | 所属租户ID |

**索引**:
- PRIMARY KEY (`id`)
- INDEX (`article_id`)
- INDEX (`user_id`)
- INDEX (`session_id`)
- INDEX (`created_at`)
- INDEX (`country`)
- INDEX (`tenant_id`, `article_id`)
- INDEX (`tenant_id`, `created_at`)

#### 3.3.8 操作日志 (OperationLog)

**表名**: `cms_operation_log`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 日志唯一标识符 |
| user_id | INT | NOT NULL, FOREIGN KEY | 用户ID |
| action | VARCHAR(50) | NOT NULL | 操作类型：'create'、'update'、'delete'、'publish'等 |
| entity_type | VARCHAR(50) | NOT NULL | 实体类型：'article'、'category'、'tag'等 |
| entity_id | INT | NULL | 实体ID |
| details | TEXT | NULL | 操作详情 |
| ip_address | VARCHAR(45) | NOT NULL | IP地址 |
| user_agent | VARCHAR(255) | NULL | 用户代理 |
| created_at | DATETIME | NOT NULL | 操作时间 |
| tenant_id | INT | NOT NULL, FOREIGN KEY | 所属租户ID |

**索引**:
- PRIMARY KEY (`id`)
- INDEX (`user_id`)
- INDEX (`action`)
- INDEX (`entity_type`)
- INDEX (`entity_id`)
- INDEX (`created_at`)
- INDEX (`tenant_id`, `entity_type`)
- INDEX (`tenant_id`, `created_at`)

## 4. 数据库设计考量

### 4.1 多租户设计

- 每个表都包含tenant_id字段，实现完全的数据隔离
- 所有查询都会自动附加租户条件，防止跨租户数据访问

### 4.2 索引优化

- 为常用查询条件创建索引
- 联合索引用于优化多条件查询
- 针对租户筛选的联合索引，优化租户数据查询

### 4.3 关系设计

- 使用外键约束保持数据一致性
- 多对多关系通过中间表实现
- 树形结构（如分类）通过自引用实现

### 4.4 性能考虑

- 大文本字段使用TEXT类型而非VARCHAR
- 为统计数据设置单独的表，避免频繁更新主表
- 日志表进行分区或定期归档，保持查询性能 