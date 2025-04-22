#!/usr/bin/env python
"""
检查Django admin站点注册的模型
"""
import os
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# 导入admin站点
from django.contrib import admin

# 获取所有注册的模型
models = admin.site._registry

print("已注册到Admin的模型:")
for model, admin_class in models.items():
    print(f"- {model._meta.app_label}.{model._meta.model_name}: {admin_class.__class__.__name__}") 