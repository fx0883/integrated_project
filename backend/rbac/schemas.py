"""
RBAC系统OpenAPI文档配置
"""
from drf_spectacular.extensions import OpenApiSerializerExtension, OpenApiAuthenticationExtension
from drf_spectacular.openapi import AutoSchema
from drf_spectacular.plumbing import build_array_type

class RBACSchema(AutoSchema):
    """
    RBAC API模式定制
    """
    
    def get_tags(self):
        """为RBAC接口添加标签"""
        # 默认所有RBAC接口都带有RBAC标签
        return ["RBAC系统"]
        
    def get_summary_and_description(self):
        """增强摘要和描述"""
        summary, description = super().get_summary_and_description()
        
        # 若无自定义描述，则根据请求方法生成标准描述
        if not description:
            if self.method == "GET" and self.path.endswith('/'):
                description = f"获取{self._get_resource_name()}列表，支持分页、过滤和搜索"
            elif self.method == "GET":
                description = f"获取指定{self._get_resource_name()}的详细信息"
            elif self.method == "POST":
                description = f"创建新的{self._get_resource_name()}"
            elif self.method == "PUT":
                description = f"更新指定{self._get_resource_name()}的全部信息"
            elif self.method == "PATCH":
                description = f"部分更新指定{self._get_resource_name()}"
            elif self.method == "DELETE":
                description = f"删除指定{self._get_resource_name()}"
                
        return summary, description
    
    def _get_resource_name(self):
        """根据URL获取资源名称"""
        path_parts = self.path.strip('/').split('/')
        if not path_parts:
            return "资源"
            
        resource_mapping = {
            'permissions': '权限',
            'roles': '角色',
            'user-roles': '用户角色',
            'cache': '缓存',
            'tenants': '租户'
        }
        
        for part in path_parts:
            if part in resource_mapping:
                return resource_mapping[part]
        
        return "资源"


def apply_openapi_schema():
    """应用OpenAPI模式定制"""
    # 这个函数会在应用初始化时调用
    pass 