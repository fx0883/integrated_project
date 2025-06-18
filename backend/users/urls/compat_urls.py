"""
兼容性URL配置，用于保持与旧版API的向后兼容性
"""
from django.urls import path, include
from users.views import user_views

app_name = 'users'

urlpatterns = [
    # 原始用户管理API，现在指向管理员用户API
    path('', user_views.UserListCreateView.as_view(), name='user-list-create'),
    path('<int:pk>/', user_views.UserRetrieveUpdateDeleteView.as_view(), name='user-detail'),
    path('current/', user_views.CurrentUserView.as_view(), name='current-user'),
    path('password/change/', user_views.ChangePasswordView.as_view(), name='change-password'),
    path('role/<int:pk>/update/', user_views.UserRoleUpdateView.as_view(), name='user-role-update'),
    
    # 超级管理员相关
    path('super-admin/create/', user_views.SuperAdminCreateView.as_view(), name='super-admin-create'),
    path('<int:pk>/grant-super-admin/', user_views.GrantSuperAdminView.as_view(), name='grant-super-admin'),
    path('<int:pk>/revoke-super-admin/', user_views.RevokeSuperAdminView.as_view(), name='revoke-super-admin'),
    
    # 子账号相关
    path('sub-account/create/', user_views.SubAccountCreateView.as_view(), name='sub-account-create'),
    
    # 头像上传
    path('avatar/upload/', user_views.UserAvatarUploadView.as_view(), name='user-avatar-upload'),
    path('<int:pk>/avatar/upload/', user_views.UserSpecificAvatarUploadView.as_view(), name='user-specific-avatar-upload'),
] 