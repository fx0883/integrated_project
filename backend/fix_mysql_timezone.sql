-- 修复MySQL时区问题的SQL脚本

-- 显示当前时区设置
SELECT @@global.time_zone, @@session.time_zone;

-- 设置全局时区为+08:00（中国标准时间）
SET GLOBAL time_zone = '+08:00';

-- 设置会话时区为+08:00
SET time_zone = '+08:00';

-- 验证设置是否生效
SELECT @@global.time_zone, @@session.time_zone;

-- 注意：此设置在MySQL重启后会恢复为默认值
-- 要永久设置时区，请在my.cnf或my.ini中添加以下行:
-- [mysqld]
-- default-time-zone='+08:00' 