"""
CMS系统模型定义
"""
import logging
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger(__name__)

class Article(models.Model):
    """
    文章模型
    """
    CONTENT_TYPE_CHOICES = (
        ('markdown', 'Markdown'),
        ('html', 'HTML'),
    )
    
    STATUS_CHOICES = (
        ('draft', '草稿'),
        ('pending', '待审核'),
        ('published', '已发布'),
        ('archived', '已归档'),
    )
    
    VISIBILITY_CHOICES = (
        ('public', '公开'),
        ('private', '仅登录用户'),
        ('password', '密码访问'),
    )
    
    title = models.CharField(_("文章标题"), max_length=255)
    slug = models.SlugField(_("URL别名"), max_length=255, unique=True, db_index=True)
    content = models.TextField(_("文章内容"))
    content_type = models.CharField(_("内容类型"), max_length=20, choices=CONTENT_TYPE_CHOICES, default='markdown')
    excerpt = models.TextField(_("文章摘要"), blank=True, null=True)
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="articles",
        verbose_name=_("作者")
    )
    status = models.CharField(_("状态"), max_length=20, choices=STATUS_CHOICES, default='draft')
    is_featured = models.BooleanField(_("是否特色"), default=False)
    is_pinned = models.BooleanField(_("是否置顶"), default=False)
    allow_comment = models.BooleanField(_("允许评论"), default=True)
    visibility = models.CharField(_("可见性"), max_length=20, choices=VISIBILITY_CHOICES, default='public')
    password = models.CharField(_("访问密码"), max_length=128, blank=True, null=True)
    created_at = models.DateTimeField(_("创建时间"), auto_now_add=True)
    updated_at = models.DateTimeField(_("更新时间"), auto_now=True)
    published_at = models.DateTimeField(_("发布时间"), blank=True, null=True)
    cover_image = models.CharField(_("封面图片"), max_length=255, blank=True, null=True)
    template = models.CharField(_("模板"), max_length=100, blank=True, null=True)
    sort_order = models.IntegerField(_("排序"), default=0)
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name="articles",
        verbose_name=_("所属租户")
    )
    
    class Meta:
        verbose_name = _('文章')
        verbose_name_plural = _('文章')
        db_table = 'cms_article'
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['status', 'published_at']),
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['tenant', 'published_at']),
        ]
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        # 如果没有设置slug，根据标题自动生成
        if not self.slug:
            self.slug = slugify(self.title)
        
        # 如果没有设置摘要，从内容中提取
        if not self.excerpt and self.content:
            # 提取前200个字符作为摘要
            self.excerpt = self.content[:200].replace('#', '').strip()
        
        super().save(*args, **kwargs)
        
        # 如果是首次创建文章，自动创建文章统计记录
        if kwargs.get('force_insert', False):
            try:
                ArticleStatistics.objects.get(article=self)
            except ArticleStatistics.DoesNotExist:
                ArticleStatistics.objects.create(article=self, tenant=self.tenant)


class Category(models.Model):
    """
    分类模型
    """
    name = models.CharField(_("分类名称"), max_length=100)
    slug = models.SlugField(_("URL别名"), max_length=100, unique=True)
    description = models.TextField(_("分类描述"), blank=True, null=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        related_name="children",
        verbose_name=_("父分类"),
        blank=True,
        null=True
    )
    cover_image = models.CharField(_("封面图片"), max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(_("创建时间"), auto_now_add=True)
    updated_at = models.DateTimeField(_("更新时间"), auto_now=True)
    sort_order = models.IntegerField(_("排序"), default=0)
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name="categories",
        verbose_name=_("所属租户")
    )
    is_active = models.BooleanField(_("是否激活"), default=True)
    seo_title = models.CharField(_("SEO标题"), max_length=255, blank=True, null=True)
    seo_description = models.TextField(_("SEO描述"), blank=True, null=True)
    
    class Meta:
        verbose_name = _('分类')
        verbose_name_plural = _('分类')
        db_table = 'cms_category'
        ordering = ['sort_order', 'name']
        indexes = [
            models.Index(fields=['parent']),
            models.Index(fields=['is_active']),
            models.Index(fields=['tenant', 'parent']),
            models.Index(fields=['tenant', 'is_active']),
        ]
    
    def __str__(self):
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name
    
    def save(self, *args, **kwargs):
        # 如果没有设置slug，根据名称自动生成
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class TagGroup(models.Model):
    """
    标签组模型
    """
    name = models.CharField(_("标签组名称"), max_length=50)
    slug = models.SlugField(_("URL别名"), max_length=50, unique=True)
    description = models.TextField(_("标签组描述"), blank=True, null=True)
    created_at = models.DateTimeField(_("创建时间"), auto_now_add=True)
    updated_at = models.DateTimeField(_("更新时间"), auto_now=True)
    is_active = models.BooleanField(_("是否激活"), default=True)
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name="tag_groups",
        verbose_name=_("所属租户")
    )
    
    class Meta:
        verbose_name = _('标签组')
        verbose_name_plural = _('标签组')
        db_table = 'cms_tag_group'
        ordering = ['name']
        indexes = [
            models.Index(fields=['is_active']),
            models.Index(fields=['tenant', 'is_active']),
        ]
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # 如果没有设置slug，根据名称自动生成
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Tag(models.Model):
    """
    标签模型
    """
    name = models.CharField(_("标签名称"), max_length=50)
    slug = models.SlugField(_("URL别名"), max_length=50, unique=True)
    description = models.TextField(_("标签描述"), blank=True, null=True)
    group = models.ForeignKey(
        TagGroup,
        on_delete=models.SET_NULL,
        related_name="tags",
        verbose_name=_("标签组"),
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(_("创建时间"), auto_now_add=True)
    updated_at = models.DateTimeField(_("更新时间"), auto_now=True)
    color = models.CharField(_("颜色"), max_length=20, blank=True, null=True)
    is_active = models.BooleanField(_("是否激活"), default=True)
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name="tags",
        verbose_name=_("所属租户")
    )
    
    class Meta:
        verbose_name = _('标签')
        verbose_name_plural = _('标签')
        db_table = 'cms_tag'
        ordering = ['name']
        indexes = [
            models.Index(fields=['group']),
            models.Index(fields=['is_active']),
            models.Index(fields=['tenant', 'is_active']),
        ]
    
    def __str__(self):
        if self.group:
            return f"{self.group.name}: {self.name}"
        return self.name
    
    def save(self, *args, **kwargs):
        # 如果没有设置slug，根据名称自动生成
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Comment(models.Model):
    """
    评论模型
    """
    STATUS_CHOICES = (
        ('pending', '待审核'),
        ('approved', '已批准'),
        ('spam', '垃圾评论'),
        ('trash', '已删除'),
    )
    
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name="comments",
        verbose_name=_("文章")
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        related_name="replies",
        verbose_name=_("父评论"),
        blank=True,
        null=True
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="cms_comments",
        verbose_name=_("用户"),
        blank=True,
        null=True
    )
    guest_name = models.CharField(_("访客名称"), max_length=50, blank=True, null=True)
    guest_email = models.EmailField(_("访客邮箱"), blank=True, null=True)
    guest_website = models.URLField(_("访客网站"), blank=True, null=True)
    content = models.TextField(_("评论内容"))
    status = models.CharField(_("状态"), max_length=20, choices=STATUS_CHOICES, default='pending')
    ip_address = models.GenericIPAddressField(_("IP地址"), blank=True, null=True)
    user_agent = models.CharField(_("用户代理"), max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(_("创建时间"), auto_now_add=True)
    updated_at = models.DateTimeField(_("更新时间"), auto_now=True)
    is_pinned = models.BooleanField(_("是否置顶"), default=False)
    likes_count = models.IntegerField(_("点赞数"), default=0)
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name="comments",
        verbose_name=_("所属租户")
    )
    
    class Meta:
        verbose_name = _('评论')
        verbose_name_plural = _('评论')
        db_table = 'cms_comment'
        ordering = ['-is_pinned', '-created_at']
        indexes = [
            models.Index(fields=['article']),
            models.Index(fields=['user']),
            models.Index(fields=['parent']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['tenant', 'status', 'created_at']),
        ]
    
    def __str__(self):
        if self.user:
            author = self.user.username
        else:
            author = self.guest_name or "访客"
        return f"{author}评论: {self.content[:30]}..."


class ArticleCategory(models.Model):
    """
    文章分类关系
    """
    article = models.ForeignKey(
        Article, 
        on_delete=models.CASCADE,
        related_name="article_categories",
        verbose_name=_("文章")
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="article_categories",
        verbose_name=_("分类")
    )
    created_at = models.DateTimeField(_("创建时间"), auto_now_add=True)
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name="article_categories",
        verbose_name=_("所属租户")
    )
    
    class Meta:
        verbose_name = _('文章分类关系')
        verbose_name_plural = _('文章分类关系')
        db_table = 'cms_article_category'
        unique_together = ('article', 'category')
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['tenant', 'article']),
        ]
    
    def __str__(self):
        return f"{self.article.title} - {self.category.name}"


class ArticleTag(models.Model):
    """
    文章标签关系
    """
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name="article_tags",
        verbose_name=_("文章")
    )
    tag = models.ForeignKey(
        Tag,
        on_delete=models.CASCADE,
        related_name="article_tags",
        verbose_name=_("标签")
    )
    created_at = models.DateTimeField(_("创建时间"), auto_now_add=True)
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name="article_tags",
        verbose_name=_("所属租户")
    )
    
    class Meta:
        verbose_name = _('文章标签关系')
        verbose_name_plural = _('文章标签关系')
        db_table = 'cms_article_tag'
        unique_together = ('article', 'tag')
        indexes = [
            models.Index(fields=['tag']),
            models.Index(fields=['tenant', 'article']),
        ]
    
    def __str__(self):
        return f"{self.article.title} - {self.tag.name}"


class ArticleMeta(models.Model):
    """
    文章元数据
    """
    article = models.OneToOneField(
        Article,
        on_delete=models.CASCADE,
        related_name="meta",
        verbose_name=_("文章")
    )
    seo_title = models.CharField(_("SEO标题"), max_length=255, blank=True, null=True)
    seo_description = models.TextField(_("SEO描述"), blank=True, null=True)
    seo_keywords = models.CharField(_("SEO关键词"), max_length=255, blank=True, null=True)
    og_title = models.CharField(_("OG标题"), max_length=255, blank=True, null=True)
    og_description = models.TextField(_("OG描述"), blank=True, null=True)
    og_image = models.CharField(_("OG图片"), max_length=255, blank=True, null=True)
    schema_markup = models.TextField(_("结构化数据标记"), blank=True, null=True)
    canonical_url = models.URLField(_("规范URL"), blank=True, null=True)
    robots = models.CharField(_("Robots指令"), max_length=100, blank=True, null=True)
    custom_meta = models.TextField(_("自定义元数据"), blank=True, null=True)
    created_at = models.DateTimeField(_("创建时间"), auto_now_add=True)
    updated_at = models.DateTimeField(_("更新时间"), auto_now=True)
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name="article_metas",
        verbose_name=_("所属租户")
    )
    
    class Meta:
        verbose_name = _('文章元数据')
        verbose_name_plural = _('文章元数据')
        db_table = 'cms_article_meta'
        indexes = [
            models.Index(fields=['tenant']),
        ]
    
    def __str__(self):
        return f"{self.article.title}的元数据"


class ArticleStatistics(models.Model):
    """
    文章统计
    """
    article = models.OneToOneField(
        Article,
        on_delete=models.CASCADE,
        related_name="statistics",
        verbose_name=_("文章")
    )
    views_count = models.IntegerField(_("浏览次数"), default=0)
    unique_views_count = models.IntegerField(_("独立访客浏览次数"), default=0)
    likes_count = models.IntegerField(_("点赞数"), default=0)
    dislikes_count = models.IntegerField(_("踩数"), default=0)
    comments_count = models.IntegerField(_("评论数"), default=0)
    shares_count = models.IntegerField(_("分享数"), default=0)
    bookmarks_count = models.IntegerField(_("收藏数"), default=0)
    avg_reading_time = models.IntegerField(_("平均阅读时长(秒)"), default=0)
    bounce_rate = models.DecimalField(_("跳出率(%)"), max_digits=5, decimal_places=2, default=0)
    last_updated_at = models.DateTimeField(_("最后更新时间"), auto_now=True)
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name="article_statistics",
        verbose_name=_("所属租户")
    )
    
    class Meta:
        verbose_name = _('文章统计')
        verbose_name_plural = _('文章统计')
        db_table = 'cms_article_statistics'
        indexes = [
            models.Index(fields=['views_count']),
            models.Index(fields=['likes_count']),
            models.Index(fields=['tenant', 'views_count']),
            models.Index(fields=['tenant', 'likes_count']),
        ]
    
    def __str__(self):
        return f"{self.article.title}的统计数据"
        
        
class ArticleVersion(models.Model):
    """
    文章版本
    """
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name="versions",
        verbose_name=_("文章")
    )
    title = models.CharField(_("标题"), max_length=255)
    content = models.TextField(_("内容"))
    content_type = models.CharField(_("内容类型"), max_length=20)
    excerpt = models.TextField(_("摘要"), blank=True, null=True)
    editor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="edited_versions",
        verbose_name=_("编辑者")
    )
    version_number = models.IntegerField(_("版本号"))
    change_description = models.TextField(_("变更说明"), blank=True, null=True)
    created_at = models.DateTimeField(_("创建时间"), auto_now_add=True)
    diff_data = models.TextField(_("差异数据"), blank=True, null=True)
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name="article_versions",
        verbose_name=_("所属租户")
    )
    
    class Meta:
        verbose_name = _('文章版本')
        verbose_name_plural = _('文章版本')
        db_table = 'cms_article_version'
        ordering = ['-version_number']
        unique_together = ('article', 'version_number')
        indexes = [
            models.Index(fields=['article', 'version_number']),
            models.Index(fields=['editor']),
            models.Index(fields=['tenant', 'article', 'version_number']),
        ]
    
    def __str__(self):
        return f"{self.article.title} - 版本 {self.version_number}"


class Interaction(models.Model):
    """
    用户互动
    """
    TYPE_CHOICES = (
        ('like', '点赞'),
        ('dislike', '踩'),
        ('bookmark', '收藏'),
        ('share', '分享'),
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="interactions",
        verbose_name=_("用户")
    )
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name="interactions",
        verbose_name=_("文章")
    )
    type = models.CharField(_("类型"), max_length=20, choices=TYPE_CHOICES)
    created_at = models.DateTimeField(_("创建时间"), auto_now_add=True)
    updated_at = models.DateTimeField(_("更新时间"), auto_now=True)
    ip_address = models.GenericIPAddressField(_("IP地址"), blank=True, null=True)
    user_agent = models.CharField(_("用户代理"), max_length=255, blank=True, null=True)
    extra_data = models.TextField(_("附加数据"), blank=True, null=True)
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name="interactions",
        verbose_name=_("所属租户")
    )
    
    class Meta:
        verbose_name = _('用户互动')
        verbose_name_plural = _('用户互动')
        db_table = 'cms_interaction'
        unique_together = ('user', 'article', 'type')
        indexes = [
            models.Index(fields=['article', 'type']),
            models.Index(fields=['user', 'type']),
            models.Index(fields=['tenant', 'user', 'article', 'type']),
        ]
    
    def __str__(self):
        return f"{self.user.username} {self.get_type_display()} {self.article.title}"


class UserLevel(models.Model):
    """
    用户等级
    """
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name="user_levels",
        verbose_name=_("所属租户")
    )
    name = models.CharField(_("等级名称"), max_length=50)
    description = models.TextField(_("等级描述"), blank=True, null=True)
    level = models.IntegerField(_("等级值"))
    max_articles = models.IntegerField(_("最大文章数"), default=10)
    max_storage_mb = models.IntegerField(_("最大存储空间(MB)"), default=100)
    permissions = models.TextField(_("权限"), blank=True, null=True)
    is_default = models.BooleanField(_("是否默认"), default=False)
    created_at = models.DateTimeField(_("创建时间"), auto_now_add=True)
    updated_at = models.DateTimeField(_("更新时间"), auto_now=True)
    
    class Meta:
        verbose_name = _('用户等级')
        verbose_name_plural = _('用户等级')
        db_table = 'cms_user_level'
        ordering = ['level']
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['level']),
            models.Index(fields=['is_default']),
        ]
    
    def __str__(self):
        return f"{self.tenant.name} - {self.name}"


class UserLevelRelation(models.Model):
    """
    用户等级关系
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="level_relations",
        verbose_name=_("用户")
    )
    level = models.ForeignKey(
        UserLevel,
        on_delete=models.CASCADE,
        related_name="user_relations",
        verbose_name=_("等级")
    )
    start_time = models.DateTimeField(_("开始时间"), auto_now_add=True)
    end_time = models.DateTimeField(_("结束时间"), blank=True, null=True)
    created_at = models.DateTimeField(_("创建时间"), auto_now_add=True)
    updated_at = models.DateTimeField(_("更新时间"), auto_now=True)
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name="user_level_relations",
        verbose_name=_("所属租户")
    )
    
    class Meta:
        verbose_name = _('用户等级关系')
        verbose_name_plural = _('用户等级关系')
        db_table = 'cms_user_level_relation'
        unique_together = ('user', 'level')
        indexes = [
            models.Index(fields=['level']),
            models.Index(fields=['end_time']),
            models.Index(fields=['tenant', 'user']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.level.name}"


class AccessLog(models.Model):
    """
    访问日志模型
    """
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name="access_logs",
        verbose_name=_("文章")
    )
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="access_logs",
        verbose_name=_("用户"),
        blank=True,
        null=True
    )
    session_id = models.CharField(_("会话ID"), max_length=100, blank=True, null=True)
    ip_address = models.GenericIPAddressField(_("IP地址"))
    user_agent = models.CharField(_("用户代理"), max_length=255, blank=True, null=True)
    referer = models.URLField(_("来源URL"), blank=True, null=True)
    created_at = models.DateTimeField(_("访问时间"), auto_now_add=True)
    reading_time = models.IntegerField(_("阅读时长(秒)"), blank=True, null=True)
    country = models.CharField(_("国家"), max_length=50, blank=True, null=True)
    region = models.CharField(_("区域/省份"), max_length=100, blank=True, null=True)
    city = models.CharField(_("城市"), max_length=100, blank=True, null=True)
    device = models.CharField(_("设备类型"), max_length=50, blank=True, null=True)
    browser = models.CharField(_("浏览器"), max_length=50, blank=True, null=True)
    os = models.CharField(_("操作系统"), max_length=50, blank=True, null=True)
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name="access_logs",
        verbose_name=_("所属租户")
    )
    
    class Meta:
        verbose_name = _('访问日志')
        verbose_name_plural = _('访问日志')
        db_table = 'cms_access_log'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['article', 'created_at']),
            models.Index(fields=['user']),
            models.Index(fields=['session_id']),
            models.Index(fields=['ip_address']),
            models.Index(fields=['created_at']),
            models.Index(fields=['tenant', 'article', 'created_at']),
        ]
    
    def __str__(self):
        user_info = self.user.username if self.user else self.ip_address
        return f"{user_info} 访问 {self.article.title} 于 {self.created_at}"


class OperationLog(models.Model):
    """
    操作日志模型
    """
    ACTION_CHOICES = (
        ('create', '创建'),
        ('update', '更新'),
        ('delete', '删除'),
        ('publish', '发布'),
        ('archive', '归档'),
        ('restore', '恢复'),
        ('approve', '批准'),
        ('reject', '拒绝'),
    )
    
    ENTITY_TYPE_CHOICES = (
        ('article', '文章'),
        ('category', '分类'),
        ('tag', '标签'),
        ('comment', '评论'),
        ('user', '用户'),
        ('setting', '设置'),
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="operation_logs",
        verbose_name=_("用户")
    )
    action = models.CharField(_("操作类型"), max_length=50, choices=ACTION_CHOICES)
    entity_type = models.CharField(_("实体类型"), max_length=50, choices=ENTITY_TYPE_CHOICES)
    entity_id = models.IntegerField(_("实体ID"), blank=True, null=True)
    details = models.TextField(_("操作详情"), blank=True, null=True)
    ip_address = models.GenericIPAddressField(_("IP地址"))
    user_agent = models.CharField(_("用户代理"), max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(_("操作时间"), auto_now_add=True)
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name="operation_logs",
        verbose_name=_("所属租户")
    )
    
    class Meta:
        verbose_name = _('操作日志')
        verbose_name_plural = _('操作日志')
        db_table = 'cms_operation_log'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['action']),
            models.Index(fields=['created_at']),
            models.Index(fields=['tenant', 'entity_type', 'entity_id']),
        ]
    
    def __str__(self):
        return f"{self.user.username} {self.get_action_display()} {self.get_entity_type_display()} {self.entity_id} 于 {self.created_at}"
