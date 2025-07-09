"""
订单管理系统模型
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
import json
import uuid
from common.models import BaseModel
from customers.models import Customer
from users.models import Member, User


class Order(BaseModel):
    """
    订单模型，包含订单基本信息、服务信息、费用信息等
    """
    # 订单状态选项
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('pending', '待处理'),
        ('in_progress', '进行中'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
    ]
    


    
    # 1. 订单基本信息
    order_number = models.CharField(_("订单编号"), max_length=50, unique=True, editable=False)
    customer = models.ForeignKey(
        Customer, 
        verbose_name=_("客户"), 
        on_delete=models.PROTECT,
        related_name="orders"
    )
    status = models.CharField(_("订单状态"), max_length=20, choices=STATUS_CHOICES, default='draft')
    created_by = models.ForeignKey(
        User,
        verbose_name=_("创建人"),
        on_delete=models.PROTECT,
        related_name="created_orders"
    )
    
    # 2. 服务和语种信息
    service_type = models.CharField(_("服务类型"), max_length=200)
    language_direction = models.CharField(_("语言方向"), max_length=50)
    word_count = models.PositiveIntegerField(_("字数"), default=0)
    description = models.TextField(_("项目描述"), blank=True, null=True)
    
    # 3. 人员信息
    customer_contact = models.ForeignKey(
        Member,
        verbose_name=_("客户联系人"),
        on_delete=models.PROTECT,
        related_name="customer_contact_orders",
        null=True,
        blank=True
    )
    # 由客户自己填写，改为CharField
    translator = models.CharField(_("译员"), max_length=100, blank=True, null=True)


    
    # 4. 时间信息
    start_date = models.DateField(_("开始日期"), null=True, blank=True)
    due_date = models.DateField(_("截止日期"), null=True, blank=True)
    delivery_date = models.DateField(_("交付日期"), null=True, blank=True)
    
    # 5. 费用信息
    price = models.CharField(_("单价"), max_length=100, blank=True, null=True)
    total_amount = models.DecimalField(_("总金额"), max_digits=10, decimal_places=2, default=0)
    translator_fee = models.DecimalField(_("译员费用"), max_digits=10, decimal_places=2, default=0)
    other_costs = models.DecimalField(_("其他成本"), max_digits=10, decimal_places=2, default=0)
    project_fee = models.DecimalField(_("项目费用"), max_digits=10, decimal_places=2, default=0)
    project_details = models.TextField(_("项目明细"), blank=True, null=True)
    
    # 6. 支付信息
    payment_status = models.CharField(_("支付状态"), max_length=50, default='unpaid')
    payment_date = models.DateField(_("支付日期"), null=True, blank=True)
    payment_method = models.CharField(_("支付方式"), max_length=50, blank=True, null=True)
    payment_remarks = models.TextField(_("支付备注"), blank=True, null=True)
    
    # 7. 发票和合同信息
    invoice_status = models.CharField(_("发票状态"), max_length=50, default='not_required')
    invoice_info = models.TextField(_("发票信息"), blank=True, null=True)
    contract_number = models.CharField(_("合同编号"), max_length=100, blank=True, null=True)
    contract_info = models.TextField(_("合同信息"), blank=True, null=True)
    contract_remarks = models.TextField(_("合同备注"), blank=True, null=True)
    
    # 8. 其他信息
    remarks = models.TextField(_("备注"), blank=True, null=True)
    tags = models.TextField(_("标签"), blank=True, null=True)
    follow_up_record = models.TextField(_("回访记录"), blank=True, null=True)
    
    class Meta:
        verbose_name = _('订单')
        verbose_name_plural = _('订单')
        db_table = 'order'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order_number']),
            models.Index(fields=['customer']),
            models.Index(fields=['status']),
            models.Index(fields=['payment_status']),
        ]
    
    def __str__(self):
        return f"{self.order_number} - {self.customer.name} ({self.get_status_display()})"
    
    def save(self, *args, **kwargs):
        # 如果是新订单，生成订单编号
        if not self.order_number:
            self.order_number = self._generate_order_number()
        
        # 总金额计算逻辑可能需要更新，因为单价字段改变了
        # 如果总金额为0，可以尝试根据其他字段计算
        if self.total_amount == 0:
            # 这里可以添加新的计算逻辑
            pass
        
        super().save(*args, **kwargs)
    
    def _generate_order_number(self):
        """
        生成唯一的订单编号，格式：PQ-{年份}{月份}-{4位随机数}
        例如：PQ-202507-1234
        """
        now = timezone.now()
        prefix = f"PQ-{now.year}{now.month:02d}-"
        random_suffix = str(uuid.uuid4().int)[:4]
        return f"{prefix}{random_suffix}"
    
    def calculate_profit(self):
        """
        计算订单毛利
        公式：总金额 - 译员费用 - 其他成本 - 项目费用
        """
        return self.total_amount - self.translator_fee - self.other_costs - self.project_fee
    
    def calculate_profit_rate(self):
        """
        计算订单毛利率
        公式：(总金额 - 译员费用 - 其他成本 - 项目费用) / 总金额
        """
        if self.total_amount == 0:
            return 0
        
        profit = self.calculate_profit()
        return profit / self.total_amount


class OrderHistory(models.Model):
    """
    订单历史记录，记录订单的变更历史
    """
    order = models.ForeignKey(
        Order,
        verbose_name=_("订单"),
        on_delete=models.CASCADE,
        related_name="history_records"
    )
    version = models.PositiveIntegerField(_("版本号"))
    modified_by = models.ForeignKey(
        User,
        verbose_name=_("修改人"),
        on_delete=models.PROTECT,
        related_name="order_modifications"
    )
    modified_at = models.DateTimeField(_("修改时间"), auto_now_add=True)
    change_details = models.TextField(_("变更详情"), default="{}")
    snapshot = models.TextField(_("快照"), default="{}")
    
    class Meta:
        verbose_name = _('订单历史')
        verbose_name_plural = _('订单历史')
        db_table = 'order_history'
        ordering = ['-modified_at']
        unique_together = [['order', 'version']]
    
    def __str__(self):
        return f"{self.order.order_number} - 版本 {self.version}"
    
    @staticmethod
    def create_history_record(order, user, change_details=None):
        """
        创建订单历史记录
        
        Args:
            order: 订单对象
            user: 修改用户
            change_details: 变更详情，默认为None
        
        Returns:
            OrderHistory: 创建的历史记录对象
        """
        # 获取当前订单的最大版本号
        last_version = OrderHistory.objects.filter(order=order).order_by('-version').first()
        new_version = 1 if not last_version else last_version.version + 1
        
        # 创建订单快照
        snapshot = {
            'id': order.id,
            'order_number': order.order_number,
            'customer_id': order.customer_id,
            'customer_name': order.customer.name,
            'status': order.status,
            'service_type': order.service_type,
            'language_direction': order.language_direction,
            'word_count': order.word_count,
            'description': order.description,
            'customer_contact_id': order.customer_contact_id,
            'translator': order.translator,
            'start_date': order.start_date.isoformat() if order.start_date else None,
            'due_date': order.due_date.isoformat() if order.due_date else None,
            'delivery_date': order.delivery_date.isoformat() if order.delivery_date else None,
            'price': order.price,
            'total_amount': float(order.total_amount),
            'translator_fee': float(order.translator_fee),
            'other_costs': float(order.other_costs),
            'project_fee': float(order.project_fee),
            'project_details': order.project_details,
            'payment_status': order.payment_status,
            'payment_date': order.payment_date.isoformat() if order.payment_date else None,
            'payment_method': order.payment_method,
            'payment_remarks': order.payment_remarks,
            'invoice_status': order.invoice_status,
            'invoice_info': order.invoice_info,
            'contract_number': order.contract_number,
            'contract_info': order.contract_info,
            'contract_remarks': order.contract_remarks,
            'remarks': order.remarks,
            'tags': order.tags,
            'follow_up_record': order.follow_up_record,
            'tenant_id': order.tenant_id if order.tenant_id else None,
            'created_at': order.created_at.isoformat() if order.created_at else None,
            'updated_at': order.updated_at.isoformat() if order.updated_at else None,
            'is_deleted': order.is_deleted,
        }
        
        # 将字典转换为JSON字符串
        snapshot_json = json.dumps(snapshot)
        change_details_json = json.dumps(change_details or {})
        
        # 创建历史记录
        return OrderHistory.objects.create(
            order=order,
            version=new_version,
            modified_by=user,
            change_details=change_details_json,
            snapshot=snapshot_json
        )
