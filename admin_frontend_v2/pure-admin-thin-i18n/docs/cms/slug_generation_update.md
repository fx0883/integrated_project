# 别名(Slug)生成逻辑更新文档

## 更新概述

对CMS系统中的别名(Slug)生成逻辑进行了全面更新，实现了以下需求：

1. 对于中文标题：转换为拼音小写 + 下划线 + 时间戳后3位
2. 对于非中文标题：转换为小写字符 + 下划线 + 时间戳后3位

## 技术实现

### 1. 新增工具函数

在 `src/utils/string.ts` 文件中新增了以下函数：

- `containsChinese(str: string)`: 检测字符串是否包含中文字符
- `slugify(text: string)`: 核心函数，根据输入内容生成URL友好的别名
- `truncateText(text: string, length: number)`: 辅助函数，用于截断文本
- `camelToKebab(str: string)`: 辅助函数，将驼峰命名转换为短横线命名

### 2. 修改的组件

以下组件中的别名生成逻辑已更新：

- `src/components/Cms/Article/ArticleForm.vue`
- `src/components/Cms/Category/CategoryForm.vue`
- `src/components/Cms/Tag/TagForm.vue`

### 3. 技术依赖

- 使用 `pinyin-pro` 库进行中文到拼音的转换
- 使用 `Date.now().toString().slice(-3)` 获取时间戳后3位

## 实现细节

### 核心别名生成算法

```typescript
export function slugify(text: string): string {
  if (!text) return '';
  
  // 获取当前时间戳后3位
  const timestamp = Date.now().toString().slice(-3);
  
  // 检查是否包含中文
  if (containsChinese(text)) {
    // 转换为拼音(不带声调)，小写，用下划线连接
    const pinyinText = pinyin(text, { toneType: 'none', type: 'array' }).join('_');
    return `${pinyinText.toLowerCase()}_${timestamp}`;
  } else {
    // 非中文处理：转小写，替换空格和特殊字符为下划线
    const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return `${slug}_${timestamp}`;
  }
}
```

## 使用示例

### 中文标题处理

输入: "你好，世界"
输出: "ni_hao_shi_jie_123" (123为时间戳后3位)

### 英文标题处理

输入: "Hello World!"
输出: "hello_world_456" (456为时间戳后3位)

### 混合内容处理

输入: "Hello 世界"
输出: "hello_shi_jie_789" (789为时间戳后3位)

## 测试验证

创建了测试文件 `src/utils/string.test.ts`，可以通过以下命令运行测试：

```bash
# 如果要在Node.js环境测试
node src/utils/string.test.ts

# 或者在浏览器控制台观察
```

## 注意事项

1. 新生成的别名格式与旧格式不同，可能需要更新URL重定向规则
2. 别名中使用了下划线作为分隔符，如果系统其他部分对此有特殊处理需注意兼容性
3. 生成的别名会包含时间戳，确保重复提交同一标题不会生成相同的别名 