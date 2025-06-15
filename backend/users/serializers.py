"""
用户序列化器
"""
import logging
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from users.models import User
from tenants.models import Tenant

# 添加日志器
logger = logging.getLogger(__name__)

class UserSerializer(serializers.ModelSerializer):
    """
    用户序列化器
    """
    tenant_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone', 'nick_name', 'first_name', 
            'last_name', 'is_active', 'avatar', 'tenant', 'tenant_name', 
            'is_admin', 'is_member', 'is_super_admin', 'role', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined', 'role', 'tenant_name', 'is_member']
        extra_kwargs = {
            'is_admin': {'read_only': True},
            'is_super_admin': {'read_only': True},
        }
    
    def get_tenant_name(self, obj) -> str:
        """获取租户名称"""
        if obj.tenant:
            return obj.tenant.name
        return None
    
    def get_role(self, obj) -> str:
        """获取用户角色"""
        return obj.display_role
    
    def get_is_member(self, obj) -> bool:
        """获取是否为普通成员"""
        # 对于User模型实例，默认不是普通成员
        return getattr(obj, 'is_member', False)
    
    def get_avatar(self, obj) -> str:
        """获取完整的头像URL"""
        if not obj.avatar:
            return ""
            
        # 如果已经是完整URL，直接返回
        if obj.avatar.startswith(('http://', 'https://')):
            return obj.avatar
            
        # 获取请求对象
        request = self.context.get('request')
        if request is not None:
            # 从请求中获取域名和协议
            protocol = 'https' if request.is_secure() else 'http'
            domain = request.get_host()
            # 确保路径以/开头
            path = obj.avatar if obj.avatar.startswith('/') else f'/{obj.avatar}'
            return f"{protocol}://{domain}{path}"
            
        # 如果无法获取请求对象，使用配置中的BASE_URL
        from django.conf import settings
        base_url = getattr(settings, 'BASE_URL', 'http://localhost:8000')
        # 确保路径以/开头
        path = obj.avatar if obj.avatar.startswith('/') else f'/{obj.avatar}'
        return f"{base_url}{path}"


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
    is_member = serializers.BooleanField(write_only=True, required=False, default=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone', 'nick_name', 'first_name',
            'last_name', 'password', 'password_confirm', 'tenant_id',
            'is_admin', 'is_member', 'avatar'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'id': {'read_only': True},
            'is_admin': {'write_only': True}
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
        # 从validated_data中移除is_member字段，因为User模型中实际不存在这个字段
        is_member = validated_data.pop('is_member', True)
        
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
        # 不需要设置is_member，因为User模型中没有这个字段
        
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
    用户角色序列化器，用于更新用户角色
    """
    is_member = serializers.BooleanField(required=False)
    
    class Meta:
        model = User
        fields = ['id', 'is_admin', 'is_member']
        read_only_fields = ['id']
        
    def validate(self, data):
        """
        验证角色数据
        """
        # 检查是否至少有一个角色
        if not data.get('is_admin') and not data.get('is_member', True):
            raise serializers.ValidationError({"non_field_errors": "用户必须至少有一个角色"})
        return data
    
    def update(self, instance, validated_data):
        """
        更新用户角色
        """
        # 更新Admin角色
        instance.is_admin = validated_data.get('is_admin', instance.is_admin)
        
        # 移除is_member字段，因为User模型中实际不存在
        if 'is_member' in validated_data:
            validated_data.pop('is_member')
        
        # 设置普通管理员还是超级管理员
        if instance.is_super_admin and not instance.is_admin:
            instance.is_super_admin = False
            instance.is_staff = False
            instance.is_superuser = False
            
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
        验证用户名/邮箱和密码
        从User和Member两个模型中查找用户
        """
        username_or_email = data['username']
        password = data['password']
        
        # 尝试通过用户名登录
        user = authenticate(username=username_or_email, password=password)
        
        # 如果用户名登录失败，尝试通过邮箱登录
        if not user:
            # 从User模型中查找邮箱匹配的用户
            try:
                user_by_email = User.objects.get(email=username_or_email, is_deleted=False)
                # 验证密码
                if user_by_email.check_password(password):
                    user = user_by_email
            except User.DoesNotExist:
                # 尝试从Member模型中查找
                from users.models import Member
                try:
                    member_by_email = Member.objects.get(email=username_or_email, is_deleted=False)
                    # 验证密码
                    if member_by_email.check_password(password):
                        user = member_by_email
                except Member.DoesNotExist:
                    # 邮箱也找不到，保持user = None
                    pass
        
        # 如果仍未找到用户，尝试在Member模型中通过用户名查找
        if not user:
            from users.models import Member
            try:
                member = Member.objects.get(username=username_or_email, is_deleted=False)
                # 验证密码
                if member.check_password(password):
                    user = member
            except Member.DoesNotExist:
                # 用户名也找不到，保持user = None
                pass
        
        if not user:
            raise serializers.ValidationError("用户名/邮箱或密码错误")
        
        # 验证用户状态
        if not user.is_active:
            raise serializers.ValidationError("用户已被禁用")
        
        if user.is_deleted:
            raise serializers.ValidationError("用户已被删除")
            
        # 检查用户是否为子账号（适用于Member模型）
        if hasattr(user, 'parent') and user.parent:
            raise serializers.ValidationError("子账号不允许登录")
            
        # 验证租户状态
        if user.tenant and not getattr(user, 'is_super_admin', False):
            if user.tenant.status != 'active':
                raise serializers.ValidationError("所属租户已被禁用或暂停")
        
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
    display_name = serializers.CharField(read_only=True)
    avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'display_name', 'avatar']
        read_only_fields = ['id', 'username', 'display_name', 'avatar']
        
    def get_avatar(self, obj) -> str:
        """获取完整的头像URL"""
        if not obj.avatar:
            return ""
            
        # 如果已经是完整URL，直接返回
        if obj.avatar.startswith(('http://', 'https://')):
            return obj.avatar
            
        # 获取请求对象
        request = self.context.get('request')
        if request is not None:
            # 从请求中获取域名和协议
            protocol = 'https' if request.is_secure() else 'http'
            domain = request.get_host()
            # 确保路径以/开头
            path = obj.avatar if obj.avatar.startswith('/') else f'/{obj.avatar}'
            return f"{protocol}://{domain}{path}"
            
        # 如果无法获取请求对象，使用配置中的BASE_URL
        from django.conf import settings
        base_url = getattr(settings, 'BASE_URL', 'http://localhost:8000')
        # 确保路径以/开头
        path = obj.avatar if obj.avatar.startswith('/') else f'/{obj.avatar}'
        return f"{base_url}{path}"


class UserListSerializer(serializers.ModelSerializer):
    """
    用户列表序列化器，用于租户用户列表显示
    """
    tenant_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'nick_name', 'email', 'phone',
            'is_active', 'avatar', 'tenant', 'tenant_name', 
            'is_admin', 'is_member', 'role', 'date_joined'
        ]
        read_only_fields = fields
    
    def get_tenant_name(self, obj) -> str:
        """获取租户名称"""
        if obj.tenant:
            return obj.tenant.name
        return None
    
    def get_role(self, obj) -> str:
        """获取用户角色"""
        return obj.display_role
        
    def get_is_member(self, obj) -> bool:
        """获取是否为普通成员"""
        # 对于User模型实例，默认不是普通成员
        return getattr(obj, 'is_member', False)
        
    def get_avatar(self, obj) -> str:
        """获取完整的头像URL"""
        if not obj.avatar:
            return ""
            
        # 如果已经是完整URL，直接返回
        if obj.avatar.startswith(('http://', 'https://')):
            return obj.avatar
            
        # 获取请求对象
        request = self.context.get('request')
        if request is not None:
            # 从请求中获取域名和协议
            protocol = 'https' if request.is_secure() else 'http'
            domain = request.get_host()
            # 确保路径以/开头
            path = obj.avatar if obj.avatar.startswith('/') else f'/{obj.avatar}'
            return f"{protocol}://{domain}{path}"
            
        # 如果无法获取请求对象，使用配置中的BASE_URL
        from django.conf import settings
        base_url = getattr(settings, 'BASE_URL', 'http://localhost:8000')
        # 确保路径以/开头
        path = obj.avatar if obj.avatar.startswith('/') else f'/{obj.avatar}'
        return f"{base_url}{path}"


class RegisterSerializer(serializers.ModelSerializer):
    """
    用户注册序列化器
    """
    password_confirm = serializers.CharField(write_only=True, required=True)
    tenant_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'phone', 'nick_name', 
            'password', 'password_confirm', 'tenant_id'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True},
            'phone': {'required': False},
            'nick_name': {'required': False}
        }
    
    def validate_email(self, value):
        """
        验证邮箱是否已被同一租户下使用
        """
        tenant_id = self.initial_data.get('tenant_id')
        if tenant_id:
            if User.objects.filter(email=value, tenant_id=tenant_id, is_deleted=False).exists():
                raise serializers.ValidationError("该租户下此邮箱已被注册")
        else:
            # 对于没有指定租户的情况，只检查超级管理员（无租户用户）中是否有重复
            if User.objects.filter(email=value, tenant__isnull=True, is_deleted=False).exists():
                raise serializers.ValidationError("该邮箱已被注册")
        return value
    
    def validate_username(self, value):
        """
        验证用户名是否已被同一租户下使用
        """
        tenant_id = self.initial_data.get('tenant_id')
        if tenant_id:
            if User.objects.filter(username=value, tenant_id=tenant_id, is_deleted=False).exists():
                raise serializers.ValidationError("该租户下此用户名已被使用")
        else:
            # 对于没有指定租户的情况，只检查超级管理员（无租户用户）中是否有重复
            if User.objects.filter(username=value, tenant__isnull=True, is_deleted=False).exists():
                raise serializers.ValidationError("该用户名已被使用")
        return value
    
    def validate_phone(self, value):
        """
        验证手机号是否已被同一租户下使用
        """
        tenant_id = self.initial_data.get('tenant_id')
        if value and tenant_id:
            if User.objects.filter(phone=value, tenant_id=tenant_id, is_deleted=False).exists():
                raise serializers.ValidationError("该租户下此手机号已被注册")
        elif value and not tenant_id:
            # 对于没有指定租户的情况，只检查超级管理员（无租户用户）中是否有重复
            if User.objects.filter(phone=value, tenant__isnull=True, is_deleted=False).exists():
                raise serializers.ValidationError("该手机号已被注册")
        return value
    
    def validate(self, data):
        """
        验证密码一致性和强度
        """
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({"password_confirm": "两次输入的密码不一致"})
        
        # 验证密码强度
        validate_password(data['password'])
        
        # 处理租户ID
        tenant_id = data.pop('tenant_id', None)
        if tenant_id:
            try:
                tenant = Tenant.objects.get(id=tenant_id, status='active', is_deleted=False)
                data['tenant'] = tenant
            except Tenant.DoesNotExist:
                raise serializers.ValidationError({"tenant_id": "无效的租户ID"})
        
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
        for field in ['phone', 'nick_name', 'tenant']:
            if field in validated_data:
                setattr(user, field, validated_data[field])
        
        # 设置管理员状态
        user.is_admin = False
        user.status = 'active'
        
        user.save()
        return user


class SubAccountCreateSerializer(serializers.ModelSerializer):
    """
    子账号创建序列化器
    """
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone', 'nick_name', 'first_name',
            'last_name', 'password', 'avatar'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'id': {'read_only': True}
        }
    
    def validate_username(self, value):
        """
        验证用户名唯一性
        """
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("该用户名已被使用")
        return value
    
    def validate_email(self, value):
        """
        验证邮箱唯一性
        """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("该邮箱已被使用")
        return value
    
    def create(self, validated_data):
        """
        创建子账号
        """
        # 获取当前用户作为父账号
        parent_user = self.context['request'].user
        
        # 使用默认密码"123456"（如果未提供）
        password = validated_data.get('password', '123456')
        
        # 创建用户但不允许登录
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=password,
            is_active=False  # 子账号不允许登录
        )
        
        # 设置父账号关系
        user.parent = parent_user
        
        # 子账号继承父账号的租户
        user.tenant = parent_user.tenant
        
        # 设置其他字段
        for field in ['phone', 'nick_name', 'first_name', 'last_name', 'avatar']:
            if field in validated_data:
                setattr(user, field, validated_data[field])
        
        # 子账号权限设置
        user.is_admin = False
        user.is_super_admin = False
        user.is_staff = False
        user.is_superuser = False
        
        # 保存
        user.save()
        
        logger.info(f"用户 {parent_user.username} 创建了子账号 {user.username}，使用{'默认' if password == '123456' else '自定义'}密码")
        return user 