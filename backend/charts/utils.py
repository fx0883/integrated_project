from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth, TruncQuarter, TruncYear
from django.core.cache import cache

def get_date_trunc_func(period):
    """
    根据周期返回对应的时间截断函数
    
    Args:
        period: 时间周期 (daily/weekly/monthly/quarterly/yearly)
        
    Returns:
        对应的Django时间截断函数
    """
    trunc_funcs = {
        'daily': TruncDay,
        'weekly': TruncWeek,
        'monthly': TruncMonth,
        'quarterly': TruncQuarter,
        'yearly': TruncYear
    }
    return trunc_funcs.get(period, TruncMonth)

def generate_date_range(start_date, end_date, period='monthly'):
    """
    生成指定时间段的日期范围
    
    Args:
        start_date: 开始日期
        end_date: 结束日期
        period: 时间周期
        
    Returns:
        日期范围列表
    """
    if period == 'daily':
        delta = timedelta(days=1)
        date_format = '%Y-%m-%d'
    elif period == 'weekly':
        delta = timedelta(weeks=1)
        date_format = '%Y-%m-%d'
    elif period == 'monthly':
        # 按月生成日期
        result = []
        current = start_date.replace(day=1)
        while current <= end_date:
            result.append(current.strftime('%Y-%m'))
            # 移动到下一个月
            if current.month == 12:
                current = current.replace(year=current.year+1, month=1)
            else:
                current = current.replace(month=current.month+1)
        return result
    elif period == 'quarterly':
        # 按季度生成日期
        result = []
        current = start_date.replace(day=1, month=((start_date.month-1)//3)*3 + 1)
        while current <= end_date:
            quarter = (current.month-1)//3 + 1
            result.append(f"{current.year}-Q{quarter}")
            # 移动到下一个季度
            if current.month > 9:
                current = current.replace(year=current.year+1, month=1)
            else:
                current = current.replace(month=current.month+3)
        return result
    elif period == 'yearly':
        # 按年生成日期
        result = []
        for year in range(start_date.year, end_date.year + 1):
            result.append(str(year))
        return result
    
    # 对于日期和周期，使用时间增量
    result = []
    current = start_date
    while current <= end_date:
        result.append(current.strftime(date_format))
        current += delta
    
    return result

def get_cache_key(prefix, **params):
    """
    根据参数生成缓存键
    
    Args:
        prefix: 缓存键前缀
        **params: 缓存参数
        
    Returns:
        缓存键字符串
    """
    param_str = '_'.join(f"{k}={v}" for k, v in sorted(params.items()))
    return f"{prefix}_{param_str}"

def format_chart_response(chart_type, title, description, labels, datasets, summary=None):
    """
    格式化图表响应数据
    
    Args:
        chart_type: 图表类型 (line/bar/pie)
        title: 图表标题
        description: 图表描述
        labels: X轴标签
        datasets: 数据集
        summary: 汇总信息
        
    Returns:
        格式化的响应字典
    """
    return {
        "chart_type": chart_type,
        "title": title,
        "description": description,
        "labels": labels,
        "datasets": datasets,
        "summary": summary or {}
    }

def empty_chart_response(title, message="暂无数据", chart_type="line"):
    """
    创建空图表响应
    
    Args:
        title: 图表标题
        message: 显示的消息
        chart_type: 图表类型，默认为line
        
    Returns:
        空的图表响应
    """
    return format_chart_response(
        chart_type=chart_type,
        title=title,
        description=message,
        labels=[],
        datasets=[],
        summary={"message": message}
    ) 