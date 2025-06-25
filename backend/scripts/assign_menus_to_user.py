#!/usr/bin/env python
"""
将CMS菜单分配给指定用户的脚本
"""
import os
import sys
import django
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)

logger = logging.getLogger(__name__)

# 设置Django环境
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from menus.models import Menu, UserMenu
from users.models import User
from django.db import transaction

def assign_menus_to_user(user_id):
    """
    将所有CMS菜单分配给指定用户
    """
    try:
        # 1. 检查用户是否存在
        try:
            user = User.objects.get(id=user_id)
            logger.info(f"找到用户: ID={user_id}, 用户名={user.username}")
        except User.DoesNotExist:
            logger.error(f"用户ID {user_id} 不存在!")
            return False
        
        # 2. 获取所有CMS菜单
        try:
            cms_menu = Menu.objects.get(name='CMS')
            # 获取CMS菜单及其所有子菜单
            cms_menus = [cms_menu]
            
            # 递归获取所有子菜单
            def get_child_menus(parent_menu):
                children = Menu.objects.filter(parent=parent_menu)
                result = []
                for child in children:
                    result.append(child)
                    result.extend(get_child_menus(child))
                return result
            
            cms_menus.extend(get_child_menus(cms_menu))
            
            logger.info(f"找到 {len(cms_menus)} 个CMS相关菜单")
        except Menu.DoesNotExist:
            logger.error("CMS菜单不存在!")
            return False
        
        # 3. 将菜单分配给用户
        with transaction.atomic():
            assigned_count = 0
            for menu in cms_menus:
                # 检查是否已存在关联
                user_menu, created = UserMenu.objects.get_or_create(
                    user=user,
                    menu=menu,
                    defaults={'is_active': True}
                )
                
                if not created and not user_menu.is_active:
                    # 如果关联已存在但未激活，则激活它
                    user_menu.is_active = True
                    user_menu.save()
                    logger.info(f"激活已存在的菜单关联: 用户={user_id}, 菜单={menu.name}")
                    assigned_count += 1
                elif created:
                    logger.info(f"创建新菜单关联: 用户={user_id}, 菜单={menu.name}")
                    assigned_count += 1
                else:
                    logger.info(f"菜单关联已存在且已激活: 用户={user_id}, 菜单={menu.name}")
            
            logger.info(f"成功为用户 {user_id} 分配/更新了 {assigned_count} 个菜单关联")
        
        return True
    except Exception as e:
        logger.error(f"分配菜单时出错: {str(e)}")
        return False

def verify_menu_assignments(user_id):
    """
    验证菜单分配是否成功
    """
    try:
        user = User.objects.get(id=user_id)
        user_menus = UserMenu.objects.filter(user=user, is_active=True)
        
        print("\n用户菜单分配情况:")
        print(f"用户ID: {user_id}")
        print(f"用户名: {user.username}")
        print(f"激活的菜单关联数量: {user_menus.count()}")
        
        print("\n已分配的菜单:")
        for user_menu in user_menus:
            menu = user_menu.menu
            parent_name = menu.parent.name if menu.parent else "无"
            print(f"ID: {menu.id}, 名称: {menu.name}, 父菜单: {parent_name}")
        
        return user_menus.count()
    except User.DoesNotExist:
        logger.error(f"用户ID {user_id} 不存在!")
        return 0
    except Exception as e:
        logger.error(f"验证菜单分配时出错: {str(e)}")
        return 0

def main():
    """
    主函数
    """
    # 设置要分配菜单的用户ID
    user_id = 34
    
    logger.info(f"开始为用户ID {user_id} 分配CMS菜单...")
    
    # 分配菜单
    success = assign_menus_to_user(user_id)
    
    if success:
        # 验证分配结果
        assigned_count = verify_menu_assignments(user_id)
        if assigned_count > 0:
            logger.info(f"验证成功: 用户ID {user_id} 已分配 {assigned_count} 个菜单")
        else:
            logger.warning(f"验证失败: 用户ID {user_id} 没有分配任何菜单")
    else:
        logger.error(f"菜单分配失败!")

if __name__ == "__main__":
    main() 