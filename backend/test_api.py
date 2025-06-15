import requests
import json

BASE_URL = "http://localhost:8000/api/v1"
TOKEN = None

def login():
    """登录获取认证令牌"""
    url = f"{BASE_URL}/auth/login/"
    data = {
        "username": "admin12345",
        "password": "admin12345"
    }
    response = requests.post(url, json=data)
    print(f"登录响应: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print("登录成功")
        global TOKEN
        TOKEN = result.get("data", {}).get("token")
        return TOKEN
    else:
        print(f"登录失败: {response.text}")
        return None

def get_headers():
    """获取带有认证令牌的请求头"""
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    return headers

def test_create_menu():
    """测试创建菜单"""
    url = f"{BASE_URL}/menus/"
    data = {
        "name": "dashboard",
        "code": "dashboard",
        "path": "/dashboard",
        "component": "Layout",
        "title": "仪表盘",
        "icon": "dashboard",
        "rank": 1,
        "show_link": True
    }
    response = requests.post(url, json=data, headers=get_headers())
    print(f"创建菜单响应: {response.status_code}")
    if response.status_code == 201:
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    else:
        print(f"错误: {response.text}")
    return response.json() if response.status_code == 201 else None

def test_get_menu_list():
    """测试获取菜单列表"""
    url = f"{BASE_URL}/menus/"
    response = requests.get(url, headers=get_headers())
    print(f"获取菜单列表响应: {response.status_code}")
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    else:
        print(f"错误: {response.text}")

def test_get_menu_detail(menu_id):
    """测试获取单个菜单"""
    url = f"{BASE_URL}/menus/{menu_id}/"
    response = requests.get(url, headers=get_headers())
    print(f"获取菜单详情响应: {response.status_code}")
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    else:
        print(f"错误: {response.text}")

def test_update_menu(menu_id):
    """测试更新菜单"""
    url = f"{BASE_URL}/menus/{menu_id}/"
    data = {
        "name": "dashboard",
        "code": "dashboard",
        "path": "/dashboard",
        "component": "Layout",
        "title": "更新后的仪表盘",
        "icon": "dashboard-updated",
        "rank": 2,
        "show_link": True,
        "transition_name": "fade",
        "enter_transition": "animate__fadeInLeft",
        "leave_transition": "animate__fadeOutRight"
    }
    response = requests.put(url, json=data, headers=get_headers())
    print(f"更新菜单响应: {response.status_code}")
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    else:
        print(f"错误: {response.text}")

def test_get_menu_tree():
    """测试获取菜单树形结构"""
    url = f"{BASE_URL}/menus/tree/"
    response = requests.get(url, headers=get_headers())
    print(f"获取菜单树形结构响应: {response.status_code}")
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    else:
        print(f"错误: {response.text}")

def test_delete_menu(menu_id):
    """测试删除菜单"""
    url = f"{BASE_URL}/menus/{menu_id}/"
    response = requests.delete(url, headers=get_headers())
    print(f"删除菜单响应: {response.status_code}")
    if response.status_code == 204:
        print("菜单删除成功")
    else:
        print(f"错误: {response.text}")

def test_admin_routes():
    """测试获取管理员菜单路由"""
    url = f"{BASE_URL}/menus/admin/routes/"
    response = requests.get(url, headers=get_headers())
    print(f"获取管理员菜单路由响应: {response.status_code}")
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    else:
        print(f"错误: {response.text}")

if __name__ == "__main__":
    # 登录
    print("\n===== 登录 =====")
    if not login():
        print("登录失败，无法继续测试")
        exit(1)
    
    # 测试创建菜单
    print("\n===== 测试创建菜单 =====")
    menu = test_create_menu()
    
    if menu:
        menu_id = menu["id"]
        
        # 测试获取菜单列表
        print("\n===== 测试获取菜单列表 =====")
        test_get_menu_list()
        
        # 测试获取单个菜单
        print("\n===== 测试获取单个菜单 =====")
        test_get_menu_detail(menu_id)
        
        # 测试更新菜单
        print("\n===== 测试更新菜单 =====")
        test_update_menu(menu_id)
        
        # 测试获取菜单树形结构
        print("\n===== 测试获取菜单树形结构 =====")
        test_get_menu_tree()
        
        # 测试获取管理员菜单路由
        print("\n===== 测试获取管理员菜单路由 =====")
        test_admin_routes()
        
        # 测试删除菜单
        print("\n===== 测试删除菜单 =====")
        test_delete_menu(menu_id)
    else:
        print("创建菜单失败，无法继续测试") 