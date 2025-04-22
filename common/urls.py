"""
Common应用的URL配置
"""
from django.urls import path
from common import views

app_name = 'common'

urlpatterns = [
    # API日志列表
    path('api-logs/', views.APILogListView.as_view(), name='api-log-list'),
    
    # API日志详情
    path('api-logs/<int:pk>/', views.APILogDetailView.as_view(), name='api-log-detail'),
] 