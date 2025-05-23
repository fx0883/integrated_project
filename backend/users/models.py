"""
用户模型定义
"""
import logging
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import PermissionDenied

logger = logging.getLogger(__name__)

class User(AbstractUser):
    """
    自定义用户模型
    """
    # 租户关联字段
    tenant = models.ForeignKey(
        'tenants.Tenant', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name="users",
        verbose_name=_("所属租户")
    )
    
    # 父账号关联，用于子账号功能
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="sub_accounts",
        verbose_name=_("父账号")
    )
    
    # 用户角色字段
    is_admin = models.BooleanField(_("是否管理员"), default=False)
    is_member = models.BooleanField(_("是否普通成员"), default=True)
    is_super_admin = models.BooleanField(_("是否超级管理员"), default=False)
    
    # 其他用户信息字段
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
        verbose_name = _('用户')
        verbose_name_plural = _('用户')
        db_table = 'user'
        ordering = ['-date_joined']
    
    def __str__(self):
        if self.parent:
            return f"{self.username} (子账号)"
        return f"{self.username}"
    
    def save(self, *args, **kwargs):
        """
        重写保存方法，添加配额检查和日志
        """
        is_new = self.pk is None
        # 如果是新用户且关联了租户，检查配额
        if is_new and self.tenant:
            try:
                # 确保配额存在
                quota = self.tenant.ensure_quota()
                # 检查配额
                if not quota.can_add_user(is_admin=self.is_admin):
                    logger.warning(f"租户 {self.tenant.name} 的用户配额已满，无法创建用户")
                    raise PermissionDenied("租户用户配额已满，无法创建更多用户")
            except Exception as e:
                logger.error(f"检查租户 {self.tenant.name} 的配额时发生错误: {str(e)}")
                # 出现错误时不阻止用户创建，但记录错误
        
        # 记录日志
        if is_new:
            tenant_name = self.tenant.name if self.tenant else "无租户"
            logger.info(f"创建新用户: {self.username} (租户: {tenant_name})")
        else:
            logger.info(f"更新用户: {self.username}")
        
        # 如果用户是超级管理员，清除租户关联
        if self.is_super_admin and self.tenant:
            logger.info(f"用户 {self.username} 被设置为超级管理员，清除租户关联")
            self.tenant = None
        
        # 超级管理员始终是管理员
        if self.is_super_admin:
            self.is_admin = True
            
        # 子账号不能成为管理员或超级管理员
        if self.parent:
            self.is_admin = False
            self.is_super_admin = False
            self.is_staff = False
            self.is_superuser = False
            # 子账号不允许登录
            self.is_active = False
            logger.info(f"用户 {self.username} 是子账号，已禁止管理员权限和登录权限")
        
        super().save(*args, **kwargs)
    
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
    def is_tenant_admin(self):
        """
        判断用户是否是租户管理员
        """
        return self.is_admin and not self.is_super_admin
    
    @property
    def is_sub_account(self):
        """
        判断是否为子账号
        """
        return self.parent is not None
    
    @property
    def display_role(self):
        """
        获取用户角色显示名称
        """
        if self.is_sub_account:
            return "子账号"
        elif self.is_super_admin:
            return "超级管理员"
        elif self.is_admin:
            return "租户管理员"
        else:
            return "普通用户"
    
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
