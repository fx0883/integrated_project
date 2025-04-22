"""
用户相关的URL路由
"""
from django.urls import path
from users.views import user_views

app_name = 'users'

urlpatterns = [
    # 当前用户信息
    path('me/', user_views.CurrentUserView.as_view(), name='current-user'),
    
    # 用户列表和创建
    path('', user_views.UserListCreateView.as_view(), name='user-list-create'),
    
    # 用户详情、更新和删除
    path('<int:pk>/', user_views.UserRetrieveUpdateDeleteView.as_view(), name='user-detail'),
    
    # 修改密码
    path('change-password/', user_views.ChangePasswordView.as_view(), name='change-password'),
    
    # 超级管理员相关
    path('super-admin/create/', user_views.SuperAdminCreateView.as_view(), name='create-super-admin'),
    path('<int:pk>/grant-super-admin/', user_views.GrantSuperAdminView.as_view(), name='grant-super-admin'),
    path('<int:pk>/revoke-super-admin/', user_views.RevokeSuperAdminView.as_view(), name='revoke-super-admin'),
    
    # 用户角色管理
    path('<int:pk>/change-role/', user_views.UserRoleUpdateView.as_view(), name='change-user-role'),
    
    # 租户用户管理
    path('tenant/<int:tenant_id>/', user_views.TenantUserListView.as_view(), name='tenant-user-list'),
] 