"""
用户相关URL路由包
"""
from django.urls import path, include

app_name = 'users'

urlpatterns = [
    # 认证相关URL
    path('auth/', include('users.urls.auth_urls', namespace='auth')),
    
    # 用户相关URL
    path('users/', include('users.urls.user_urls', namespace='users')),
] 