"""
菜单视图
"""
import logging
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter

from common.permissions import IsAdmin, IsSuperAdmin
from menus.models import Menu, UserMenu
from menus.serializers import MenuSerializer, MenuTreeSerializer

logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(
        summary="获取菜单列表",
        description="获取系统中的所有菜单项，超级管理员可获取所有菜单，管理员只能获取分配给自己的菜单",
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
        description="创建新的菜单项，仅限超级管理员",
        tags=["菜单管理"]
    ),
    update=extend_schema(
        summary="更新菜单",
        description="更新指定ID的菜单，仅限超级管理员",
        tags=["菜单管理"]
    ),
    partial_update=extend_schema(
        summary="部分更新菜单",
        description="部分更新指定ID的菜单，仅限超级管理员",
        tags=["菜单管理"]
    ),
    destroy=extend_schema(
        summary="删除菜单",
        description="删除指定ID的菜单（同时会删除其所有子菜单），仅限超级管理员",
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
        if not user.is_super_admin:
            # 普通管理员只能看到分配给自己的菜单
            user_menu_ids = UserMenu.objects.filter(
                user=user
            ).values_list('menu_id', flat=True)
            queryset = queryset.filter(id__in=user_menu_ids)
        
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
        ],
        responses={200: MenuTreeSerializer(many=True)}
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