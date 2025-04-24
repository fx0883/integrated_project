"""
Common应用的URL配置
"""
from django.urls import path
from common import views
from common.views import (
    test_standard_response,
    test_error_response,
    test_auth_error_response,
    test_pagination_response
)

app_name = 'common'

urlpatterns = [
    # API日志列表
    path('api-logs/', views.APILogListView.as_view(), name='api-log-list'),
    
    # API日志详情
    path('api-logs/<int:pk>/', views.APILogDetailView.as_view(), name='api-log-detail'),
    
    # 测试标准响应格式
    path('test-format/', test_standard_response, name='test-standard-response'),
    
    # 测试错误响应格式
    path('test-error/', test_error_response, name='test-error-response'),
    
    # 测试认证失败响应格式
    path('test-auth-error/', test_auth_error_response, name='test-auth-error-response'),
    
    # 测试分页响应格式
    path('test-pagination/', test_pagination_response, name='test-pagination-response'),
] 