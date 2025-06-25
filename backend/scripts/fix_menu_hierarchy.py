#!/usr/bin/env python
"""
修复菜单层级结构的脚本
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

from menus.models import Menu
from django.db import transaction

def fix_menu_hierarchy():
    """
    修复菜单层级结构
    """
    try:
        with transaction.atomic():
            # 1. 获取主菜单
            try:
                cms_menu = Menu.objects.get(name='CMS')
                logger.info(f"找到CMS主菜单: ID={cms_menu.id}")
            except Menu.DoesNotExist:
                logger.error("CMS主菜单不存在!")
                return
            
            # 2. 设置所有菜单的父子关系
            
            # 确保以下菜单是CMS的直接子菜单
            level1_menus = {
                'ArticleManagement': None,
                'CommentManagement': None,
                'CategoryManagement': None,
                'TagManagement': None
            }
            
            # 查找所有一级菜单
            for name in level1_menus.keys():
                try:
                    menu = Menu.objects.get(name=name)
                    menu.parent = cms_menu
                    menu.save()
                    level1_menus[name] = menu
                    logger.info(f"设置 {name} 为CMS的子菜单")
                except Menu.DoesNotExist:
                    logger.warning(f"菜单 {name} 不存在")
            
            # 设置二级菜单关系
            article_management = level1_menus.get('ArticleManagement')
            if article_management:
                # 文章管理的子菜单
                for name in ['ArticleCreate', 'ArticleEdit', 'ArticleDetail']:
                    try:
                        menu = Menu.objects.get(name=name)
                        menu.parent = article_management
                        menu.save()
                        logger.info(f"设置 {name} 为ArticleManagement的子菜单")
                    except Menu.DoesNotExist:
                        logger.warning(f"菜单 {name} 不存在")
            
            # 评论管理的子菜单
            comment_management = level1_menus.get('CommentManagement')
            if comment_management:
                try:
                    menu = Menu.objects.get(name='CommentDetail')
                    menu.parent = comment_management
                    menu.save()
                    logger.info(f"设置 CommentDetail 为CommentManagement的子菜单")
                except Menu.DoesNotExist:
                    logger.warning("菜单 CommentDetail 不存在")
            
            logger.info("菜单层级结构修复完成")
            
    except Exception as e:
        logger.error(f"修复菜单层级结构时出错: {str(e)}")
        raise

def show_menu_tree():
    """
    显示菜单树结构
    """
    print("\n修复后的菜单结构:")
    print("=" * 60)
    
    try:
        cms_menu = Menu.objects.get(name='CMS')
        print(f"● {cms_menu.name} (ID: {cms_menu.id}, 路径: {cms_menu.path})")
        
        # 显示一级菜单
        for level1 in Menu.objects.filter(parent=cms_menu).order_by('id'):
            print(f"  ├── {level1.name} (ID: {level1.id}, 路径: {level1.path})")
            
            # 显示二级菜单
            for level2 in Menu.objects.filter(parent=level1).order_by('id'):
                print(f"  │   └── {level2.name} (ID: {level2.id}, 路径: {level2.path})")
    
    except Menu.DoesNotExist:
        print("CMS菜单不存在")

def main():
    """
    主函数
    """
    logger.info("开始修复菜单层级结构...")
    fix_menu_hierarchy()
    
    # 验证修复结果
    show_menu_tree()

if __name__ == "__main__":
    main() 