import requests

# 测试获取菜单列表API
try:
    response = requests.get("http://localhost:8080/api/v1/menus/")
    print("Status Code:", response.status_code)
    print("Response Headers:")
    for key, value in response.headers.items():
        print(f"  {key}: {value}")
    print("\nResponse Body:")
    print(response.text[:500])  # 只显示前500个字符
except Exception as e:
    print(f"请求失败: {str(e)}") 