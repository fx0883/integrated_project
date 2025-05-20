"""
手动导入所有应用的admin模块，确保模型被注册到admin站点
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

# 自定义Admin站点标题和header
admin.site.site_header = _('多租户用户管理系统')
admin.site.site_title = _('多租户用户管理系统')
admin.site.index_title = _('站点管理')

# 输出已注册的模型
print("=== 导入模型前admin._registry中的模型 ===")
for model, model_admin in admin.site._registry.items():
    print(f"{model._meta.app_label}.{model._meta.model_name}: {model_admin.__class__.__name__}")

# 导入模型
print("=== 尝试直接导入并注册模型 ===")
try:
    # 导入users模型
    from users.models import User
    
    # 导入tenants模型
    from tenants.models import Tenant, TenantQuota
    
    # 导入common模型
    from common.models import APILog
    
    # 如果模型不在admin._registry中，重新注册
    from django.contrib.auth.admin import UserAdmin
    if User not in admin.site._registry:
        print("手动注册User模型到admin")
        admin.site.register(User, UserAdmin)
    
    if Tenant not in admin.site._registry:
        print("手动注册Tenant模型到admin")
        admin.site.register(Tenant)
    
    if TenantQuota not in admin.site._registry:
        print("手动注册TenantQuota模型到admin")
        admin.site.register(TenantQuota)
    
    # 输出注册后的模型
    print("=== 导入并注册后admin._registry中的模型 ===")
    for model, model_admin in admin.site._registry.items():
        print(f"{model._meta.app_label}.{model._meta.model_name}: {model_admin.__class__.__name__}")
        
except Exception as e:
    print(f"注册模型时出错: {e}") 