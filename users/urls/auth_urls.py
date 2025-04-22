"""
认证相关的URL路由
"""
from django.urls import path
from users.views import auth_views

app_name = 'auth'

urlpatterns = [
    # 登录
    path('login/', auth_views.LoginView.as_view(), name='login'),
    
    # 刷新token
    path('refresh/', auth_views.TokenRefreshView.as_view(), name='token-refresh'),
    
    # 验证token
    path('verify/', auth_views.TokenVerifyView.as_view(), name='token-verify'),
] 