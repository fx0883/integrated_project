from django.shortcuts import render

# Create your views here.

"""
菜单管理系统视图
"""
import logging
from django.db import transaction
from django.db.models import Q
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter

from common.permissions import IsAdmin, IsSuperAdmin
from .models import Menu, TenantMenu
from .serializers import (
    MenuSerializer, MenuTreeSerializer, TenantMenuSerializer,
    TenantMenuDetailSerializer, TenantMenusSerializer, UserMenuSerializer
)
from tenants.models import Tenant

logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(
        summary="获取菜单列表",
        description="获取系统中的所有菜单项，超级管理员可获取所有菜单，租户管理员只能获取分配给其租户的菜单",
        tags=["菜单管理"],
        parameters=[
            OpenApiParameter(name="is_active", description="筛选激活/未激活的菜单", required=False, type=bool),
            OpenApiParameter(name="parent_id", description="筛选特定父菜单的子菜单", required=False, type=int),
            OpenApiParameter(name="search", description="搜索菜单名称或标识符", required=False, type=str),
        ]
    ),
    retrieve=extend_schema(
        summary="获取单个菜单",
        description="获取指定ID的菜单详情",
        tags=["菜单管理"]
    ),
    create=extend_schema(
        summary="创建菜单",
        description="创建新的菜单项",
        tags=["菜单管理"]
    ),
    update=extend_schema(
        summary="更新菜单",
        description="更新指定ID的菜单",
        tags=["菜单管理"]
    ),
    partial_update=extend_schema(
        summary="部分更新菜单",
        description="部分更新指定ID的菜单",
        tags=["菜单管理"]
    ),
    destroy=extend_schema(
        summary="删除菜单",
        description="删除指定ID的菜单（同时会删除其所有子菜单）",
        tags=["菜单管理"]
    ),
)
class MenuViewSet(viewsets.ModelViewSet):
    """
    菜单管理视图集
    """
    permission_classes = [IsAdmin]
    serializer_class = MenuSerializer
    queryset = Menu.objects.all()

    def get_queryset(self):
        """
        根据用户角色和查询参数过滤菜单
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        # 只有超级管理员可以看到所有菜单
        if not user.is_super_admin and user.tenant:
            # 租户管理员只能看到分配给其租户的菜单
            tenant_menu_ids = TenantMenu.objects.filter(
                tenant=user.tenant
            ).values_list('menu_id', flat=True)
            queryset = queryset.filter(id__in=tenant_menu_ids)
        
        # 过滤条件
        is_active = self.request.query_params.get('is_active')
        parent_id = self.request.query_params.get('parent_id')
        search = self.request.query_params.get('search')
        
        if is_active is not None:
            is_active = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active)
            
        if parent_id:
            if parent_id.lower() == 'null':
                queryset = queryset.filter(parent__isnull=True)
            else:
                queryset = queryset.filter(parent_id=parent_id)
                
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(code__icontains=search)
            )
            
        return queryset.order_by('order', 'id')
    
    def perform_create(self, serializer):
        """
        创建菜单
        """
        if not self.request.user.is_super_admin:
            return Response(
                {"detail": "只有超级管理员才能创建菜单"},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer.save()
        logger.info(f"菜单 '{serializer.instance.name}' 创建成功，创建者: {self.request.user.username}")
    
    def perform_update(self, serializer):
        """
        更新菜单
        """
        if not self.request.user.is_super_admin:
            return Response(
                {"detail": "只有超级管理员才能更新菜单"},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer.save()
        logger.info(f"菜单 '{serializer.instance.name}' 更新成功，更新者: {self.request.user.username}")
    
    def perform_destroy(self, instance):
        """
        删除菜单
        """
        if not self.request.user.is_super_admin:
            return Response(
                {"detail": "只有超级管理员才能删除菜单"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        menu_name = instance.name
        # 获取所有子菜单
        descendants = instance.get_descendants(include_self=True)
        descendant_ids = [menu.id for menu in descendants]
        
        # 删除菜单及其子菜单
        Menu.objects.filter(id__in=descendant_ids).delete()
        
        logger.info(f"菜单 '{menu_name}' 及其子菜单已删除，删除者: {self.request.user.username}")

    @extend_schema(
        summary="获取菜单树形结构",
        description="获取菜单的树形结构，子菜单嵌套在父菜单内",
        tags=["菜单管理"],
        parameters=[
            OpenApiParameter(name="is_active", description="筛选激活/未激活的菜单", required=False, type=bool),
        ]
    )
    @action(detail=False, methods=['get'], url_path='tree')
    def tree(self, request):
        """
        获取菜单树形结构
        """
        # 只获取顶级菜单
        queryset = self.get_queryset().filter(parent__isnull=True)
        
        # 设置序列化上下文
        context = self.get_serializer_context()
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            context['is_active'] = is_active.lower() == 'true'
        
        serializer = MenuTreeSerializer(queryset, many=True, context=context)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="获取租户的菜单列表",
        description="获取指定租户的菜单列表",
        tags=["租户菜单管理"]
    ),
    create=extend_schema(
        summary="分配菜单给租户",
        description="为指定租户分配菜单",
        tags=["租户菜单管理"]
    ),
    destroy=extend_schema(
        summary="移除租户的菜单",
        description="移除租户的特定菜单",
        tags=["租户菜单管理"]
    ),
)
class TenantMenuViewSet(mixins.ListModelMixin,
                        mixins.CreateModelMixin,
                        mixins.DestroyModelMixin,
                        viewsets.GenericViewSet):
    """
    租户菜单管理视图集
    """
    permission_classes = [IsAdmin]
    serializer_class = TenantMenuDetailSerializer
    
    def get_queryset(self):
        """
        获取租户菜单关联
        """
        tenant_id = self.kwargs.get('tenant_id')
        user = self.request.user
        
        # 验证租户访问权限
        if not user.is_super_admin and (not user.tenant or str(user.tenant.id) != tenant_id):
            return TenantMenu.objects.none()
        
        return TenantMenu.objects.filter(tenant_id=tenant_id)
    
    def list(self, request, *args, **kwargs):
        """
        获取租户的菜单列表
        """
        tenant_id = kwargs.get('tenant_id')
        try:
            tenant = Tenant.objects.get(id=tenant_id)
        except Tenant.DoesNotExist:
            return Response(
                {"detail": "租户不存在"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        return Response({
            "tenant_id": tenant.id,
            "tenant_name": tenant.name,
            "menus": serializer.data
        })
    
    def create(self, request, *args, **kwargs):
        """
        为租户分配菜单
        """
        if not request.user.is_super_admin:
            return Response(
                {"detail": "只有超级管理员才能分配菜单给租户"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        tenant_id = kwargs.get('tenant_id')
        try:
            tenant = Tenant.objects.get(id=tenant_id)
        except Tenant.DoesNotExist:
            return Response(
                {"detail": "租户不存在"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = TenantMenusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        menu_ids = serializer.validated_data['menu_ids']
        menus = Menu.objects.filter(id__in=menu_ids)
        
        if len(menus) != len(menu_ids):
            return Response(
                {"detail": "包含无效的菜单ID"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        assigned_menus = []
        with transaction.atomic():
            for menu in menus:
                tenant_menu, created = TenantMenu.objects.get_or_create(
                    tenant=tenant,
                    menu=menu,
                    defaults={'is_active': True}
                )
                if not created and not tenant_menu.is_active:
                    tenant_menu.is_active = True
                    tenant_menu.save()
                
                assigned_menus.append({
                    "id": menu.id,
                    "name": menu.name
                })
        
        logger.info(f"租户 '{tenant.name}' 分配了 {len(assigned_menus)} 个菜单，操作者: {request.user.username}")
        
        return Response({
            "assigned_menus": assigned_menus
        }, status=status.HTTP_201_CREATED)
    
    def destroy(self, request, *args, **kwargs):
        """
        移除租户的特定菜单
        """
        if not request.user.is_super_admin:
            return Response(
                {"detail": "只有超级管理员才能移除租户的菜单"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        tenant_id = kwargs.get('tenant_id')
        menu_id = kwargs.get('pk')
        
        try:
            tenant_menu = TenantMenu.objects.get(tenant_id=tenant_id, menu_id=menu_id)
        except TenantMenu.DoesNotExist:
            return Response(
                {"detail": "租户菜单关联不存在"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        tenant_name = tenant_menu.tenant.name
        menu_name = tenant_menu.menu.name
        
        tenant_menu.delete()
        logger.info(f"移除租户 '{tenant_name}' 的菜单 '{menu_name}'，操作者: {request.user.username}")
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @extend_schema(
        summary="批量移除租户菜单",
        description="批量移除租户的菜单",
        tags=["租户菜单管理"],
        request=TenantMenusSerializer
    )
    @action(detail=False, methods=['delete'], url_path='batch')
    def batch_remove(self, request, tenant_id=None):
        """
        批量移除租户菜单
        """
        if not request.user.is_super_admin:
            return Response(
                {"detail": "只有超级管理员才能批量移除租户的菜单"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            tenant = Tenant.objects.get(id=tenant_id)
        except Tenant.DoesNotExist:
            return Response(
                {"detail": "租户不存在"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = TenantMenusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        menu_ids = serializer.validated_data['menu_ids']
        removed_count = TenantMenu.objects.filter(
            tenant_id=tenant_id,
            menu_id__in=menu_ids
        ).delete()[0]
        
        logger.info(f"批量移除租户 '{tenant.name}' 的 {removed_count} 个菜单，操作者: {request.user.username}")
        
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    list=extend_schema(
        summary="获取当前用户的菜单",
        description="获取当前登录用户能够访问的菜单列表（基于其租户和角色）",
        tags=["用户菜单"]
    ),
)
class UserMenuViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    用户菜单视图集
    """
    serializer_class = MenuTreeSerializer
    permission_classes = [IsAdmin]
    
    def get_queryset(self):
        """
        获取当前用户的菜单
        """
        user = self.request.user
        
        if user.is_super_admin:
            # 超级管理员可以访问所有激活的菜单
            return Menu.objects.filter(is_active=True, parent__isnull=True)
        
        if user.is_admin and user.tenant:
            # 租户管理员只能访问分配给其租户的激活菜单
            tenant_menu_ids = TenantMenu.objects.filter(
                tenant=user.tenant,
                is_active=True
            ).values_list('menu_id', flat=True)
            
            return Menu.objects.filter(
                id__in=tenant_menu_ids,
                is_active=True,
                parent__isnull=True
            )
        
        # 其他用户无菜单访问权限
        return Menu.objects.none()
    
    def list(self, request, *args, **kwargs):
        """
        获取当前用户的菜单
        """
        queryset = self.get_queryset()
        
        # 设置序列化上下文
        context = self.get_serializer_context()
        context['is_active'] = True
        
        serializer = self.get_serializer(queryset, many=True, context=context)
        return Response({"menus": serializer.data})
