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

def test_article_view_api():
    url = 'http://localhost:8000/api/v1/cms/articles/14/view/'
    headers = {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozNCwidXNlcm5hbWUiOiJhZG1pbl9jbXMiLCJleHAiOjE3NTA2MDEyODgsIm1vZGVsX3R5cGUiOiJ1c2VyIiwiaXNfYWRtaW4iOnRydWUsImlzX3N1cGVyX2FkbWluIjpmYWxzZX0.bShYgGJR1ILcWpoMG98WFxKvJF96imGIFOzyotkIeqc',
        'Content-Type': 'application/json'
    }
    data = {
        'session_id': 'test_session',
        'reading_time': 10,
        'referrer': 'test_referrer'
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        print(f'Status code: {response.status_code}')
        print(f'Response: {response.text}')
    except Exception as e:
        print(f'Error: {e}')

def test_tag_groups_api():
    url = 'http://localhost:8000/api/v1/cms/tag-groups/'
    headers = {
        'accept': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozNCwidXNlcm5hbWUiOiJhZG1pbl9jbXMiLCJleHAiOjE3NTA2MDEyODgsIm1vZGVsX3R5cGUiOiJ1c2VyIiwiaXNfYWRtaW4iOnRydWUsImlzX3N1cGVyX2FkbWluIjpmYWxzZX0.bShYgGJR1ILcWpoMG98WFxKvJF96imGIFOzyotkIeqc'
    }
    
    response = requests.get(url, headers=headers)
    
    print(f'Status Code: {response.status_code}')
    try:
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    except:
        print(response.text)

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

    # 测试文章查看API
    print("\n===== 测试文章查看API =====")
    test_article_view_api()

    # 测试标签组API
    print("\n===== 测试标签组API =====")
    test_tag_groups_api()

# 测试获取菜单列表API
try:
    response = requests.get("http://localhost:8080/api/menus/")
    print("Status Code:", response.status_code)
    print("Response Headers:")
    for key, value in response.headers.items():
        print(f"  {key}: {value}")
    print("\nResponse Body:")
    print(response.text[:500])  # 只显示前500个字符
except Exception as e:
    print(f"请求失败: {str(e)}") 