"""
菜单路由视图
"""
import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from common.models import Config
from ..models import Menu, UserMenu
from ..serializers import RoutesResponseSerializer

logger = logging.getLogger(__name__)


class AdminRoutesView(APIView):
    """
    管理员菜单路由API
    提供前端路由配置，支持超级管理员和租户管理员
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={200: RoutesResponseSerializer()},
        description="获取管理员菜单路由",
        summary="获取管理员菜单路由",
        tags=["系统", "菜单"]
    )
    def get(self, request):
        """
        获取管理员菜单路由
        根据用户角色返回相应的菜单路由配置
        """
        user = request.user
        
        # 判断用户是否为超级管理员
        if user.is_super_admin:
            try:
                # 从配置中获取超级管理员菜单
                config = Config.objects.get(key='super_admin_menu', is_active=True)
                routes = config.value
                
                return Response({
                    'success': True,
                    'code': 2000,
                    'message': '获取路由成功',
                    'data': routes
                })
            except Config.DoesNotExist:
                # 配置不存在，返回空菜单
                logger.error("超级管理员菜单配置不存在")
                return Response({
                    'success': False,
                    'code': 4004,
                    'message': '菜单配置不存在',
                    'data': []
                }, status=status.HTTP_404_NOT_FOUND)
        else:
            # 处理租户管理员菜单
            if user.tenant and user.is_tenant_admin:
                try:
                    # 从用户菜单中获取配置
                    user_menu_ids = UserMenu.objects.filter(
                        user=user, 
                        is_active=True
                    ).values_list('menu_id', flat=True)
                    
                    if user_menu_ids:
                        # 获取菜单项并构建路由
                        menus = Menu.objects.filter(id__in=user_menu_ids, is_active=True)
                        # 这里可以进一步处理菜单数据，构建前端需要的路由格式
                        # 暂时返回空数组，后续可以根据实际需求完善
                        return Response({
                            'success': True,
                            'code': 2000,
                            'message': '获取路由成功',
                            'data': []  # 这里应该是根据菜单构建的路由数据
                        })
                    else:
                        logger.warning(f"用户 {user.username} 没有分配菜单")
                except Exception as e:
                    logger.error(f"获取用户菜单失败: {str(e)}")
            
            # 如果不是租户管理员或处理失败，返回空数组
            return Response({
                'success': True,
                'code': 2000,
                'message': '获取路由成功',
                'data': []
            }) 