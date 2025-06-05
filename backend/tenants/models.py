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
    code = models.CharField(_("租户代码"), max_length=50, unique=True, null=True, blank=True, help_text="用于API和集成的唯一标识符")
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
        
        # 如果没有设置code，使用name的小写版本作为默认code
        if not self.code and self.name:
            self.code = self.name.lower().replace(' ', '_')
        
        super().save(*args, **kwargs)
        
        # 如果是新创建的租户，自动创建配额记录
        if is_new:
            try:
                # 检查配额是否已存在，避免重复创建
                TenantQuota.objects.get(tenant=self)
                logger.info(f"租户 {self.name} 的配额记录已存在")
            except TenantQuota.DoesNotExist:
                # 创建默认配额记录
                TenantQuota.objects.create(
                    tenant=self,
                    max_users=10,
                    max_admins=2,
                    max_storage_mb=1024,
                    max_products=100
                )
                logger.info(f"已为租户 {self.name} 创建默认配额记录")
            except Exception as e:
                logger.error(f"为租户 {self.name} 创建配额时发生错误: {str(e)}")
    
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

    def ensure_quota(self):
        """
        确保租户有配额记录，如果没有则创建
        """
        try:
            return self.quota
        except TenantQuota.DoesNotExist:
            logger.warning(f"租户 {self.name} 没有配额记录，正在创建默认配额")
            return TenantQuota.objects.create(
                tenant=self,
                max_users=10,
                max_admins=2,
                max_storage_mb=1024,
                max_products=100
            )


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


class TenantBusinessInfo(models.Model):
    """
    租户信息附加表，用于存储租户的公司注册信息和营业执照
    """
    VERIFICATION_STATUS_CHOICES = (
        ('pending', '待验证'),
        ('verified', '已验证'),
        ('rejected', '已拒绝'),
        ('expired', '已过期'),
    )
    
    tenant = models.OneToOneField(
        Tenant,
        on_delete=models.CASCADE,
        related_name='business_info',
        verbose_name=_('租户')
    )
    
    # 公司基本信息
    company_name = models.CharField(_("公司名称"), max_length=100)
    legal_representative = models.CharField(_("法定代表人"), max_length=50)
    unified_social_credit_code = models.CharField(
        _("统一社会信用代码"), 
        max_length=50,
        unique=True,
    )
    registration_number = models.CharField(_("注册号"), max_length=50, null=True, blank=True)
    company_type = models.CharField(_("公司类型"), max_length=50, null=True, blank=True)
    registered_capital = models.DecimalField(
        _("注册资本"), 
        max_digits=15, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    registered_capital_currency = models.CharField(
        _("注册资本币种"), 
        max_length=20, 
        default="CNY",
        null=True, 
        blank=True
    )
    business_scope = models.TextField(_("经营范围"), null=True, blank=True)
    
    # 日期信息
    establishment_date = models.DateField(_("成立日期"), null=True, blank=True)
    business_term_start = models.DateField(_("营业期限开始日期"), null=True, blank=True)
    business_term_end = models.DateField(_("营业期限结束日期"), null=True, blank=True)
    
    # 注册信息
    registration_authority = models.CharField(_("登记机关"), max_length=100, null=True, blank=True)
    approval_date = models.DateField(_("核准日期"), null=True, blank=True)
    business_status = models.CharField(_("企业状态"), max_length=50, null=True, blank=True)
    registered_address = models.CharField(_("注册地址"), max_length=255, null=True, blank=True)
    
    # 联系信息
    office_address = models.CharField(_("办公地址"), max_length=255, null=True, blank=True)
    contact_person = models.CharField(_("联系人"), max_length=50, null=True, blank=True)
    contact_phone = models.CharField(_("联系电话"), max_length=20, null=True, blank=True)
    email = models.EmailField(_("电子邮箱"), null=True, blank=True)
    website = models.URLField(_("公司网站"), null=True, blank=True)
    
    # 营业执照信息
    license_image_url = models.CharField(_("营业执照图片URL"), max_length=255, null=True, blank=True)
    license_image_path = models.CharField(_("营业执照图片存储路径"), max_length=255, null=True, blank=True)
    license_issue_date = models.DateField(_("营业执照发证日期"), null=True, blank=True)
    license_expiry_date = models.DateField(_("营业执照到期日期"), null=True, blank=True)
    
    # 验证信息
    verification_status = models.CharField(
        _("验证状态"), 
        max_length=20, 
        choices=VERIFICATION_STATUS_CHOICES, 
        default='pending'
    )
    verification_time = models.DateTimeField(_("验证时间"), null=True, blank=True)
    verification_user = models.ForeignKey(
        'users.User',  # 使用字符串引用避免循环导入
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_businesses',
        verbose_name=_('验证人')
    )
    rejection_reason = models.TextField(_("拒绝原因"), null=True, blank=True)
    remark = models.TextField(_("备注"), null=True, blank=True)
    
    created_at = models.DateTimeField(_("创建时间"), auto_now_add=True)
    updated_at = models.DateTimeField(_("更新时间"), auto_now=True)
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_business_infos',
        verbose_name=_('创建人')
    )
    updated_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='updated_business_infos',
        verbose_name=_('更新人')
    )
    
    class Meta:
        verbose_name = _('租户企业信息')
        verbose_name_plural = _('租户企业信息')
        db_table = 'tenant_business_info'
        
    def __str__(self):
        return f"{self.company_name} ({self.tenant.name})"
    
    def save(self, *args, **kwargs):
        """
        重写保存方法，添加日志记录
        """
        is_new = self.pk is None
        if is_new:
            logger.info(f"创建租户企业信息: {self.company_name} (租户: {self.tenant.name})")
        else:
            logger.info(f"更新租户企业信息: {self.company_name} (租户: {self.tenant.name})")
        
        super().save(*args, **kwargs)
    
    def verify(self, user, status='verified', rejection_reason=None):
        """
        验证企业信息
        
        Args:
            user: 执行验证的用户
            status: 验证状态，默认为已验证
            rejection_reason: 拒绝原因，仅在状态为'rejected'时使用
        """
        from django.utils import timezone
        
        self.verification_status = status
        self.verification_time = timezone.now()
        self.verification_user = user
        
        if status == 'rejected' and rejection_reason:
            self.rejection_reason = rejection_reason
            
        self.save(update_fields=[
            'verification_status', 
            'verification_time', 
            'verification_user', 
            'rejection_reason', 
            'updated_at'
        ])
        
        logger.info(
            f"租户企业信息 {self.company_name} 验证状态更新为: {status}, "
            f"验证人: {user.username if user else 'Unknown'}"
        )
