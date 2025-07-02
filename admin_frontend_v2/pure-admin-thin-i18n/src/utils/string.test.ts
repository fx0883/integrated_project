import { slugify, containsChinese } from './string';

// 测试containsChinese函数
console.log("测试containsChinese函数:");
console.log("'Hello World' 包含中文:", containsChinese('Hello World')); // 应该是 false
console.log("'你好，世界' 包含中文:", containsChinese('你好，世界')); // 应该是 true
console.log("'Hello 世界' 包含中文:", containsChinese('Hello 世界')); // 应该是 true

// 测试slugify函数
console.log("\n测试slugify函数:");
console.log("英文: 'Hello World' =>", slugify('Hello World'));
console.log("中文: '你好，世界' =>", slugify('你好，世界'));
console.log("混合: 'Hello 世界' =>", slugify('Hello 世界'));
console.log("特殊字符: 'Hello@World!' =>", slugify('Hello@World!'));
console.log("中文特殊字符: '你好@世界!' =>", slugify('你好@世界!'));

// 多次测试以验证时间戳部分
console.log("\n验证时间戳:");
setTimeout(() => {
  console.log("延迟后: '测试' =>", slugify('测试'));
}, 10);

// 输出结果说明
console.log("\n结果说明:");
console.log("1. 中文会被转换为拼音，多个汉字间用下划线连接");
console.log("2. 所有结果末尾添加下划线和时间戳后3位");
console.log("3. 非中文会被转换为小写，并替换特殊字符为下划线"); 