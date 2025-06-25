#!/usr/bin/env python
"""
通过API添加CMS菜单的脚本
使用前需要设置API_URL和TOKEN
"""
import json
import requests
import logging
import sys

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)

logger = logging.getLogger(__name__)

# API配置
API_URL = "http://localhost:8000/api/v1/menus/"  # 修改为实际的API URL
TOKEN = "your_jwt_token_here"  # 修改为实际的JWT令牌

# CMS菜单JSON数据
CMS_MENU_DATA = {
    "path": "/cms",
    "name": "CMS",
    "redirect": "/cms/article",
    "meta": {
        "title": "menus.cmsManagement",
        "icon": "ri:article-line",
        "showLink": True,
        "rank": 5
    },
    "children": [
        {
            "path": "/cms/article",
            "name": "ArticleManagement",
            "component": "cms/article/index",
            "meta": {
                "title": "menus.articleManagement",
                "icon": "ri:file-list-line",
                "showLink": True,
                "keepAlive": True
            }
        },
        {
            "path": "/cms/article/create",
            "name": "ArticleCreate",
            "component": "cms/article/create",
            "meta": {
                "title": "menus.articleCreate",
                "showLink": False,
                "keepAlive": False,
                "activePath": "/cms/article"
            }
        },
        {
            "path": "/cms/article/edit/:id",
            "name": "ArticleEdit",
            "component": "cms/article/edit",
            "meta": {
                "title": "menus.articleEdit",
                "showLink": False,
                "keepAlive": False,
                "activePath": "/cms/article"
            }
        },
        {
            "path": "/cms/article/detail/:id",
            "name": "ArticleDetail",
            "component": "cms/article/detail",
            "meta": {
                "title": "menus.articleDetail",
                "showLink": False,
                "keepAlive": False,
                "activePath": "/cms/article"
            }
        },
        {
            "path": "/cms/comment",
            "name": "CommentManagement",
            "component": "cms/comment/index",
            "meta": {
                "title": "menus.commentManagement",
                "icon": "ri:chat-1-line",
                "showLink": True,
                "keepAlive": True
            }
        },
        {
            "path": "/cms/comment/detail/:id",
            "name": "CommentDetail",
            "component": "cms/comment/detail",
            "meta": {
                "title": "menus.commentDetail",
                "showLink": False,
                "keepAlive": False,
                "activePath": "/cms/comment"
            }
        },
        {
            "path": "/cms/category",
            "name": "CategoryManagement",
            "component": "cms/category/index",
            "meta": {
                "title": "menus.categoryManagement",
                "icon": "ri:folder-2-line",
                "showLink": True,
                "keepAlive": True
            }
        },
        {
            "path": "/cms/tag",
            "name": "TagManagement",
            "component": "cms/tag/index",
            "meta": {
                "title": "menus.tagManagement",
                "icon": "ri:price-tag-3-line",
                "showLink": True,
                "keepAlive": True
            }
        }
    ]
}

def convert_frontend_to_backend_format(menu_data, parent_id=None):
    """
    将前端菜单格式转换为后端API格式
    """
    meta = menu_data.get('meta', {})
    
    backend_menu = {
        "name": menu_data.get('name'),
        "code": menu_data.get('name', '').lower(),
        "path": menu_data.get('path'),
        "component": menu_data.get('component'),
        "redirect": menu_data.get('redirect'),
        "title": meta.get('title', ''),
        "icon": meta.get('icon', ''),
        "rank": meta.get('rank', 0),
        "show_link": meta.get('showLink', True),
        "show_parent": meta.get('showParent', True),
        "keep_alive": meta.get('keepAlive', False),
        "active_path": meta.get('activePath'),
        "parent_id": parent_id,
        "is_active": True,
        "remarks": "通过API添加的CMS菜单"
    }
    
    return backend_menu

def create_menu(menu_data, headers):
    """
    创建菜单并返回创建的菜单ID
    """
    try:
        response = requests.post(API_URL, json=menu_data, headers=headers)
        response.raise_for_status()
        created_menu = response.json()
        logger.info(f"创建菜单成功: {created_menu.get('name')} (ID: {created_menu.get('id')})")
        return created_menu.get('id')
    except requests.exceptions.RequestException as e:
        logger.error(f"创建菜单失败: {str(e)}")
        if hasattr(e, 'response') and e.response:
            logger.error(f"响应内容: {e.response.text}")
        return None

def process_menu_tree(menu_data, headers, parent_id=None):
    """
    递归处理菜单树
    """
    # 转换为后端格式
    backend_menu = convert_frontend_to_backend_format(menu_data, parent_id)
    
    # 创建菜单
    menu_id = create_menu(backend_menu, headers)
    if not menu_id:
        logger.error(f"无法创建菜单 {backend_menu.get('name')}，跳过子菜单")
        return
    
    # 处理子菜单
    children = menu_data.get('children', [])
    for child in children:
        process_menu_tree(child, headers, menu_id)

def main():
    """
    主函数
    """
    if TOKEN == "your_jwt_token_here":
        logger.error("请先设置有效的JWT令牌")
        sys.exit(1)
    
    # 设置请求头
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    
    logger.info("开始添加CMS菜单...")
    process_menu_tree(CMS_MENU_DATA, headers)
    logger.info("CMS菜单添加完成")

if __name__ == "__main__":
    main() 