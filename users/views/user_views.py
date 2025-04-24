"""
用户相关视图
"""
import logging
import os
import uuid
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.conf import settings
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema

from common.permissions import IsAdmin, IsSuperAdmin
from users.models import User
from users.serializers import (
    UserSerializer, 
    UserCreateSerializer, 
    ChangePasswordSerializer,
    SuperAdminCreateSerializer,
    UserRoleSerializer,
    SubAccountCreateSerializer
)
from users.schema import sub_account_create_request_examples, sub_account_create_response_examples, sub_account_create_responses
from common.schema import api_schema
from tenants.models import Tenant

logger = logging.getLogger(__name__)

class CurrentUserView(APIView):
    """
    获取和更新当前登录用户信息
    """
    def get(self, request, *args, **kwargs):
        # 使用自定义序列化器返回详细用户信息
        serializer = UserSerializer(request.user, context={'request': request})
        logger.info(f"用户 {request.user.username} 获取了自己的信息")
        return Response(serializer.data)
    
    def put(self, request, *args, **kwargs):
        """
        更新当前用户的基本信息
        """
        serializer = UserSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            logger.info(f"用户 {request.user.username} 更新了自己的基本信息")
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserListCreateView(generics.ListCreateAPIView):
    """
    用户列表和创建视图
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = UserSerializer
    pagination_class = PageNumberPagination
    
    def get_serializer_class(self):
        # 创建用户时使用创建序列化器
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer
    
    def get_serializer_context(self):
        """
        添加请求到序列化器上下文
        """
        context = super().get_serializer_context()
        context.update({
            'request': self.request,
        })
        return context
    
    def get_queryset(self):
        """
        获取查询集，支持过滤
        """
        user = self.request.user
        
        # 超级管理员可以看到所有用户
        if user.is_super_admin:
            queryset = User.objects.filter(is_deleted=False)
        # 租户管理员只能看到自己租户的用户
        elif user.is_admin and user.tenant:
            queryset = User.objects.filter(tenant=user.tenant, is_deleted=False)
        # 普通用户只能看到自己
        else:
            queryset = User.objects.filter(pk=user.pk, is_deleted=False)
        
        # 搜索条件
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) | 
                Q(email__icontains=search) | 
                Q(nick_name__icontains=search) |
                Q(phone__icontains=search)
            )
        
        # 状态过滤
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # 角色过滤
        is_admin = self.request.query_params.get('is_admin', None)
        if is_admin is not None:
            is_admin = is_admin.lower() == 'true'
            queryset = queryset.filter(is_admin=is_admin)
        
        # 子账号过滤
        is_sub_account = self.request.query_params.get('is_sub_account', None)
        if is_sub_account is not None:
            is_sub = is_sub_account.lower() == 'true'
            if is_sub:
                queryset = queryset.filter(parent__isnull=False)
            else:
                queryset = queryset.filter(parent__isnull=True)
        
        # 父账号过滤
        parent_id = self.request.query_params.get('parent', None)
        if parent_id:
            try:
                parent_id = int(parent_id)
                # 如果是查询自己的子账号，放行
                if parent_id == user.id:
                    queryset = queryset.filter(parent_id=parent_id)
                # 对于超级管理员可以查看任何人的子账号
                elif user.is_super_admin:
                    queryset = queryset.filter(parent_id=parent_id)
                # 对于租户管理员只能查看同一租户下用户的子账号
                elif user.is_admin and user.tenant:
                    parent = User.objects.filter(pk=parent_id, tenant=user.tenant).first()
                    if parent:
                        queryset = queryset.filter(parent_id=parent_id)
                    else:
                        queryset = User.objects.none()
                # 普通用户只能查看自己的子账号
                else:
                    if parent_id != user.id:
                        queryset = User.objects.none()
                    else:
                        queryset = queryset.filter(parent_id=parent_id)
            except ValueError:
                queryset = User.objects.none()
        
        return queryset
    
    def perform_create(self, serializer):
        """
        创建用户
        """
        user = self.request.user
        
        # 设置租户
        tenant = None
        if not user.is_super_admin:
            tenant = user.tenant
        
        # 如果传入了tenant_id参数并且是超级管理员
        tenant_id = self.request.data.get('tenant_id')
        if tenant_id and user.is_super_admin:
            tenant = get_object_or_404(Tenant, pk=tenant_id)
        
        logger.info(f"用户 {user.username} 创建新用户，租户设置为: {tenant.name if tenant else '无租户'}")
        serializer.save(tenant=tenant)

class UserRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """
    用户详情、更新和删除视图
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_context(self):
        """
        添加请求到序列化器上下文
        """
        context = super().get_serializer_context()
        context.update({
            'request': self.request,
        })
        return context
    
    def get_queryset(self):
        """
        获取查询集
        """
        user = self.request.user
        
        # 超级管理员可以操作所有用户
        if user.is_super_admin:
            return User.objects.filter(is_deleted=False)
        
        # 租户管理员只能操作自己租户的用户
        if user.is_admin and user.tenant:
            return User.objects.filter(tenant=user.tenant, is_deleted=False)
        
        # 普通用户只能操作自己
        return User.objects.filter(pk=user.pk, is_deleted=False)
    
    def destroy(self, request, *args, **kwargs):
        """
        删除用户（软删除）
        """
        instance = self.get_object()
        
        # 不能删除自己
        if instance.pk == request.user.pk:
            return Response(
                {"detail": "不能删除当前登录的用户账号"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 软删除
        instance.soft_delete()
        logger.info(f"用户 {request.user.username} 删除了用户 {instance.username}")
        
        return Response(status=status.HTTP_204_NO_CONTENT)

class ChangePasswordView(generics.UpdateAPIView):
    """
    修改密码视图
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            # 检查旧密码
            if not user.check_password(serializer.data.get('old_password')):
                return Response(
                    {"old_password": ["旧密码不正确"]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 设置新密码
            user.set_password(serializer.data.get('new_password'))
            user.save()
            logger.info(f"用户 {user.username} 修改了密码")
            
            return Response(
                {"detail": "密码修改成功"},
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SuperAdminCreateView(generics.CreateAPIView):
    """
    创建超级管理员账号视图
    """
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    serializer_class = SuperAdminCreateSerializer
    
    def perform_create(self, serializer):
        # 设置为超级管理员
        user = serializer.save(is_super_admin=True, is_admin=True, is_staff=True)
        logger.info(f"超级管理员 {self.request.user.username} 创建了新的超级管理员账号 {user.username}")

class GrantSuperAdminView(APIView):
    """
    授予超级管理员权限视图
    """
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    
    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        
        # 已经是超级管理员
        if user.is_super_admin:
            return Response(
                {"detail": "该用户已经是超级管理员"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 授予权限
        user.is_super_admin = True
        user.is_admin = True
        user.is_staff = True
        user.tenant = None  # 超级管理员不属于任何租户
        user.save()
        
        logger.info(f"超级管理员 {request.user.username} 将用户 {user.username} 提升为超级管理员")
        return Response(
            {"detail": f"已将用户 {user.username} 提升为超级管理员"},
            status=status.HTTP_200_OK
        )

class RevokeSuperAdminView(APIView):
    """
    撤销超级管理员权限视图
    """
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    
    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        
        # 不是超级管理员
        if not user.is_super_admin:
            return Response(
                {"detail": "该用户不是超级管理员"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 不能撤销自己的超级管理员权限
        if user.pk == request.user.pk:
            return Response(
                {"detail": "不能撤销自己的超级管理员权限"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 撤销权限
        user.is_super_admin = False
        user.is_staff = False
        user.save()
        
        logger.info(f"超级管理员 {request.user.username} 撤销了用户 {user.username} 的超级管理员权限")
        return Response(
            {"detail": f"已撤销用户 {user.username} 的超级管理员权限"},
            status=status.HTTP_200_OK
        )

class UserRoleUpdateView(APIView):
    """
    更新用户角色视图
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    
    def post(self, request, pk):
        # 获取用户
        user = self.request.user
        target_user = get_object_or_404(User, pk=pk)
        
        # 管理员权限检查
        if not user.is_super_admin and user.tenant != target_user.tenant:
            raise PermissionDenied("无权限更改其他租户的用户角色")
        
        # 不能修改超级管理员的角色
        if target_user.is_super_admin:
            return Response(
                {"detail": "不能修改超级管理员的角色"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 序列化处理
        serializer = UserRoleSerializer(target_user, data=request.data)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"用户 {user.username} 更新了用户 {target_user.username} 的角色")
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TenantUserListView(generics.ListAPIView):
    """
    租户用户列表视图
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        """
        获取查询集
        """
        user = self.request.user
        tenant_id = self.kwargs.get('tenant_id')
        
        # 获取租户
        tenant = get_object_or_404(Tenant, pk=tenant_id)
        
        # 超级管理员可以查看任何租户的用户
        if user.is_super_admin:
            return User.objects.filter(tenant=tenant, is_deleted=False)
        
        # 非超级管理员只能查看自己租户的用户
        if user.tenant and user.tenant.pk == tenant.pk and user.is_admin:
            return User.objects.filter(tenant=tenant, is_deleted=False)
        
        # 其他情况无权限
        raise PermissionDenied("无权限查看其他租户的用户列表")

class SubAccountCreateView(generics.CreateAPIView):
    """
    创建子账号视图
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SubAccountCreateSerializer
    
    @api_schema(
        summary="创建子账号",
        description="创建一个与当前用户关联的子账号，子账号不能登录系统，仅用于数据关联",
        request_body=SubAccountCreateSerializer,
        responses=sub_account_create_responses,
        examples=sub_account_create_request_examples + sub_account_create_response_examples,
        tags=["用户管理"]
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        """
        创建子账号
        """
        user = serializer.save()
        logger.info(f"用户 {self.request.user.username} 创建了子账号 {user.username}")
        return user
        
    def create(self, request, *args, **kwargs):
        """
        重写创建方法，使用标准响应
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = self.perform_create(serializer)
        
        # 使用标准DRF响应，让中间件处理格式化
        headers = self.get_success_headers(serializer.data)
        return Response(
            UserSerializer(instance).data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

class UserAvatarUploadView(APIView):
    """
    用户头像上传视图
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request, *args, **kwargs):
        """
        上传用户头像
        """
        user = request.user
        avatar_file = request.FILES.get('avatar')
        
        if not avatar_file:
            return Response(
                {"detail": "未提供头像文件"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 验证文件类型
        valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
        ext = os.path.splitext(avatar_file.name)[1].lower()
        if ext not in valid_extensions:
            return Response(
                {"detail": "不支持的文件类型，请上传JPG、PNG、GIF、WEBP或BMP格式的图片"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 验证文件大小
        if avatar_file.size > 2 * 1024 * 1024:  # 2MB
            return Response(
                {"detail": "文件太大，头像大小不能超过2MB"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # 删除旧头像文件（如果存在）
            if user.avatar and user.avatar.startswith(settings.MEDIA_URL):
                # 获取相对路径
                avatar_path = user.avatar.replace(settings.MEDIA_URL, '', 1)
                old_avatar_path = os.path.join(settings.MEDIA_ROOT, avatar_path)
                
                # 检查文件是否存在，如果存在则删除
                if os.path.isfile(old_avatar_path):
                    try:
                        os.remove(old_avatar_path)
                        logger.info(f"删除用户 {user.username} 的旧头像 {old_avatar_path}")
                    except OSError as e:
                        logger.warning(f"删除旧头像文件失败: {str(e)}")
            
            # 生成唯一文件名，避免覆盖已有文件
            unique_filename = f"{uuid.uuid4()}{ext}"
            
            # 确保媒体目录存在
            avatar_dir = os.path.join(settings.MEDIA_ROOT, 'avatars')
            os.makedirs(avatar_dir, exist_ok=True)
            
            # 保存文件
            file_path = os.path.join(avatar_dir, unique_filename)
            with open(file_path, 'wb+') as destination:
                for chunk in avatar_file.chunks():
                    destination.write(chunk)
            
            # 生成相对URL路径（保存到数据库）
            relative_url = f"{settings.MEDIA_URL}avatars/{unique_filename}"
            
            # 更新用户头像URL
            user.avatar = relative_url
            user.save(update_fields=['avatar'])
            
            # 为响应生成完整URL
            protocol = 'https' if request.is_secure() else 'http'
            domain = request.get_host()
            full_url = f"{protocol}://{domain}{relative_url}"
            
            logger.info(f"用户 {user.username} 上传了新头像")
            
            return Response({
                "detail": "头像上传成功",
                "avatar": full_url  # 返回给前端的是完整URL
            })
        
        except Exception as e:
            logger.error(f"头像上传失败: {str(e)}")
            return Response(
                {"detail": f"头像上传失败: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )