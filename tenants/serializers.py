"""
租户和租户配额的序列化器
"""
from rest_framework import serializers
from tenants.models import Tenant, TenantQuota
from users.serializers import UserMinimalSerializer

class TenantSerializer(serializers.ModelSerializer):
    """
    租户序列化器，用于列表展示
    """
    class Meta:
        model = Tenant
        fields = [
            'id', 'name', 'status', 'contact_name', 'contact_email',
            'contact_phone', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


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
    
    def get_user_count(self, obj):
        """获取租户用户数量"""
        return obj.users.filter(is_deleted=False).count()
    
    def get_admin_count(self, obj):
        """获取租户管理员数量"""
        return obj.users.filter(is_admin=True, is_deleted=False).count()


class TenantQuotaSerializer(serializers.ModelSerializer):
    """
    租户配额序列化器
    """
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = TenantQuota
        fields = [
            'id', 'tenant', 'tenant_name', 'max_users', 'max_admins', 
            'max_storage_mb', 'max_products', 'current_storage_used_mb',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tenant', 'tenant_name', 'created_at', 'updated_at']


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