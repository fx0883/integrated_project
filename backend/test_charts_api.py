#!/usr/bin/env python
"""
测试脚本，用于验证图表API修复后的功能
"""
import os
import sys
import django
from datetime import datetime, timedelta
import json

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.utils import timezone
from django.test import RequestFactory
from rest_framework.test import force_authenticate
from users.models import User
from charts.views import TenantTrendChartView, TenantStatusDistributionView, TenantCreationRateView

def run_test():
    # 创建请求工厂和模拟用户
    factory = RequestFactory()
    user = User.objects.filter(is_super_admin=True).first()
    
    if not user:
        print("错误: 找不到超级管理员用户，无法进行测试")
        return
    
    print(f"使用超级管理员 '{user.username}' 进行测试")
    
    # 测试租户趋势图API
    print("\n=== 测试租户趋势图API ===")
    # 设置查询参数
    start_date = (timezone.now() - timedelta(days=365)).strftime('%Y-%m-%d')
    end_date = timezone.now().strftime('%Y-%m-%d')
    
    # 创建GET请求
    request = factory.get(
        '/api/charts/tenant-trend/',
        {'period': 'monthly', 'start_date': start_date, 'end_date': end_date}
    )
    force_authenticate(request, user=user)
    
    # 执行视图
    view = TenantTrendChartView.as_view()
    response = view(request)
    
    # 打印响应
    print(f"状态码: {response.status_code}")
    response_data = response.data
    
    print("响应数据:")
    print(f"  - 状态码: {response_data['code']}")
    print(f"  - 消息: {response_data['message']}")
    data = response_data['data']
    
    print("  - 图表类型:", data['chart_type'])
    print("  - 标题:", data['title'])
    print("  - 标签数量:", len(data['labels']))
    print("  - 标签:", data['labels'])
    print("  - 数据集:", [d['data'] for d in data['datasets']])
    print("  - 总租户数:", data['summary'].get('total', 0))
    
    # 测试租户状态分布API
    print("\n=== 测试租户状态分布API ===")
    request = factory.get('/api/charts/tenant-status-distribution/')
    force_authenticate(request, user=user)
    
    view = TenantStatusDistributionView.as_view()
    response = view(request)
    
    print(f"状态码: {response.status_code}")
    response_data = response.data
    
    print("响应数据:")
    print(f"  - 状态码: {response_data['code']}")
    print(f"  - 消息: {response_data['message']}")
    data = response_data['data']
    
    print("  - 图表类型:", data['chart_type'])
    print("  - 标题:", data['title'])
    print("  - 标签:", data['labels'])
    print("  - 数据集:", [d['data'] for d in data['datasets']])
    
    # 测试租户创建速率API
    print("\n=== 测试租户创建速率API ===")
    request = factory.get(
        '/api/charts/tenant-creation-rate/',
        {'period': 'monthly', 'start_date': start_date, 'end_date': end_date}
    )
    force_authenticate(request, user=user)
    
    view = TenantCreationRateView.as_view()
    response = view(request)
    
    print(f"状态码: {response.status_code}")
    response_data = response.data
    
    print("响应数据:")
    print(f"  - 状态码: {response_data['code']}")
    print(f"  - 消息: {response_data['message']}")
    data = response_data['data']
    
    print("  - 图表类型:", data['chart_type'])
    print("  - 标题:", data['title'])
    print("  - 标签数量:", len(data['labels']))
    print("  - 标签:", data['labels'])
    print("  - 数据集:", [d['data'] for d in data['datasets']])
    print("  - 总新增租户:", data['summary'].get('total_new', 0))
    
    # 测试使用更短的时间范围
    print("\n=== 测试特定时间范围 ===")
    specific_start = "2025-03-01"
    specific_end = "2025-05-30"
    
    request = factory.get(
        '/api/charts/tenant-trend/',
        {'period': 'monthly', 'start_date': specific_start, 'end_date': specific_end}
    )
    force_authenticate(request, user=user)
    
    view = TenantTrendChartView.as_view()
    response = view(request)
    
    print(f"状态码: {response.status_code}")
    response_data = response.data
    data = response_data['data']
    
    print(f"租户趋势图 ({specific_start} 至 {specific_end}):")
    print("  - 标签:", data['labels'])
    print("  - 数据集:", [d['data'] for d in data['datasets']])

if __name__ == "__main__":
    run_test() 