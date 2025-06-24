import os
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User
from menus.models import Menu, UserMenu

def add_parent_menu_relation(user_id, menu_id):
    """
    为用户添加指定菜单的关联
    """
    # 检查关联是否已存在
    relation = UserMenu.objects.filter(user_id=user_id, menu_id=menu_id).first()
    if relation:
        if not relation.is_active:
            relation.is_active = True
            relation.save()
            print(f"已激活用户ID={user_id}与菜单ID={menu_id}的关联")
        else:
            print(f"用户ID={user_id}与菜单ID={menu_id}的关联已存在且处于激活状态")
        return relation
    
    # 创建新关联
    user = User.objects.get(id=user_id)
    menu = Menu.objects.get(id=menu_id)
    relation = UserMenu.objects.create(
        user=user,
        menu=menu,
        is_active=True
    )
    print(f"已创建用户 {user.username} 与菜单 {menu.name} 的关联")
    return relation

def fix_cms_menu_relation():
    """
    修复CMS管理员菜单关联问题
    """
    user_id = 34  # admin_cms 用户ID
    cms_menu_id = 4  # CMS管理菜单ID
    
    # 检查用户与CMS菜单的关联
    user = User.objects.get(id=user_id)
    menu = Menu.objects.get(id=cms_menu_id)
    
    print(f"准备修复用户 {user.username} 的菜单关联...")
    
    # 添加顶级菜单关联
    add_parent_menu_relation(user_id, cms_menu_id)
    
    # 检查子菜单关联情况
    submenus = Menu.objects.filter(parent_id=cms_menu_id, is_active=True)
    print(f"\n检查 {menu.name} 的 {submenus.count()} 个子菜单:")
    
    for submenu in submenus:
        relation = UserMenu.objects.filter(user_id=user_id, menu_id=submenu.id).first()
        if relation and relation.is_active:
            print(f"- {submenu.name} (ID={submenu.id}): 已关联")
        else:
            print(f"- {submenu.name} (ID={submenu.id}): 未关联，准备添加关联...")
            add_parent_menu_relation(user_id, submenu.id)
    
    print("\n修复完成，现在应该可以正常获取路由数据")

if __name__ == "__main__":
    fix_cms_menu_relation() 