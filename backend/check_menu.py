import os
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User
from menus.models import Menu, UserMenu

# 检查用户
user_id = 34
user = User.objects.filter(id=user_id).first()
print(f"用户信息: ID={user.id}, 用户名={user.username}, 管理员={user.is_admin}, 超级管理员={user.is_super_admin}")
print(f"租户管理员: {user.is_tenant_admin}, 租户: {user.tenant.name if user.tenant else '无'}")

# 检查CMS菜单
cms_menu = Menu.objects.filter(id=4).first()
print(f"\nCMS菜单: ID={cms_menu.id}, 名称={cms_menu.name}, 标题={cms_menu.title}, 激活状态={cms_menu.is_active}")

# 检查关联
user_menu = UserMenu.objects.filter(user_id=user_id, menu_id=4).first()
print(f"用户与CMS主菜单关联: {'存在' if user_menu else '不存在'}")
if user_menu:
    print(f"关联状态: 激活={user_menu.is_active}")

# 检查子菜单关联
sub_menus = Menu.objects.filter(parent_id=4, is_active=True)
print(f"\nCMS子菜单数量: {sub_menus.count()}")
for sub_menu in sub_menus:
    user_sub_menu = UserMenu.objects.filter(user_id=user_id, menu_id=sub_menu.id).first()
    status = f"{'已关联' if user_sub_menu else '未关联'}"
    if user_sub_menu:
        status += f", 激活状态={user_sub_menu.is_active}"
    print(f"- {sub_menu.name} (ID={sub_menu.id}): {status}")

# 检查所有用户菜单
print("\n用户所有菜单关联:")
user_menus = UserMenu.objects.filter(user_id=user_id, is_active=True)
print(f"总数: {user_menus.count()}")
for um in user_menus:
    print(f"- {um.menu.name} (ID={um.menu.id})")

# 检查所有顶级菜单
print("\n所有顶级菜单:")
top_menus = Menu.objects.filter(parent__isnull=True, is_active=True)
for menu in top_menus:
    user_top_menu = UserMenu.objects.filter(user_id=user_id, menu_id=menu.id).first()
    status = f"{'已关联' if user_top_menu else '未关联'}"
    if user_top_menu:
        status += f", 激活状态={user_top_menu.is_active}"
    print(f"- {menu.name} (ID={menu.id}): {status}") 