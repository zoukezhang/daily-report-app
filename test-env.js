import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

console.log('Environment Variables:');
console.log('HISTORY_PASSWORD:', process.env.HISTORY_PASSWORD);
console.log('VITE_DEEPSEEK_API_KEY:', process.env.VITE_DEEPSEEK_API_KEY);

// 验证环境变量是否存在
if (process.env.HISTORY_PASSWORD && process.env.VITE_DEEPSEEK_API_KEY) {
  console.log('\n✅ 环境变量加载成功！');
} else {
  console.log('\n❌ 环境变量加载失败！');
}