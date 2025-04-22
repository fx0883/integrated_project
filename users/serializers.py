"""
用户序列化器
"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from users.models import User
from tenants.models import Tenant

class UserSerializer(serializers.ModelSerializer):
    """
    用户序列化器
    """
    tenant_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone', 'nick_name', 'first_name', 
            'last_name', 'is_active', 'avatar', 'tenant', 'tenant_name', 
            'is_admin', 'is_member', 'is_super_admin', 'role', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined', 'role', 'tenant_name']
        extra_kwargs = {
            'is_admin': {'read_only': True},
            'is_member': {'read_only': True},
            'is_super_admin': {'read_only': True},
        }
    
    def get_tenant_name(self, obj):
        """获取租户名称"""
        if obj.tenant:
            return obj.tenant.name
        return None
    
    def get_role(self, obj):
        """获取用户角色"""
        return obj.display_role


class UserCreateSerializer(serializers.ModelSerializer):
    """
    用户创建序列化器
    """
    password_confirm = serializers.CharField(write_only=True)
    tenant_id = serializers.PrimaryKeyRelatedField(
        queryset=Tenant.objects.all(),
        required=False,
        source='tenant',
        write_only=True
    )
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone', 'nick_name', 'first_name',
            'last_name', 'password', 'password_confirm', 'tenant_id',
            'is_admin', 'is_member', 'avatar'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'id': {'read_only': True}
        }
    
    def validate(self, data):
        """
        验证密码一致性
        """
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({"password_confirm": "两次输入的密码不一致"})
        
        # 验证密码强度
        validate_password(data['password'])
        
        return data
    
    def create(self, validated_data):
        """
        创建用户
        """
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        # 设置其他字段
        for field in ['phone', 'nick_name', 'first_name', 'last_name', 'tenant', 'avatar']:
            if field in validated_data:
                setattr(user, field, validated_data[field])
        
        # 设置角色
        user.is_admin = validated_data.get('is_admin', False)
        user.is_member = validated_data.get('is_member', True)
        
        user.save()
        return user


class SuperAdminCreateSerializer(UserCreateSerializer):
    """
    超级管理员创建序列化器
    """
    class Meta(UserCreateSerializer.Meta):
        fields = [
            'id', 'username', 'email', 'phone', 'nick_name', 'first_name',
            'last_name', 'password', 'password_confirm', 'avatar'
        ]
    
    def create(self, validated_data):
        """
        创建超级管理员
        """
        user = super().create(validated_data)
        user.is_super_admin = True
        user.is_admin = True
        user.is_staff = True
        user.is_superuser = True
        user.tenant = None  # 超级管理员不属于任何租户
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    用户更新序列化器
    """
    class Meta:
        model = User
        fields = [
            'id', 'phone', 'nick_name', 'first_name', 'last_name', 
            'avatar', 'is_active', 'status'
        ]
        read_only_fields = ['id']


class UserPasswordUpdateSerializer(serializers.Serializer):
    """
    用户密码更新序列化器
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)
    new_password_confirm = serializers.CharField(required=True, write_only=True)
    
    def validate_old_password(self, value):
        """
        验证旧密码是否正确
        """
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("旧密码不正确")
        return value
    
    def validate(self, data):
        """
        验证新密码的一致性和强度
        """
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({"new_password_confirm": "两次输入的新密码不一致"})
        
        # 验证新密码强度
        validate_password(data['new_password'])
        
        return data
    
    def save(self, **kwargs):
        """
        保存新密码
        """
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """
    修改密码序列化器
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)
    new_password_confirm = serializers.CharField(required=True, write_only=True)
    
    def validate(self, data):
        """
        验证新密码的一致性和强度
        """
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({"new_password_confirm": "两次输入的新密码不一致"})
        
        # 验证新密码强度
        validate_password(data['new_password'])
        
        return data


class UserRoleUpdateSerializer(serializers.Serializer):
    """
    用户角色更新序列化器
    """
    is_admin = serializers.BooleanField(required=True)
    
    def validate(self, data):
        """
        验证角色变更权限
        """
        # 检查当前用户是否有权限更改角色
        request_user = self.context['request'].user
        target_user = self.instance
        
        # 只有超级管理员或同一租户的管理员可以更改角色
        if not request_user.is_super_admin and (
            not request_user.is_admin or 
            request_user.tenant != target_user.tenant
        ):
            raise serializers.ValidationError("您没有权限更改此用户的角色")
        
        # 不能取消自己的管理员权限
        if request_user == target_user and not data['is_admin'] and request_user.is_admin:
            raise serializers.ValidationError("您不能取消自己的管理员权限")
        
        # 租户管理员不能修改超级管理员的角色
        if target_user.is_super_admin and not request_user.is_super_admin:
            raise serializers.ValidationError("您不能修改超级管理员的角色")
        
        return data
    
    def update(self, instance, validated_data):
        """
        更新用户角色
        """
        # 如果用户变成管理员，检查配额
        if validated_data['is_admin'] and not instance.is_admin and instance.tenant:
            quota = instance.tenant.quota
            if not quota.can_add_user(is_admin=True):
                raise serializers.ValidationError({"is_admin": "租户管理员配额已满"})
        
        # 更新角色
        instance.is_admin = validated_data['is_admin']
        
        # 如果取消管理员角色，确保用户至少是普通成员
        if not instance.is_admin:
            instance.is_member = True
        
        instance.save()
        return instance


class UserRoleSerializer(serializers.ModelSerializer):
    """
    用户角色序列化器
    """
    class Meta:
        model = User
        fields = ['id', 'is_admin', 'is_member']
        read_only_fields = ['id']
    
    def validate(self, data):
        """
        验证角色变更
        """
        # 角色验证规则
        if not data.get('is_admin') and not data.get('is_member'):
            raise serializers.ValidationError("用户必须至少有一个角色")
        
        return data
    
    def update(self, instance, validated_data):
        """
        更新用户角色
        """
        # 如果用户变成管理员，检查配额
        if validated_data.get('is_admin', False) and not instance.is_admin and instance.tenant:
            quota = instance.tenant.quota
            if not quota.can_add_user(is_admin=True):
                raise serializers.ValidationError({"is_admin": "租户管理员配额已满"})
        
        # 更新角色
        instance.is_admin = validated_data.get('is_admin', instance.is_admin)
        instance.is_member = validated_data.get('is_member', instance.is_member)
        
        instance.save()
        return instance


class LoginSerializer(serializers.Serializer):
    """
    登录序列化器
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, style={'input_type': 'password'})
    
    def validate(self, data):
        """
        验证用户名和密码
        """
        user = authenticate(
            username=data['username'],
            password=data['password']
        )
        
        if not user:
            raise serializers.ValidationError("用户名或密码错误")
        
        if not user.is_active:
            raise serializers.ValidationError("用户已被禁用")
        
        # 添加到验证后的数据中
        data['user'] = user
        return data


class TokenRefreshSerializer(serializers.Serializer):
    """
    Token刷新序列化器
    """
    refresh_token = serializers.CharField(required=True)


class UserMinimalSerializer(serializers.ModelSerializer):
    """
    用户最小化序列化器，用于嵌套在其他序列化器中
    """
    display_name = serializers.CharField(source='display_name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'display_name', 'avatar']
        read_only_fields = ['id', 'username', 'display_name', 'avatar']


class UserListSerializer(serializers.ModelSerializer):
    """
    用户列表序列化器，用于租户用户列表显示
    """
    tenant_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'nick_name', 'email', 'phone',
            'is_active', 'avatar', 'tenant', 'tenant_name', 
            'is_admin', 'is_member', 'role', 'date_joined'
        ]
        read_only_fields = fields
    
    def get_tenant_name(self, obj):
        """获取租户名称"""
        if obj.tenant:
            return obj.tenant.name
        return None
    
    def get_role(self, obj):
        """获取用户角色"""
        return obj.display_role 