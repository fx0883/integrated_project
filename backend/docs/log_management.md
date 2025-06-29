# 日志管理指南

本项目使用 Python 的 `logging` 模块和 `TimedRotatingFileHandler` 来实现日志的轮转和管理。

## 日志配置

日志配置在 `core/settings.py` 文件中定义，主要特点：

1. 按环境变量 `LOG_TO_CONSOLE` 决定日志输出到控制台还是文件
2. 使用 `TimedRotatingFileHandler` 实现日志按天轮转
3. 默认保留最近 15 天的日志文件

## 日志文件

当 `LOG_TO_CONSOLE=False` 时，日志将输出到以下文件：

- `logs/debug.log`：INFO 级别及以上的日志
- `logs/error.log`：ERROR 级别及以上的日志

这些文件会每天午夜自动轮转，生成带有日期后缀的新文件，例如：
- `debug.log.2023-05-01`
- `error.log.2023-05-01`

## 日志清理

系统提供了两种方式清理旧日志：

### 1. 自动清理

`TimedRotatingFileHandler` 配置了 `backupCount=15`，会自动保留最近 15 天的日志文件，删除更早的日志。

### 2. 手动清理

您可以使用以下命令手动清理旧日志：

```bash
python manage.py clean_old_logs
```

或指定保留天数：

```bash
python manage.py clean_old_logs --days=30
```

## 设置定时任务

虽然 `TimedRotatingFileHandler` 会自动管理日志文件，但为了确保日志清理的可靠性，建议设置定时任务定期执行清理命令。

### Linux/Unix 系统 (使用 cron)

1. 编辑 crontab：
   ```bash
   crontab -e
   ```

2. 添加以下内容，每天凌晨 1 点执行清理：
   ```
   0 1 * * * cd /path/to/your/project && /path/to/your/python /path/to/your/project/manage.py clean_old_logs
   ```

### Windows 系统 (使用任务计划程序)

1. 打开任务计划程序
2. 创建基本任务
3. 设置触发器为每天凌晨 1 点
4. 设置操作为启动程序
5. 程序/脚本：`python.exe`
6. 添加参数：`manage.py clean_old_logs`
7. 起始位置：项目目录路径

### 使用 Django 扩展

如果您想在 Django 项目中集成定时任务，可以考虑使用以下扩展：

1. **django-crontab**：
   ```bash
   pip install django-crontab
   ```

   在 `settings.py` 中添加：
   ```python
   INSTALLED_APPS = [
       # ...
       'django_crontab',
   ]
   
   CRONJOBS = [
       ('0 1 * * *', 'django.core.management.call_command', ['clean_old_logs']),
   ]
   ```

   然后运行：
   ```bash
   python manage.py crontab add
   ```

2. **Celery**：如果项目已经使用了 Celery，可以设置定期任务：
   
   ```python
   # celery.py
   from celery.schedules import crontab
   
   app.conf.beat_schedule = {
       'clean-old-logs-daily': {
           'task': 'your_app.tasks.clean_old_logs_task',
           'schedule': crontab(hour=1, minute=0),
       },
   }
   ```

   ```python
   # tasks.py
   from celery import shared_task
   from django.core.management import call_command
   
   @shared_task
   def clean_old_logs_task():
       call_command('clean_old_logs')
   ```

## 注意事项

1. 确保运行定时任务的用户对日志目录有写权限
2. 在生产环境中，建议将日志文件存储在单独的分区或卷上
3. 定期检查日志目录的磁盘使用情况
4. 考虑设置日志监控，及时发现异常情况 