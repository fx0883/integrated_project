import requests

def check_api_docs():
    """检查 API 文档"""
    url = "http://localhost:8000/api/v1/docs/"
    try:
        response = requests.get(url)
        print(f"API 文档响应状态码: {response.status_code}")
        if response.status_code == 200:
            print("API 文档可访问")
        else:
            print(f"错误: {response.text}")
    except Exception as e:
        print(f"请求异常: {str(e)}")

def check_login_api():
    """检查登录 API"""
    url = "http://localhost:8000/api/v1/auth/login/"
    data = {
        "username": "admin12345",
        "password": "admin12345"
    }
    try:
        response = requests.post(url, json=data)
        print(f"登录 API 响应状态码: {response.status_code}")
        if response.status_code == 200:
            print("登录成功")
            print(response.json())
        else:
            print(f"错误: {response.text}")
    except Exception as e:
        print(f"请求异常: {str(e)}")

if __name__ == "__main__":
    print("\n===== 检查 API 文档 =====")
    check_api_docs()
    
    print("\n===== 检查登录 API =====")
    check_login_api() 