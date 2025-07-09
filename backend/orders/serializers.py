"""
订单应用的序列化器
"""

from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from .models import Order, OrderHistory
from customers.serializers import CustomerListSerializer
from users.serializers import UserMinimalSerializer
from users.models import User, Member


class OrderSerializer(serializers.ModelSerializer):
    """
    订单基本序列化器
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    service_type_display = serializers.CharField(source='get_service_type_display', read_only=True)
    language_direction_display = serializers.CharField(source='get_language_direction_display', read_only=True)
    invoice_status_display = serializers.CharField(source='get_invoice_status_display', read_only=True)
    profit = serializers.SerializerMethodField()
    profit_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'is_deleted', 'order_number', 'tenant')
    
    def get_profit(self, obj):
        """
        获取订单毛利
        """
        return obj.calculate_profit()
    
    def get_profit_rate(self, obj):
        """
        获取订单毛利率
        """
        return obj.calculate_profit_rate()


class OrderCreateSerializer(OrderSerializer):
    """
    创建订单序列化器
    """
    def validate(self, data):
        """
        验证订单创建数据
        """
        # 校验开始日期和截止日期
        start_date = data.get('start_date')
        due_date = data.get('due_date')
        if start_date and due_date and start_date > due_date:
            raise serializers.ValidationError({'due_date': _('截止日期不能早于开始日期')})
        
        # 对于总金额为0的情况，字数是必填项
        if 'total_amount' not in data or data.get('total_amount', 0) == 0:
            word_count = data.get('word_count', 0)
            if word_count == 0:
                raise serializers.ValidationError({'word_count': _('字数不能为0')})
        
        return data
    
    def create(self, validated_data):
        """
        创建订单并记录历史
        """
        # 从请求中获取用户
        user = self.context['request'].user
        
        # 设置创建人
        if 'created_by' not in validated_data:
            validated_data['created_by'] = user
        
        # 设置租户
        if hasattr(user, 'tenant') and user.tenant:
            validated_data['tenant'] = user.tenant
        
        # 创建订单
        order = super().create(validated_data)
        
        # 创建历史记录
        OrderHistory.create_history_record(
            order=order,
            user=user,
            change_details={'action': 'create', 'message': '创建订单'}
        )
        
        return order


class OrderUpdateSerializer(OrderSerializer):
    """
    更新订单序列化器
    """
    def validate(self, data):
        """
        验证订单更新数据
        """
        # 校验开始日期和截止日期
        start_date = data.get('start_date', self.instance.start_date)
        due_date = data.get('due_date', self.instance.due_date)
        if start_date and due_date and start_date > due_date:
            raise serializers.ValidationError({'due_date': _('截止日期不能早于开始日期')})
        
        return data
    
    def update(self, instance, validated_data):
        """
        更新订单并记录变更历史
        """
        # 从请求中获取用户
        user = self.context['request'].user
        
        # 记录变更详情
        change_details = {'action': 'update', 'changes': {}}
        for field, value in validated_data.items():
            if hasattr(instance, field):
                old_value = getattr(instance, field)
                if old_value != value:
                    if isinstance(old_value, (int, float, str, bool)) or old_value is None:
                        change_details['changes'][field] = {
                            'old': old_value,
                            'new': value
                        }
                    else:
                        # 对于复杂类型，只记录已更改
                        change_details['changes'][field] = {'changed': True}
        
        # 更新订单
        order = super().update(instance, validated_data)
        
        # 如果有变更，创建历史记录
        if change_details['changes']:
            OrderHistory.create_history_record(
                order=order,
                user=user,
                change_details=change_details
            )
        
        return order


class OrderHistorySerializer(serializers.ModelSerializer):
    """
    订单历史记录序列化器
    """
    modified_by_name = serializers.SerializerMethodField()
    change_details_data = serializers.SerializerMethodField()
    snapshot_data = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderHistory
        fields = ['id', 'order', 'version', 'modified_by', 'modified_by_name', 'modified_at', 
                 'change_details', 'change_details_data', 'snapshot', 'snapshot_data']
        read_only_fields = ('order', 'version', 'modified_by', 'modified_at', 'change_details', 'snapshot')
    
    def get_modified_by_name(self, obj):
        """
        获取修改人姓名
        """
        if obj.modified_by:
            return obj.modified_by.username
        return None
    
    def get_change_details_data(self, obj):
        """
        将变更详情JSON字符串转换为Python对象
        """
        import json
        try:
            if obj.change_details:
                return json.loads(obj.change_details)
        except (TypeError, json.JSONDecodeError):
            pass
        return {}
    
    def get_snapshot_data(self, obj):
        """
        将快照JSON字符串转换为Python对象
        """
        import json
        try:
            if obj.snapshot:
                return json.loads(obj.snapshot)
        except (TypeError, json.JSONDecodeError):
            pass
        return {}


class OrderHistoryDetailSerializer(OrderHistorySerializer):
    """
    订单历史记录详情序列化器，包含完整快照
    """
    modified_by = UserMinimalSerializer(read_only=True)
    
    class Meta(OrderHistorySerializer.Meta):
        depth = 1  # 增加序列化深度，展开关联对象


class OrderCompareSerializer(serializers.Serializer):
    """
    订单版本比较序列化器
    """
    order_id = serializers.IntegerField(read_only=True)
    order_number = serializers.CharField(read_only=True)
    version1 = serializers.IntegerField(required=True)
    version2 = serializers.IntegerField(required=True)
    differences = serializers.JSONField(read_only=True)
    
    def validate(self, data):
        """
        验证两个版本号
        """
        version1 = data.get('version1')
        version2 = data.get('version2')
        
        # 检查版本号是否相同
        if version1 == version2:
            raise serializers.ValidationError(_("两个版本号不能相同"))
        
        # 检查版本号是否存在
        order_id = self.context.get('order_id')
        if not OrderHistory.objects.filter(order_id=order_id, version=version1).exists():
            raise serializers.ValidationError(_(f"版本 {version1} 不存在"))
        
        if not OrderHistory.objects.filter(order_id=order_id, version=version2).exists():
            raise serializers.ValidationError(_(f"版本 {version2} 不存在"))
        
        return data


class OrderListSerializer(serializers.ModelSerializer):
    """
    订单列表序列化器（简化版，用于列表展示）
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    service_type_display = serializers.CharField(source='get_service_type_display', read_only=True)
    language_direction_display = serializers.CharField(source='get_language_direction_display', read_only=True)
    invoice_status_display = serializers.CharField(source='get_invoice_status_display', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    created_by_info = serializers.SerializerMethodField()
    customer_contact_info = serializers.SerializerMethodField()
    profit = serializers.SerializerMethodField()
    profit_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = '__all__'  # 返回所有字段
        read_only_fields = ('created_at', 'updated_at', 'is_deleted', 'order_number', 'tenant', 
                           'created_by_info', 'customer_contact_info', 'profit', 'profit_rate')
    
    def get_profit(self, obj):
        """
        获取订单毛利
        """
        return obj.calculate_profit()
    
    def get_profit_rate(self, obj):
        """
        获取订单毛利率
        """
        return obj.calculate_profit_rate()
    
    def get_created_by_info(self, obj):
        """
        获取创建人详细信息
        """
        if not obj.created_by:
            return None
        
        return {
            'id': obj.created_by.id,
            'username': obj.created_by.username,
            'nick_name': obj.created_by.nick_name,
            'display_name': obj.created_by.display_name,
        }
    
    def get_customer_contact_info(self, obj):
        """
        获取客户联系人详细信息
        """
        if not obj.customer_contact:
            return None
        
        return {
            'id': obj.customer_contact.id,
            'username': obj.customer_contact.username,
            'email': obj.customer_contact.email,
            'phone': obj.customer_contact.phone,
            'nick_name': obj.customer_contact.nick_name,
            'display_name': obj.customer_contact.display_name,
            'avatar': obj.customer_contact.avatar
        }


class OrderDetailSerializer(OrderSerializer):
    """
    订单详情序列化器（包含关联数据）
    """
    customer = CustomerListSerializer(read_only=True)
    created_by = UserMinimalSerializer(read_only=True)
    customer_contact = UserMinimalSerializer(read_only=True)
    history_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'is_deleted', 'order_number', 'tenant')
    
    def get_history_count(self, obj):
        """
        获取历史记录数量
        """
        return obj.history_records.count()


class OrderStatisticsSerializer(serializers.Serializer):
    """
    订单统计数据序列化器
    """
    period = serializers.CharField(read_only=True)
    start_date = serializers.DateField(read_only=True)
    end_date = serializers.DateField(read_only=True)
    total_orders = serializers.IntegerField(read_only=True)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_profit = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    average_profit_rate = serializers.FloatField(read_only=True)
    by_period = serializers.ListField(child=serializers.JSONField(), read_only=True)
    by_service_type = serializers.ListField(child=serializers.JSONField(), read_only=True)
    by_status = serializers.ListField(child=serializers.JSONField(), read_only=True)