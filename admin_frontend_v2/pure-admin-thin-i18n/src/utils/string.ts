import { pinyin } from 'pinyin-pro';

/**
 * 检测字符串是否包含中文字符
 * @param str 输入字符串
 * @returns 是否包含中文
 */
export function containsChinese(str: string): boolean {
  return /[\u4e00-\u9fa5]/.test(str);
}

/**
 * 生成URL友好的别名(slug)
 * 如果包含中文，将转换为拼音
 * 
 * @param text 需要转换的文本
 * @returns 生成的别名
 */
export function slugify(text: string): string {
  if (!text) return '';
  
  // 获取当前时间戳后3位
  const timestamp = Date.now().toString().slice(-3);
  
  // 检查是否包含中文
  if (containsChinese(text)) {
    // 转换为拼音(不带声调)，小写，用连字符连接
    const pinyinText = pinyin(text, { toneType: 'none', type: 'array' }).join('-');
    return `${pinyinText.toLowerCase()}-${timestamp}`;
  } else {
    // 非中文处理：转小写，替换空格和特殊字符为连字符
    const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return `${slug}-${timestamp}`;
  }
}

/**
 * 截断文本，超出部分用省略号代替
 * @param text 文本内容
 * @param length 最大长度
 * @returns 截断后的文本
 */
export function truncateText(text: string, length: number): string {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * 将驼峰命名转换为短横线命名
 * @param str 驼峰命名的字符串
 * @returns 短横线命名的字符串
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
} 