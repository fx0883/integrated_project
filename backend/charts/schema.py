from drf_spectacular.utils import OpenApiResponse, OpenApiExample

# 租户趋势图响应模式
tenant_trend_responses = {
    200: OpenApiResponse(
        description="租户趋势数据获取成功",
        examples=[
            OpenApiExample(
                name="租户趋势示例",
                value={
                    "code": 200,
                    "message": "success",
                    "data": {
                        "chart_type": "line",
                        "title": "租户数量趋势",
                        "description": "系统内租户总数随时间的变化趋势",
                        "labels": ["2023-01", "2023-02", "2023-03"],
                        "datasets": [
                            {
                                "label": "租户总数",
                                "data": [10, 15, 22],
                                "color": "#3366cc"
                            }
                        ],
                        "summary": {
                            "total": 22,
                            "growth_rate": 15.5,
                            "average_monthly_growth": 8.2
                        }
                    }
                }
            )
        ]
    ),
    403: OpenApiResponse(description="权限不足"),
    500: OpenApiResponse(description="服务器错误")
}

# 租户状态分布响应模式
tenant_status_distribution_responses = {
    200: OpenApiResponse(
        description="租户状态分布数据获取成功",
        examples=[
            OpenApiExample(
                name="租户状态分布示例",
                value={
                    "code": 200,
                    "message": "success",
                    "data": {
                        "chart_type": "pie",
                        "title": "租户状态分布",
                        "description": "不同状态的租户占比",
                        "labels": ["活跃", "暂停", "已删除"],
                        "datasets": [
                            {
                                "label": "租户数量",
                                "data": [45, 12, 8],
                                "colors": ["#36A2EB", "#FFCE56", "#FF6384"]
                            }
                        ],
                        "summary": {
                            "total": 65,
                            "active_percentage": 69.2,
                            "suspended_percentage": 18.5,
                            "deleted_percentage": 12.3
                        }
                    }
                }
            )
        ]
    ),
    403: OpenApiResponse(description="权限不足"),
    500: OpenApiResponse(description="服务器错误")
}

# 租户创建速率响应模式
tenant_creation_rate_responses = {
    200: OpenApiResponse(
        description="租户创建速率数据获取成功",
        examples=[
            OpenApiExample(
                name="租户创建速率示例",
                value={
                    "code": 200,
                    "message": "success",
                    "data": {
                        "chart_type": "bar",
                        "title": "租户创建速率",
                        "description": "每月新增租户数量",
                        "labels": ["2023-01", "2023-02", "2023-03"],
                        "datasets": [
                            {
                                "label": "新增租户",
                                "data": [5, 8, 12],
                                "color": "#4BC0C0"
                            }
                        ],
                        "summary": {
                            "total_new": 25,
                            "avg_monthly": 8.3,
                            "max_monthly": 12,
                            "growth_trend": "上升"
                        }
                    }
                }
            )
        ]
    ),
    403: OpenApiResponse(description="权限不足"),
    500: OpenApiResponse(description="服务器错误")
} 