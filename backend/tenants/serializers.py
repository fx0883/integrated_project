"""
租户和租户配额的序列化器
"""
from rest_framework import serializers
from tenants.models import Tenant, TenantQuota, TenantBusinessInfo
from users.serializers import UserMinimalSerializer
from django.utils.translation import gettext_lazy as _

class TenantSerializer(serializers.ModelSerializer):
    """
    租户序列化器，用于列表展示
    """
    quota = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    has_business_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Tenant
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'is_deleted')
    
    def get_quota(self, obj):
        """获取租户配额"""
        return TenantQuotaSerializer(obj.tenantquota_set.first()).data
    
    def get_has_business_info(self, obj):
        """检查租户是否有企业信息"""
        try:
            return hasattr(obj, 'business_info')
        except:
            return False


class TenantCreateSerializer(serializers.ModelSerializer):
    """
    租户创建序列化器
    """
    class Meta:
        model = Tenant
        fields = [
            'id', 'name', 'contact_name', 'contact_email',
            'contact_phone', 'status'
        ]
        read_only_fields = ['id']


class TenantDetailSerializer(serializers.ModelSerializer):
    """
    租户详情序列化器，包含完整信息
    """
    user_count = serializers.SerializerMethodField()
    admin_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Tenant
        fields = [
            'id', 'name', 'status', 'contact_name', 'contact_email',
            'contact_phone', 'created_at', 'updated_at', 'user_count', 'admin_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user_count', 'admin_count']
    
    def get_user_count(self, obj) -> int:
        """获取租户用户数量"""
        return obj.users.filter(is_deleted=False).count()
    
    def get_admin_count(self, obj) -> int:
        """获取租户管理员数量"""
        return obj.users.filter(is_deleted=False, is_admin=True).count()


class TenantQuotaSerializer(serializers.ModelSerializer):
    """
    租户配额序列化器
    """
    usage_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = TenantQuota
        exclude = ('tenant',)
        read_only_fields = ('current_storage_used_mb', 'created_at', 'updated_at')
    
    def get_usage_percentage(self, obj):
        """
        计算各项资源的使用百分比
        """
        return {
            'users': obj.get_usage_percentage('users'),
            'admins': obj.get_usage_percentage('admins'),
            'storage': obj.get_usage_percentage('storage'),
            'products': obj.get_usage_percentage('products')
        }


class TenantQuotaUpdateSerializer(serializers.ModelSerializer):
    """
    租户配额更新序列化器
    """
    class Meta:
        model = TenantQuota
        fields = ['max_users', 'max_admins', 'max_storage_mb', 'max_products']


class TenantQuotaUsageSerializer(serializers.ModelSerializer):
    """
    租户配额使用情况序列化器
    """
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    usage_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = TenantQuota
        fields = [
            'tenant', 'tenant_name', 'max_users', 'max_admins', 
            'max_storage_mb', 'max_products', 'current_storage_used_mb',
            'usage_percentage'
        ]
        read_only_fields = fields
    
    def get_usage_percentage(self, obj):
        """
        获取各项资源的使用百分比
        """
        return {
            'users': obj.get_usage_percentage('users'),
            'admins': obj.get_usage_percentage('admins'),
            'storage': obj.get_usage_percentage('storage'),
            'products': obj.get_usage_percentage('products')
        }


class TenantSimpleSerializer(serializers.ModelSerializer):
    """
    简化版租户序列化器，用于列表展示
    """
    class Meta:
        model = Tenant
        fields = ('id', 'name', 'code', 'status')


class TenantBusinessInfoSerializer(serializers.ModelSerializer):
    """
    租户企业信息序列化器
    """
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    verification_status_display = serializers.CharField(source='get_verification_status_display', read_only=True)
    business_term_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = TenantBusinessInfo
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by',
                            'verification_status', 'verification_time', 'verification_user')
    
    def get_business_term_formatted(self, obj):
        """
        格式化营业期限
        """
        if obj.business_term_start and obj.business_term_end:
            return f"{obj.business_term_start} 至 {obj.business_term_end}"
        elif obj.business_term_start:
            return f"{obj.business_term_start} 起"
        return ""
    
    def validate_unified_social_credit_code(self, value):
        """
        验证统一社会信用代码
        """
        # 检查是否已存在相同的统一社会信用代码
        instance = getattr(self, 'instance', None)
        if TenantBusinessInfo.objects.filter(unified_social_credit_code=value).exclude(pk=getattr(instance, 'pk', None)).exists():
            raise serializers.ValidationError(_("该统一社会信用代码已被使用"))
        
        # 可以在这里添加更多的验证逻辑，比如格式检查
        # 标准的统一社会信用代码为18位
        if len(value) != 18:
            raise serializers.ValidationError(_("统一社会信用代码应为18位"))
        
        return value
    
    def create(self, validated_data):
        """
        创建时设置创建人
        """
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """
        更新时设置更新人
        """
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['updated_by'] = request.user
        
        return super().update(instance, validated_data)


class TenantBusinessInfoSimpleSerializer(serializers.ModelSerializer):
    """
    简化版租户企业信息序列化器，用于列表展示
    """
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    verification_status_display = serializers.CharField(source='get_verification_status_display', read_only=True)
    
    class Meta:
        model = TenantBusinessInfo
        fields = ('id', 'tenant', 'tenant_name', 'company_name', 'legal_representative', 
                  'unified_social_credit_code', 'verification_status', 'verification_status_display') 