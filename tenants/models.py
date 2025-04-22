"""
租户模型定义
"""
import logging
from django.db import models
from django.utils.translation import gettext_lazy as _

logger = logging.getLogger(__name__)

class Tenant(models.Model):
    """
    租户模型，用于隔离不同租户的数据
    """
    STATUS_CHOICES = (
        ('active', '活跃'),
        ('suspended', '暂停'),
        ('deleted', '已删除'),
    )
    
    name = models.CharField(_("租户名称"), max_length=100, unique=True)
    status = models.CharField(_("状态"), max_length=20, choices=STATUS_CHOICES, default='active')
    
    # 联系人信息
    contact_name = models.CharField(_("联系人姓名"), max_length=50, null=True, blank=True)
    contact_email = models.EmailField(_("联系人邮箱"), null=True, blank=True)
    contact_phone = models.CharField(_("联系人电话"), max_length=20, null=True, blank=True)
    
    created_at = models.DateTimeField(_("创建时间"), auto_now_add=True)
    updated_at = models.DateTimeField(_("更新时间"), auto_now=True)
    is_deleted = models.BooleanField(_("是否删除"), default=False)
    
    class Meta:
        verbose_name = _('租户')
        verbose_name_plural = _('租户')
        db_table = 'tenant'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"
    
    def save(self, *args, **kwargs):
        """
        重写保存方法，添加日志记录
        """
        is_new = self.pk is None
        if is_new:
            logger.info(f"创建新租户: {self.name}")
        else:
            logger.info(f"更新租户: {self.name}")
        
        super().save(*args, **kwargs)
        
        # 如果是新创建的租户，自动创建配额记录
        if is_new:
            TenantQuota.objects.create(tenant=self)
    
    def soft_delete(self):
        """
        软删除租户
        """
        self.status = 'deleted'
        self.is_deleted = True
        self.save(update_fields=['status', 'is_deleted', 'updated_at'])
        logger.info(f"软删除租户: {self.name}")
    
    @property
    def is_active(self):
        """
        判断租户是否处于活跃状态
        """
        return self.status == 'active' and not self.is_deleted


class TenantQuota(models.Model):
    """
    租户配额模型，用于限制租户的资源使用
    """
    tenant = models.OneToOneField(
        Tenant,
        on_delete=models.CASCADE,
        related_name='quota',
        verbose_name=_('租户')
    )
    max_users = models.IntegerField(_('最大用户数'), default=10)
    max_admins = models.IntegerField(_('最大管理员数'), default=2)
    max_storage_mb = models.IntegerField(_('最大存储空间(MB)'), default=1024)  # 默认1GB
    max_products = models.IntegerField(_('最大产品数'), default=100)
    
    # 跟踪当前使用情况
    current_storage_used_mb = models.IntegerField(_('当前已用存储空间(MB)'), default=0)
    
    created_at = models.DateTimeField(_("创建时间"), auto_now_add=True)
    updated_at = models.DateTimeField(_("更新时间"), auto_now=True)
    
    class Meta:
        verbose_name = _('租户配额')
        verbose_name_plural = _('租户配额')
        db_table = 'tenant_quota'
    
    def __str__(self):
        return f"{self.tenant.name} 配额"
    
    def can_add_user(self, is_admin=False):
        """
        检查是否可以添加用户
        
        Args:
            is_admin: 是否添加管理员用户
        
        Returns:
            布尔值，指示是否可以添加用户
        """
        from users.models import User
        # 查询当前租户的用户数
        current_user_count = User.objects.filter(tenant=self.tenant).count()
        
        if current_user_count >= self.max_users:
            logger.warning(f"租户 {self.tenant.name} 的用户数已达到上限 {self.max_users}")
            return False
        
        # 如果是管理员，还需要检查管理员配额
        if is_admin:
            current_admin_count = User.objects.filter(
                tenant=self.tenant, 
                is_admin=True
            ).count()
            
            if current_admin_count >= self.max_admins:
                logger.warning(f"租户 {self.tenant.name} 的管理员数已达到上限 {self.max_admins}")
                return False
        
        return True
    
    def update_storage_usage(self, new_storage_mb):
        """
        更新存储使用情况
        
        Args:
            new_storage_mb: 新的存储使用量(MB)
        """
        self.current_storage_used_mb = new_storage_mb
        self.save(update_fields=['current_storage_used_mb', 'updated_at'])
        logger.info(f"更新租户 {self.tenant.name} 的存储使用量: {new_storage_mb}MB")
    
    def can_use_storage(self, required_mb):
        """
        检查是否有足够的存储空间
        
        Args:
            required_mb: 需要的存储空间(MB)
        
        Returns:
            布尔值，指示是否有足够的存储空间
        """
        available_mb = self.max_storage_mb - self.current_storage_used_mb
        if required_mb > available_mb:
            logger.warning(
                f"租户 {self.tenant.name} 的存储空间不足: "
                f"需要 {required_mb}MB, 可用 {available_mb}MB"
            )
            return False
        return True

    def get_usage_percentage(self, resource_type):
        """
        获取资源使用百分比
        
        Args:
            resource_type: 资源类型（'users', 'admins', 'storage', 'products'）
        
        Returns:
            使用百分比（0-100）
        """
        from users.models import User
        
        if resource_type == 'users':
            current = User.objects.filter(tenant=self.tenant).count()
            maximum = self.max_users
        elif resource_type == 'admins':
            current = User.objects.filter(tenant=self.tenant, is_admin=True).count()
            maximum = self.max_admins
        elif resource_type == 'storage':
            current = self.current_storage_used_mb
            maximum = self.max_storage_mb
        elif resource_type == 'products':
            # 这里假设有产品模型，实际使用中需要导入实际的产品模型
            current = 0  # 暂时设为0，后续可以根据实际产品模型更新
            maximum = self.max_products
        else:
            return 0
        
        if maximum <= 0:
            return 0
        
        percentage = (current / maximum) * 100
        return round(percentage, 1)  # 保留一位小数
