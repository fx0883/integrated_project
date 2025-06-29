import os
import time
import datetime
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = '清理超过指定天数的日志文件'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=settings.LOG_RETENTION_DAYS,
            help=f'要保留的日志天数，默认为{settings.LOG_RETENTION_DAYS}天'
        )

    def handle(self, *args, **options):
        days = options['days']
        logs_dir = settings.LOGS_DIR
        self.stdout.write(f'开始清理{days}天前的日志文件...')
        
        # 计算截止日期的时间戳
        cutoff_time = time.time() - (days * 24 * 60 * 60)
        
        # 获取日志目录中的所有文件
        log_files = []
        for root, dirs, files in os.walk(logs_dir):
            for file in files:
                # 只处理以.log开头或结尾的文件
                if file.endswith('.log') or '.log.' in file:
                    file_path = os.path.join(root, file)
                    log_files.append(file_path)
        
        # 检查每个日志文件的修改时间
        deleted_count = 0
        for file_path in log_files:
            file_mtime = os.path.getmtime(file_path)
            if file_mtime < cutoff_time:
                try:
                    # 文件修改时间早于截止时间，删除它
                    os.remove(file_path)
                    self.stdout.write(f'已删除: {file_path}')
                    deleted_count += 1
                except Exception as e:
                    self.stderr.write(f'删除文件失败: {file_path}, 错误: {str(e)}')
        
        if deleted_count > 0:
            self.stdout.write(self.style.SUCCESS(f'成功清理了 {deleted_count} 个旧日志文件'))
        else:
            self.stdout.write('没有找到需要清理的旧日志文件') 