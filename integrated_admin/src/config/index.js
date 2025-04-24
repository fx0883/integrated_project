// 系统配置文件
const config = {
  // API基础URL
  baseUrl: 'http://localhost:8000',
}

// 获取完整的资源URL
export const getFullUrl = (path) => {
  // 如果已经是完整的URL，直接返回
  if (path && (path.startsWith('http://') || path.startsWith('https://'))) {
    return path;
  }
  
  // 确保路径以/开头
  const normalizedPath = path && !path.startsWith('/') ? `/${path}` : path;
  
  // 返回完整URL
  return normalizedPath ? `${config.baseUrl}${normalizedPath}` : '';
};

export default config; 