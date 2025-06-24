import os
import django
import sys

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User
from menus.models import Menu, UserMenu

# 检查用户
user_id = 34  # admin_cms 用户ID
user = User.objects.filter(id=user_id).first()
print(f"用户信息: ID={user.id}, 用户名={user.username}")
print(f"管理员={user.is_admin}, 超级管理员={user.is_super_admin}, 租户管理员={user.is_tenant_admin}")
print(f"租户: {user.tenant.name if user.tenant else '无'}")

# 模拟routes_views.py中的逻辑
user_menu_ids = UserMenu.objects.filter(
    user=user, 
    is_active=True
).values_list('menu_id', flat=True)

menu_ids_list = list(user_menu_ids)
print(f"\n获取到的user_menu_ids: {menu_ids_list}")
print(f"user_menu_ids数量: {len(menu_ids_list)}")

# 分步检查filter条件
print("\n分步检查filter条件:")
for condition in ['id__in=user_menu_ids', 'is_active=True', 'parent__isnull=True']:
    if condition == 'id__in=user_menu_ids':
        menus = Menu.objects.filter(id__in=user_menu_ids)
    elif condition == 'is_active=True':
        menus = Menu.objects.filter(id__in=user_menu_ids, is_active=True)
    else:  # parent__isnull=True
        menus = Menu.objects.filter(id__in=user_menu_ids, is_active=True, parent__isnull=True)
    
    print(f"条件 {condition} 匹配菜单数: {menus.count()}")
    if menus.count() > 0:
        print("匹配的菜单:")
        for menu in menus:
            print(f"- {menu.name} (ID={menu.id})")

# 检查所有顶级菜单
top_menus = Menu.objects.filter(
    id__in=user_menu_ids, 
    is_active=True, 
    parent__isnull=True
).order_by('rank')

print(f"\n最终获取到的顶级菜单数量: {top_menus.count()}")
if top_menus:
    print("顶级菜单列表:")
    for menu in top_menus:
        print(f"- {menu.name} (ID={menu.id})")
else:
    print("未找到任何顶级菜单，routes将为空数组")
    
# 查看用户所有关联菜单的父级情况
print("\n用户菜单的父级情况:")
for menu_id in menu_ids_list:
    try:
        menu = Menu.objects.get(id=menu_id)
        parent_info = f"父菜单: {menu.parent.name} (ID={menu.parent.id})" if menu.parent else "无父菜单"
        print(f"- {menu.name} (ID={menu.id}): {parent_info}")
    except Exception as e:
        print(f"- 菜单ID={menu_id}: 获取信息失败 - {str(e)}")

# 打印所有顶级菜单的ID和名称
print("\n系统中的所有顶级菜单:")
all_top_menus = Menu.objects.filter(parent__isnull=True, is_active=True)
for menu in all_top_menus:
    print(f"- {menu.name} (ID={menu.id})")

sys.stdout.flush() 