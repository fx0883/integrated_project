import requests
import json

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
    except Exception as e:
        print(f'Error parsing JSON: {e}')
        print(response.text)

if __name__ == '__main__':
    test_tag_groups_api() 