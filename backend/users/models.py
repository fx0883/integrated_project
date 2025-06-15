"""
用户模型定义
"""
import logging
from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import PermissionDenied

logger = logging.getLogger(__name__)

class BaseUserModel(AbstractUser):
    """
    用户基础模型，包含所有用户类型共有的字段
    """
    # 重写ManyToMany关系，添加不同的related_name
    groups = models.ManyToManyField(
        Group,
        verbose_name=_('groups'),
        blank=True,
        help_text=_(
            'The groups this user belongs to. A user will get all permissions '
            'granted to each of their groups.'
        ),
        related_name="%(class)s_set",
        related_query_name="%(class)s",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name=_('user permissions'),
        blank=True,
        help_text=_('Specific permissions for this user.'),
        related_name="%(class)s_set",
        related_query_name="%(class)s",
    )
    
    # 租户关联字段
    tenant = models.ForeignKey(
        'tenants.Tenant', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name="%(class)ss",  # 动态关联名
        verbose_name=_("所属租户")
    )
    
    # 用户信息字段
    phone = models.CharField(_("手机号"), max_length=11, null=True, blank=True)
    email = models.EmailField(_("邮箱"))
    nick_name = models.CharField(_("昵称"), max_length=30, null=True, blank=True)
    avatar = models.CharField(_("头像"), max_length=200, default="", blank=True)
    is_deleted = models.BooleanField(_("是否删除"), default=False)
    
    # 状态字段
    status = models.CharField(
        _("状态"), 
        max_length=20, 
        choices=[
            ('active', '活跃'),
            ('suspended', '暂停'),
            ('inactive', '未激活'),
        ],
        default='active'
    )
    
    # 最后登录IP
    last_login_ip = models.CharField(_("最后登录IP"), max_length=50, null=True, blank=True)
    
    class Meta:
        abstract = True
        ordering = ['-date_joined']
    
    def soft_delete(self):
        """
        软删除用户
        """
        self.is_deleted = True
        self.status = 'inactive'
        self.is_active = False
        self.save(update_fields=['is_deleted', 'status', 'is_active'])
        logger.info(f"软删除用户: {self.username}")
        return self
    
    @property
    def display_name(self):
        """
        获取用户显示名称
        """
        if self.nick_name:
            return self.nick_name
        elif self.first_name or self.last_name:
            return f"{self.first_name} {self.last_name}".strip()
        else:
            return self.username

class User(BaseUserModel):
    """
    管理员用户模型，包括超级管理员和租户管理员
    """
    # 用户角色字段
    is_admin = models.BooleanField(_("是否管理员"), default=True)
    is_super_admin = models.BooleanField(_("是否超级管理员"), default=False)
    
    class Meta:
        verbose_name = _('管理员用户')
        verbose_name_plural = _('管理员用户')
        db_table = 'user'
    
    def __str__(self):
        return f"{self.username} ({self.display_role})"
    
    def save(self, *args, **kwargs):
        """
        重写保存方法，处理超级管理员逻辑
        """
        is_new = self.pk is None
        
        # 如果是新用户且关联了租户，检查配额
        if is_new and self.tenant:
            try:
                # 确保配额存在
                quota = self.tenant.ensure_quota()
                # 检查配额
                if not quota.can_add_user(is_admin=True):
                    logger.warning(f"租户 {self.tenant.name} 的管理员配额已满，无法创建更多管理员")
                    raise PermissionDenied("租户管理员配额已满，无法创建更多管理员")
            except Exception as e:
                # 出现错误时记录错误
                logger.error(f"检查租户 {self.tenant.name} 的配额时发生错误: {str(e)}")
        
        # 记录日志
        if is_new:
            tenant_name = self.tenant.name if self.tenant else "无租户"
            logger.info(f"创建新管理员用户: {self.username} (租户: {tenant_name})")
        else:
            logger.info(f"更新管理员用户: {self.username}")
        
        # 如果用户是超级管理员，清除租户关联
        if self.is_super_admin and self.tenant:
            logger.info(f"用户 {self.username} 被设置为超级管理员，清除租户关联")
            self.tenant = None
        
        # 确保is_admin始终为True
        self.is_admin = True
        
        # 超级管理员同时设置Django内置权限
        if self.is_super_admin:
            self.is_staff = True
            self.is_superuser = True
        
        super().save(*args, **kwargs)
    
    @property
    def is_tenant_admin(self):
        """
        判断用户是否是租户管理员
        """
        return not self.is_super_admin
    
    @property
    def display_role(self):
        """
        获取用户角色显示名称
        """
        if self.is_super_admin:
            return "超级管理员"
        else:
            return "租户管理员"

class Member(BaseUserModel):
    """
    普通成员模型，包括普通用户和子账号
    """
    # 父账号关联，用于子账号功能
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="sub_accounts",
        verbose_name=_("父账号")
    )
    
    class Meta:
        verbose_name = _('普通成员')
        verbose_name_plural = _('普通成员')
        db_table = 'member'
    
    def __str__(self):
        if self.parent:
            return f"{self.username} (子账号)"
        return f"{self.username}"
    
    def save(self, *args, **kwargs):
        """
        重写保存方法，处理子账号逻辑和配额检查
        """
        is_new = self.pk is None
        
        # 如果是新用户且关联了租户，检查配额
        if is_new and self.tenant:
            try:
                # 确保配额存在
                quota = self.tenant.ensure_quota()
                # 检查配额
                if not quota.can_add_user(is_admin=False):
                    logger.warning(f"租户 {self.tenant.name} 的成员配额已满，无法创建更多成员")
                    raise PermissionDenied("租户成员配额已满，无法创建更多成员")
            except Exception as e:
                # 出现错误时记录错误
                logger.error(f"检查租户 {self.tenant.name} 的配额时发生错误: {str(e)}")
        
        # 记录日志
        if is_new:
            tenant_name = self.tenant.name if self.tenant else "无租户"
            logger.info(f"创建新普通成员: {self.username} (租户: {tenant_name})")
        else:
            logger.info(f"更新普通成员: {self.username}")
        
        # 子账号不允许登录
        if self.parent:
            self.is_active = False
            logger.info(f"用户 {self.username} 是子账号，已禁止登录权限")
        
        # 确保普通成员没有管理后台权限
        self.is_staff = False
        self.is_superuser = False
        
        super().save(*args, **kwargs)
    
    @property
    def is_sub_account(self):
        """
        判断是否为子账号
        """
        return self.parent is not None
    
    @property
    def display_role(self):
        """
        获取成员角色显示名称
        """
        if self.is_sub_account:
            return "子账号"
        else:
            return "普通成员"
