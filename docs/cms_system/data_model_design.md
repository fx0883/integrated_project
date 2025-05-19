# CMS系统数据模型设计文档

## 1. 概述

本文档详细描述CMS系统的数据库设计，包括各实体的属性、关系以及索引设计。数据模型设计基于需求分析文档中的功能需求，并针对MySQL数据库进行了优化。

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
```

## 3. 数据模型详细设计

### 3.1 核心模型

#### 3.1.1 文章模型 (Article)

**表名**: `cms_article`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 文章唯一标识符，系统自动生成 |
| title | VARCHAR(255) | NOT NULL | 文章标题，显示在页面顶部和列表中 |
| slug | VARCHAR(255) | NOT NULL, UNIQUE | URL友好的标题格式，用于生成SEO友好的URL地址，如"my-first-article" |
| content | LONGTEXT | NOT NULL | 文章正文内容，支持Markdown或HTML格式 |
| content_type | VARCHAR(20) | NOT NULL, DEFAULT 'markdown' | 内容格式类型，决定前端如何渲染内容，可选值为'markdown'或'html' |
| excerpt | TEXT | NULL | 文章摘要，用于列表页显示和SEO描述，若为空则自动从正文提取 |
| author_id | INT | NOT NULL, FOREIGN KEY | 文章作者的用户ID，关联到用户表，用于权限控制和作者页面聚合 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'draft' | 文章状态，控制文章在工作流中的位置和可见性：'draft'(草稿，仅作者可见)、'pending'(待审核，编辑可见)、'published'(已发布，公开可见)、'archived'(已归档，不在主页显示) |
| is_featured | BOOLEAN | NOT NULL, DEFAULT FALSE | 标记为特色文章，可在首页或专题页突出显示 |
| is_pinned | BOOLEAN | NOT NULL, DEFAULT FALSE | 标记为置顶文章，在列表中始终显示在最前面 |
| allow_comment | BOOLEAN | NOT NULL, DEFAULT TRUE | 是否允许读者对此文章发表评论 |
| visibility | VARCHAR(20) | NOT NULL, DEFAULT 'public' | 文章可见性设置：'public'(所有人可见)、'private'(仅登录用户可见)、'password'(需密码访问) |
| password | VARCHAR(128) | NULL | 当visibility为'password'时，访问文章所需的密码 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 文章创建时间，用于排序和归档 |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 文章最后更新时间，用于排序和RSS更新 |
| published_at | DATETIME | NULL | 文章发布时间，用于排序、归档和RSS发布时间，为NULL表示未发布 |
| cover_image | VARCHAR(255) | NULL | 文章封面图片URL，用于列表页和社交媒体分享缩略图 |
| template | VARCHAR(100) | NULL | 文章使用的自定义模板名称，允许对特定文章使用不同的展示模板 |
| sort_order | INT | NOT NULL, DEFAULT 0 | 手动排序序号，数值越小排序越靠前，用于自定义文章顺序 |
| tenant_id | INT | NOT NULL, FOREIGN KEY REFERENCES tenants.Tenant(id) | 所属租户ID，实现多租户隔离，确保不同租户的数据互相隔离 |

**索引**:
- PRIMARY KEY (`id`)
- UNIQUE (`slug`)
- INDEX (`author_id`)
- INDEX (`status`, `created_at`)
- INDEX (`status`, `published_at`)
- INDEX (`tenant_id`, `status`)
- INDEX (`tenant_id`, `published_at`)
- FULLTEXT (`title`, `content`, `excerpt`)

#### 3.1.2 分类模型 (Category)

**表名**: `cms_category`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 分类唯一标识符，系统自动生成 |
| name | VARCHAR(100) | NOT NULL | 分类名称，显示在UI界面和导航菜单中 |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | URL友好的分类名，用于生成分类页面的URL，如"technology" |
| description | TEXT | NULL | 分类详细描述，显示在分类页面顶部，帮助用户理解该分类的内容范围 |
| parent_id | INT | NULL, FOREIGN KEY | 父分类ID，用于创建层级分类结构，NULL表示顶级分类 |
| cover_image | VARCHAR(255) | NULL | 分类封面图片URL，用于分类页面和导航菜单的视觉展示 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 分类创建时间，用于审计和排序 |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 分类最后更新时间，用于审计和缓存失效判断 |
| sort_order | INT | NOT NULL, DEFAULT 0 | 排序序号，数值越小排序越靠前，用于自定义分类显示顺序 |
| tenant_id | INT | NOT NULL, FOREIGN KEY REFERENCES tenants.Tenant(id) | 所属租户ID，实现多租户数据隔离 |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | 分类是否激活，用于临时隐藏某个分类而不删除其内容 |
| seo_title | VARCHAR(255) | NULL | 分类页面的SEO标题，为NULL则使用分类名称 |
| seo_description | TEXT | NULL | 分类页面的SEO描述，用于搜索引擎结果展示，为NULL则使用分类描述 |

**索引**:
- PRIMARY KEY (`id`)
- UNIQUE (`slug`)
- INDEX (`parent_id`)
- INDEX (`is_active`)
- INDEX (`tenant_id`, `parent_id`)
- INDEX (`tenant_id`, `is_active`)

#### 3.1.3 标签模型 (Tag)

**表名**: `cms_tag`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 标签唯一标识符，系统自动生成 |
| name | VARCHAR(50) | NOT NULL | 标签名称，显示在文章页面和标签云中 |
| slug | VARCHAR(50) | NOT NULL, UNIQUE | URL友好的标签名，用于生成标签页面URL，如"machine-learning" |
| description | TEXT | NULL | 标签详细描述，显示在标签页面顶部，解释该标签所代表的主题 |
| group_id | INT | NULL, FOREIGN KEY | 标签组ID，用于将相关标签组织到一起，便于管理和展示 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 标签创建时间，用于审计和排序 |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 标签最后更新时间，用于审计和缓存失效判断 |
| color | VARCHAR(20) | NULL | 标签颜色代码，用于前端显示时的视觉差异化，如"#FF5733" |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | 标签是否激活，用于临时隐藏某个标签而不删除关联 |
| tenant_id | INT | NOT NULL, FOREIGN KEY REFERENCES tenants.Tenant(id) | 所属租户ID，实现多租户数据隔离 |

**索引**:
- PRIMARY KEY (`id`)
- UNIQUE (`slug`)
- INDEX (`group_id`)
- INDEX (`is_active`)
- INDEX (`tenant_id`, `is_active`)

#### 3.1.4 评论模型 (Comment)

**表名**: `cms_comment`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 评论唯一标识符，系统自动生成 |
| article_id | INT | NOT NULL, FOREIGN KEY | 评论所属文章的ID，用于关联评论与文章 |
| parent_id | INT | NULL, FOREIGN KEY | 父评论ID，用于实现评论嵌套回复功能，NULL表示顶级评论 |
| user_id | INT | NULL, FOREIGN KEY | 评论用户ID，关联到用户表，NULL表示匿名/游客评论 |
| guest_name | VARCHAR(50) | NULL | 游客评论者的名称，仅当user_id为NULL时使用 |
| guest_email | VARCHAR(100) | NULL | 游客评论者的邮箱，用于通知回复和Gravatar头像显示 |
| guest_website | VARCHAR(255) | NULL | 游客评论者的网站URL，可选字段，显示为评论者名称的链接 |
| content | TEXT | NOT NULL | 评论内容，支持纯文本或有限的HTML格式 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | 评论状态：'pending'(待审核)、'approved'(已批准)、'spam'(垃圾评论)、'trash'(已删除) |
| ip_address | VARCHAR(45) | NULL | 评论者IP地址，用于防止垃圾评论和滥用 |
| user_agent | VARCHAR(255) | NULL | 评论者浏览器用户代理信息，用于防止机器人评论和统计 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 评论创建时间，用于排序和显示 |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 评论最后更新时间，用于审计和编辑标记 |
| is_pinned | BOOLEAN | NOT NULL, DEFAULT FALSE | 是否置顶评论，置顶评论会显示在评论列表最前面 |
| likes_count | INT | NOT NULL, DEFAULT 0 | 评论获得的点赞数量，用于排序和显示热门评论 |
| tenant_id | INT | NOT NULL, FOREIGN KEY REFERENCES tenants.Tenant(id) | 所属租户ID，实现多租户数据隔离 |

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
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 关系记录唯一标识符，系统自动生成 |
| article_id | INT | NOT NULL, FOREIGN KEY | 文章ID，关联到cms_article表，建立文章与分类的关联 |
| category_id | INT | NOT NULL, FOREIGN KEY | 分类ID，关联到cms_category表，建立文章与分类的关联 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 关系创建时间，用于审计和记录文章何时被归类 |
| tenant_id | INT | NOT NULL, FOREIGN KEY REFERENCES tenants.Tenant(id) | 所属租户ID，保持与关联实体相同的租户隔离 |

**索引**:
- PRIMARY KEY (`id`)
- UNIQUE (`article_id`, `category_id`)
- INDEX (`category_id`)
- INDEX (`tenant_id`, `article_id`)

#### 3.2.2 文章标签关系 (ArticleTag)

**表名**: `cms_article_tag`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 关系记录唯一标识符，系统自动生成 |
| article_id | INT | NOT NULL, FOREIGN KEY | 文章ID，关联到cms_article表，建立文章与标签的关联 |
| tag_id | INT | NOT NULL, FOREIGN KEY | 标签ID，关联到cms_tag表，建立文章与标签的关联 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 关系创建时间，用于审计和记录标签何时添加到文章 |
| tenant_id | INT | NOT NULL, FOREIGN KEY REFERENCES tenants.Tenant(id) | 所属租户ID，保持与关联实体相同的租户隔离 |

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
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 元数据记录唯一标识符，系统自动生成 |
| article_id | INT | NOT NULL, FOREIGN KEY, UNIQUE | 文章ID，关联到cms_article表，每篇文章只有一条元数据记录 |
| seo_title | VARCHAR(255) | NULL | 为搜索引擎优化的自定义标题，为NULL则使用文章原标题，长度通常控制在60个字符以内 |
| seo_description | TEXT | NULL | 为搜索引擎优化的自定义描述，显示在搜索结果中，长度通常控制在160个字符以内 |
| seo_keywords | VARCHAR(255) | NULL | 为搜索引擎优化的关键词列表，以逗号分隔，帮助旧搜索引擎理解文章主题 |
| og_title | VARCHAR(255) | NULL | Open Graph协议的标题，用于社交媒体分享时显示，为NULL则使用seo_title或文章标题 |
| og_description | TEXT | NULL | Open Graph协议的描述，用于社交媒体分享时显示，为NULL则使用seo_description |
| og_image | VARCHAR(255) | NULL | Open Graph协议的图片URL，用于社交媒体分享时的缩略图，为NULL则使用文章封面图 |
| schema_markup | LONGTEXT | NULL | JSON-LD结构化数据标记，用于增强搜索结果显示，如添加评分、作者等信息 |
| canonical_url | VARCHAR(255) | NULL | 规范URL，当同一内容有多个URL时，指示搜索引擎哪个是主URL，避免重复内容问题 |
| robots | VARCHAR(100) | NULL | 针对此页面的robots指令，如"noindex,nofollow"表示不索引且不跟踪链接，为NULL则遵循全局设置 |
| custom_meta | LONGTEXT | NULL | 自定义元数据，JSON格式存储，可用于存储特定于文章的额外SEO信息或第三方集成数据 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 元数据创建时间，用于审计和排序 |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 元数据最后更新时间，用于审计和缓存失效判断 |
| tenant_id | INT | NOT NULL, FOREIGN KEY REFERENCES tenants.Tenant(id) | 所属租户ID，实现多租户数据隔离 |

**索引**:
- PRIMARY KEY (`id`)
- UNIQUE (`article_id`)
- INDEX (`tenant_id`)

#### 3.3.2 文章统计 (ArticleStatistics)

**表名**: `cms_article_statistics`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 统计记录唯一标识符，系统自动生成 |
| article_id | INT | NOT NULL, FOREIGN KEY, UNIQUE | 文章ID，关联到cms_article表，每篇文章只有一条统计记录 |
| views_count | INT | NOT NULL, DEFAULT 0 | 文章总浏览次数，包括重复访问，用于排序和统计热门文章 |
| unique_views_count | INT | NOT NULL, DEFAULT 0 | 文章独立访客浏览次数，每个用户/IP只计算一次，更准确反映文章影响力 |
| likes_count | INT | NOT NULL, DEFAULT 0 | 文章获得的点赞数量，用于评估读者对文章的积极反馈 |
| dislikes_count | INT | NOT NULL, DEFAULT 0 | 文章获得的踩数量，用于评估读者对文章的负面反馈 |
| comments_count | INT | NOT NULL, DEFAULT 0 | 文章评论数量，包括所有状态的评论，用于展示文章互动热度 |
| shares_count | INT | NOT NULL, DEFAULT 0 | 文章被分享到社交媒体的次数，评估文章传播能力 |
| bookmarks_count | INT | NOT NULL, DEFAULT 0 | 用户收藏文章的次数，评估文章的长期价值 |
| avg_reading_time | INT | NOT NULL, DEFAULT 0 | 平均阅读时长(秒)，反映内容质量和吸引力 |
| bounce_rate | DECIMAL(5,2) | NOT NULL, DEFAULT 0 | 跳出率(%)，访问文章后立即离开网站的访客比例，反映内容与访客兴趣匹配度 |
| last_updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 统计数据最后更新时间，用于增量更新和缓存策略 |
| tenant_id | INT | NOT NULL, FOREIGN KEY REFERENCES tenants.Tenant(id) | 所属租户ID，实现多租户数据隔离 |

**索引**:
- PRIMARY KEY (`id`)
- UNIQUE (`article_id`)
- INDEX (`views_count`)
- INDEX (`likes_count`)
- INDEX (`tenant_id`, `views_count`)
- INDEX (`tenant_id`, `likes_count`)

#### 3.3.3 文章版本 (ArticleVersion)

**表名**: `cms_article_version`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 版本记录唯一标识符，系统自动生成 |
| article_id | INT | NOT NULL, FOREIGN KEY | 文章ID，关联到cms_article表，标识此版本属于哪篇文章 |
| title | VARCHAR(255) | NOT NULL | 该版本的文章标题，保留历史标题记录 |
| content | LONGTEXT | NOT NULL | 该版本的文章内容，保留完整历史内容 |
| content_type | VARCHAR(20) | NOT NULL | 该版本的内容格式类型(markdown/html)，以便正确渲染历史版本 |
| excerpt | TEXT | NULL | 该版本的文章摘要，保留历史摘要记录 |
| editor_id | INT | NOT NULL, FOREIGN KEY | 编辑者用户ID，记录谁进行了此次修改，用于审计和责任追踪 |
| version_number | INT | NOT NULL | 版本号，从1开始递增，用于排序和识别版本 |
| change_description | TEXT | NULL | 版本变更说明，编辑者对本次修改的描述，帮助理解变更原因 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 版本创建时间，用于时间轴展示和回溯历史变更 |
| diff_data | LONGTEXT | NULL | 与上一版本的差异数据，JSON格式，存储具体变更内容，减少存储需求并便于展示差异 |
| tenant_id | INT | NOT NULL, FOREIGN KEY REFERENCES tenants.Tenant(id) | 所属租户ID，实现多租户数据隔离 |

**索引**:
- PRIMARY KEY (`id`)
- INDEX (`article_id`, `version_number`)
- INDEX (`editor_id`)
- INDEX (`tenant_id`, `article_id`, `version_number`)

#### 3.3.4 用户互动 (Interaction)

**表名**: `cms_interaction`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 互动记录唯一标识符，系统自动生成 |
| user_id | INT | NOT NULL, FOREIGN KEY | 用户ID，关联到users表，记录进行互动的用户 |
| article_id | INT | NOT NULL, FOREIGN KEY | 文章ID，关联到cms_article表，记录互动的目标文章 |
| type | VARCHAR(20) | NOT NULL | 互动类型：'like'(点赞)、'dislike'(踩)、'bookmark'(收藏)、'share'(分享)，用于区分不同互动行为 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 互动发生时间，用于时间序列分析和最近活动展示 |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 互动最后更新时间，用于处理互动状态变化，如取消点赞 |
| ip_address | VARCHAR(45) | NULL | 用户互动时的IP地址，用于防止刷票和滥用检测 |
| user_agent | VARCHAR(255) | NULL | 用户互动时的浏览器用户代理，用于区分设备类型和防止机器人互动 |
| extra_data | TEXT | NULL | 附加数据，JSON格式，存储特定互动类型的额外信息，如分享平台、分享渠道 |
| tenant_id | INT | NOT NULL, FOREIGN KEY REFERENCES tenants.Tenant(id) | 所属租户ID，实现多租户数据隔离 |

**索引**:
- PRIMARY KEY (`id`)
- UNIQUE (`user_id`, `article_id`, `type`)
- INDEX (`article_id`, `type`)
- INDEX (`user_id`, `type`)
- INDEX (`tenant_id`, `user_id`, `article_id`, `type`)

#### 3.3.5 标签组 (TagGroup)

**表名**: `cms_tag_group`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 标签组唯一标识符，系统自动生成 |
| name | VARCHAR(50) | NOT NULL | 标签组名称，如"技术领域"、"内容形式"，用于在管理界面分类显示标签 |
| slug | VARCHAR(50) | NOT NULL, UNIQUE | URL友好的标签组名，用于生成标签组页面URL |
| description | TEXT | NULL | 标签组描述，解释该组标签的共同特征或用途 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 标签组创建时间，用于审计和排序 |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 标签组最后更新时间，用于审计和缓存失效判断 |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | 标签组是否激活，用于临时隐藏整组标签而不删除关联 |
| tenant_id | INT | NOT NULL, FOREIGN KEY REFERENCES tenants.Tenant(id) | 所属租户ID，实现多租户数据隔离 |

**索引**:
- PRIMARY KEY (`id`)
- UNIQUE (`slug`)
- INDEX (`is_active`)
- INDEX (`tenant_id`, `is_active`)

#### 3.3.6 用户等级 (UserLevel)

**表名**: `cms_user_level`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 等级唯一标识符，系统自动生成 |
| tenant_id | INT | NOT NULL, FOREIGN KEY | 所属租户ID，允许不同租户定义自己的等级体系 |
| name | VARCHAR(50) | NOT NULL | 等级名称，如"初级作者"、"高级编辑"，显示在用户资料和权限管理界面 |
| description | TEXT | NULL | 等级详细描述，解释该等级的权限范围和获取条件 |
| level | INT | NOT NULL | 等级值，数字越大等级越高，用于排序和比较不同等级的权重 |
| max_articles | INT | NOT NULL, DEFAULT 10 | 该等级用户最大可发布文章数量，用于资源配额控制 |
| max_storage_mb | INT | NOT NULL, DEFAULT 100 | 该等级用户最大可用存储空间(MB)，控制媒体文件上传限制 |
| permissions | LONGTEXT | NULL | JSON格式存储的权限列表，详细定义该等级可执行的操作，如{'create_article':true,'moderate_comments':false} |
| is_default | BOOLEAN | NOT NULL, DEFAULT FALSE | 是否为默认等级，新用户注册时自动分配的等级 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 等级创建时间，用于审计和排序 |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 等级最后更新时间，用于审计和权限变更记录 |

**索引**:
- PRIMARY KEY (`id`)
- INDEX (`tenant_id`)
- INDEX (`level`)
- INDEX (`is_default`)

#### 3.3.7 用户等级关系 (UserLevelRelation)

**表名**: `cms_user_level_relation`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 关系记录唯一标识符，系统自动生成 |
| user_id | INT | NOT NULL, FOREIGN KEY | 用户ID，关联到users表，标识被赋予等级的用户 |
| level_id | INT | NOT NULL, FOREIGN KEY | 等级ID，关联到cms_user_level表，标识用户被赋予的等级 |
| start_time | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 等级生效开始时间，用于定时等级变更和会员周期管理 |
| end_time | DATETIME | NULL | 等级结束时间，NULL表示永久有效，用于管理临时提升的等级或订阅制等级 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 关系创建时间，用于审计和记录等级分配历史 |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 关系最后更新时间，用于审计和等级变更记录 |
| tenant_id | INT | NOT NULL, FOREIGN KEY REFERENCES tenants.Tenant(id) | 所属租户ID，实现多租户数据隔离 |

**索引**:
- PRIMARY KEY (`id`)
- UNIQUE (`user_id`, `level_id`)
- INDEX (`level_id`)
- INDEX (`end_time`)
- INDEX (`tenant_id`, `user_id`)

### 3.4 日志与记录模型

#### 3.4.1 访问日志 (AccessLog)

**表名**: `cms_access_log`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 日志记录唯一标识符，系统自动生成 |
| article_id | INT | NOT NULL, FOREIGN KEY | 被访问文章的ID，关联到cms_article表，追踪文章流量来源 |
| user_id | INT | NULL, FOREIGN KEY | 访问用户ID，用于分析注册用户的阅读行为，NULL表示匿名访问 |
| session_id | VARCHAR(100) | NULL | 会话ID，用于跟踪同一访客的浏览路径，分析用户行为路径 |
| ip_address | VARCHAR(45) | NOT NULL | 访问者IP地址，用于地理位置分析和防止刷量 |
| user_agent | VARCHAR(255) | NULL | 用户浏览器代理信息，用于分析访客设备类型和浏览器偏好 |
| referer | VARCHAR(255) | NULL | 来源URL，记录访客从哪个页面链接过来，用于分析流量来源 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 访问时间，用于时间序列分析和流量峰值识别 |
| reading_time | INT | NULL | 阅读时长(秒)，用于评估内容质量和用户参与度 |
| country | VARCHAR(50) | NULL | 访问者国家，通过IP地址解析，用于地域流量分析 |
| region | VARCHAR(100) | NULL | 访问者区域/省份，用于更精细的地域定位 |
| city | VARCHAR(100) | NULL | 访问者城市，用于本地化营销和内容策略 |
| device | VARCHAR(50) | NULL | 设备类型：desktop(桌面电脑)、mobile(移动设备)、tablet(平板设备)等，用于响应式设计优化 |
| browser | VARCHAR(50) | NULL | 浏览器类型，如Chrome、Firefox、Safari等，用于浏览器兼容性决策 |
| os | VARCHAR(50) | NULL | 操作系统，如Windows、iOS、Android等，用于平台特定优化 |
| tenant_id | INT | NOT NULL, FOREIGN KEY REFERENCES tenants.Tenant(id) | 所属租户ID，实现多租户数据隔离 |

**索引**:
- PRIMARY KEY (`id`)
- INDEX (`article_id`, `created_at`)
- INDEX (`user_id`)
- INDEX (`session_id`)
- INDEX (`ip_address`)
- INDEX (`created_at`)
- INDEX (`tenant_id`, `article_id`, `created_at`)

#### 3.4.2 操作日志 (OperationLog)

**表名**: `cms_operation_log`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 日志记录唯一标识符，系统自动生成 |
| user_id | INT | NOT NULL, FOREIGN KEY | 操作用户ID，关联到users表，记录执行操作的人员 |
| action | VARCHAR(50) | NOT NULL | 操作类型：如'create'(创建)、'update'(更新)、'delete'(删除)、'publish'(发布)等，用于分类操作行为 |
| entity_type | VARCHAR(50) | NOT NULL | 实体类型：如'article'(文章)、'category'(分类)、'comment'(评论)等，记录操作的对象类型 |
| entity_id | INT | NULL | 实体ID，操作对象的唯一标识，NULL表示操作不针对特定实体(如批量操作) |
| details | TEXT | NULL | 操作详情，JSON格式，记录具体的变更内容，如{'title': {'old': '原标题', 'new': '新标题'}} |
| ip_address | VARCHAR(45) | NOT NULL | 操作者IP地址，用于安全审计和可疑操作追踪 |
| user_agent | VARCHAR(255) | NULL | 用户浏览器代理信息，用于确认操作来源设备 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 操作时间，用于时间线重建和操作序列分析 |
| tenant_id | INT | NOT NULL, FOREIGN KEY REFERENCES tenants.Tenant(id) | 所属租户ID，实现多租户数据隔离 |

**索引**:
- PRIMARY KEY (`id`)
- INDEX (`user_id`)
- INDEX (`entity_type`, `entity_id`)
- INDEX (`action`)
- INDEX (`created_at`)
- INDEX (`tenant_id`, `entity_type`, `entity_id`)

## 4. 数据库关系图（详细ER图）

```
+----------------+        +-------------------+        +---------------+
| Article        |        | ArticleCategory   |        | Category      |
+----------------+        +-------------------+        +---------------+
| id             |<-------| article_id        |------->| id            |
| title          |        | category_id       |        | name          |
| slug           |        | tenant_id         |        | slug          |
| content        |        +-------------------+        | description   |
| content_type   |                                     | parent_id     |
| excerpt        |        +-------------------+        | cover_image   |
| author_id      |        | ArticleTag        |        | created_at    |
| status         |        +-------------------+        | updated_at    |
| is_featured    |<-------| article_id        |        | sort_order    |
| is_pinned      |        | tag_id            |------->| is_active     |
| allow_comment  |        | tenant_id         |        | seo_title     |
| visibility     |        +-------------------+        | seo_description|
| password       |                                     | tenant_id     |
| created_at     |        +-------------------+        +---------------+
| updated_at     |        | TagGroup          |        
| published_at   |        +-------------------+        +---------------+
| cover_image    |        | id                |        | Tag           |
| template       |        | name              |        +---------------+
| sort_order     |        | slug              |        | id            |
| tenant_id      |        | description       |<-------| name          |
+----------------+        | created_at        |        | slug          |
       |                  | updated_at        |        | description   |
       |                  | is_active         |        | group_id      |
       |                  | tenant_id         |        | created_at    |
       |                  +-------------------+        | updated_at    |
       |                                              | color         |
       |                  +-------------------+        | is_active     |
       |                  | ArticleMeta       |        | tenant_id     |
       |                  +-------------------+        +---------------+
       |----------------->| id                |        
       |                  | article_id        |        +---------------+
       |                  | seo_title         |        | Comment       |
       |                  | seo_description   |        +---------------+
       |                  | seo_keywords      |        | id            |
       |                  | og_title          |<-------| article_id    |
       |                  | og_description    |        | parent_id     |
       |                  | og_image          |        | user_id       |
       |                  | schema_markup     |        | guest_name    |
       |                  | canonical_url     |        | guest_email   |
       |                  | robots            |        | guest_website |
       |                  | custom_meta       |        | content       |
       |                  | created_at        |        | status        |
       |                  | updated_at        |        | ip_address    |
       |                  | tenant_id         |        | user_agent    |
       |                  +-------------------+        | created_at    |
       |                                              | updated_at    |
       |                  +-------------------+        | is_pinned     |
       |                  | ArticleStatistics |        | likes_count   |
       |                  +-------------------+        | tenant_id     |
       |----------------->| id                |        +---------------+
       |                  | article_id        |        
       |                  | views_count       |        +---------------+
       |                  | unique_views_count|        | Interaction   |
       |                  | likes_count       |        +---------------+
       |                  | dislikes_count    |        | id            |
       |                  | comments_count    |<-------| article_id    |
       |                  | shares_count      |        | user_id       |
       |                  | bookmarks_count   |        | type          |
       |                  | avg_reading_time  |        | created_at    |
       |                  | bounce_rate       |        | updated_at    |
       |                  | last_updated_at   |        | ip_address    |
       |                  | tenant_id         |        | user_agent    |
       |                  +-------------------+        | extra_data    |
       |                                              | tenant_id     |
       |                  +-------------------+        +---------------+
       |                  | ArticleVersion    |        
       |----------------->| id                |        +---------------+
                          | article_id        |        | AccessLog     |
                          | title             |        +---------------+
                          | content           |        | id            |
                          | content_type      |<-------| article_id    |
                          | excerpt           |        | user_id       |
                          | editor_id         |        | session_id    |
                          | version_number    |        | ip_address    |
                          | change_description|        | user_agent    |
                          | created_at        |        | referer       |
                          | diff_data         |        | created_at    |
                          | tenant_id         |        | reading_time  |
                          +-------------------+        | country       |
                                                      | region        |
                                                      | city          |
                          +-------------------+        | device        |
                          | UserLevel         |        | browser       |
                          +-------------------+        | os            |
                          | id                |        | tenant_id     |
                          | tenant_id         |        +---------------+
                          | name              |        
                          | description       |        
                          | level             |        +-------------------+
                          | max_articles      |        | UserLevelRelation |
                          | max_storage_mb    |        +-------------------+
                          | permissions       |<-------| id                |
                          | is_default        |        | user_id           |
                          | created_at        |        | level_id          |
                          | updated_at        |        | start_time        |
                          +-------------------+        | end_time          |
                                                      | created_at        |
                                                      | updated_at        |
                                                      | tenant_id         |
                                                      +-------------------+
                                                             |
                                                             |
                                                             v
                                                      +---------------+
                                                      | User          |
                                                      +---------------+
                                                      | id            |
                                                      | username      |
                                                      | email         |
                                                      | ...           |
                                                      +---------------+
```

## 5. 索引设计说明

为了提高系统性能，针对MySQL数据库进行了以下索引设计优化：

### 5.1 主键索引
- 所有表都使用自增整数ID作为主键，便于索引管理和关联查询优化

### 5.2 唯一索引
- 应用于需要保证唯一性的字段，如slug字段
- 文章、分类、标签的slug字段作为唯一索引，优化URL友好的访问
- 用户互动表中(user_id, article_id, type)组合作为唯一索引，防止重复操作

### 5.3 外键索引
- 所有外键关系字段都创建了索引，优化JOIN操作
- 关系表中的两端外键都创建了索引

### 5.4 复合索引
- 针对常用的查询条件组合创建复合索引
- 例如(status, published_at)用于筛选特定状态且按发布时间排序的查询

### 5.5 全文索引
- 在Article表的title、content和excerpt字段上创建全文索引，优化文章搜索功能
- MySQL 5.7+支持内置的全文索引，替代或补充Elasticsearch的搜索功能

## 6. 数据模型设计考量

### 6.1 扩展性设计
- 使用ArticleMeta表存储SEO相关数据，而非直接在Article表中添加字段，便于未来SEO策略的调整
- 使用ArticleVersion表存储文章历史版本，支持版本控制功能
- 标签分组功能设计，便于标签的管理和扩展

### 6.2 性能优化设计
- 独立的ArticleStatistics表存储统计数据，避免频繁更新主表
- 合理的字段类型选择，如使用TEXT而非VARCHAR存储长文本
- 访问日志表分区设计，考虑按时间分区以提高查询性能

### 6.3 关系设计
- 多对多关系使用中间表实现，如ArticleTag和ArticleCategory
- 评论支持自引用关系，实现嵌套评论功能
- 分类支持树形结构，实现多级分类功能

### 6.4 安全性设计
- 存储IP地址使用VARCHAR(45)以支持IPv6
- 密码字段使用VARCHAR(128)以适应加密后的密码长度
- 记录用户操作日志，支持审计和安全追踪

## 7. 数据迁移与初始化策略

### 7.1 迁移策略
- 使用Django migrations管理数据库版本
- 编写数据迁移脚本，处理模式变更
- 大型结构变更采用分步迁移策略，降低风险

### 7.2 初始数据
- 预设基础分类数据
- 预设管理员角色及权限
- 预设系统配置和默认模板

## 8. 数据备份策略

### 8.1 备份计划
- 每日增量备份
- 每周完整备份
- 每月归档备份

### 8.2 备份内容
- 数据库完整备份
- 媒体文件备份
- 配置文件备份

## 9. 数据维护计划

### 9.1 定期维护任务
- 优化表结构和索引
- 清理过期的访问日志数据
- 统计信息重新计算与校验

### 9.2 监控指标
- 数据库大小增长率
- 慢查询监控
- 索引使用率监控 

## 10. 租户集成设计

为了支持多租户架构，CMS系统需要进行租户隔离设计，确保不同租户的内容互不干扰。

### 10.1 租户隔离策略

我们使用以下策略实现租户隔离：

1. **表隔离**: 每个核心表都包含`tenant_id`字段，用于区分不同租户的数据
2. **查询过滤**: 所有查询都通过`tenant_id`进行过滤，确保只返回当前租户的数据
3. **中间件控制**: 实现租户中间件，自动为每个请求确定当前租户并应用相应的权限和数据范围

### 10.2 租户相关表结构修改

所有核心表都需要添加`tenant_id`字段，包括：

#### 10.2.1 文章表 (Article)

添加字段:
```
tenant_id INT NOT NULL, FOREIGN KEY REFERENCES tenants.Tenant(id)
```

并添加索引:
```
INDEX (tenant_id, status)
INDEX (tenant_id, published_at)
```

#### 10.2.2 分类表 (Category)

添加字段:
```
tenant_id INT NOT NULL, FOREIGN KEY REFERENCES tenants.Tenant(id)
```

并添加索引:
```
INDEX (tenant_id, parent_id)
INDEX (tenant_id, is_active)
```

#### 10.2.3 标签表 (Tag)

添加字段:
```
tenant_id INT NOT NULL, FOREIGN KEY REFERENCES tenants.Tenant(id)
```

并添加索引:
```
INDEX (tenant_id, is_active)
```

#### 10.2.4 其他表

同样地，其他所有相关表都需要添加`tenant_id`字段并建立相应的索引，包括：
- 评论表 (Comment)
- 文章元数据表 (ArticleMeta)
- 文章统计表 (ArticleStatistics)
- 文章版本表 (ArticleVersion)
- 用户互动表 (Interaction)
- 标签组表 (TagGroup)

### 10.3 租户资源配额设计

为管理租户资源使用，我们利用现有的`TenantQuota`模型，并在CMS模块中添加以下监控点：

1. **文章数量监控**: 每当创建新文章时，检查租户的文章配额
2. **存储使用监控**: 上传图片或其他媒体文件时，检查并更新租户的存储使用情况
3. **用户权限监控**: 检查用户是否拥有对应操作的权限，基于租户和用户等级配置

### 10.4 数据模型示意图 (租户集成)

```
+---------------+       +----------------+       +---------------+
| Tenant        |<------| CMS Article    |------>| User          |
+---------------+       +----------------+       +---------------+
      |                       |                        |
      |                       |                        |
      v                       v                        v
+---------------+       +----------------+       +---------------+
| TenantQuota   |       | ArticleMeta    |       | UserLevel     |
+---------------+       +----------------+       +---------------+
```

### 10.5 迁移策略

将已有系统迁移到支持多租户架构的流程：

1. 添加租户字段到所有相关表
2. 建立默认租户并将现有数据关联到默认租户
3. 实现租户中间件以处理请求中的租户信息
4. 修改所有查询以包含租户过滤
5. 添加租户权限检查机制
6. 实现租户配额管理 