import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = '/api/reports';

const App = () => {
  const [templateType, setTemplateType] = useState('qianjiang');
  const [name, setName] = useState('邹义科');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [playVolume, setPlayVolume] = useState('');
  const [newCustomers, setNewCustomers] = useState('');
  const [rawWorkItems, setRawWorkItems] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState([]);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordError, setShowPasswordError] = useState(false);
  
  // 切换模板时自动更新默认姓名
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // 验证密码不为空
    if (!password.trim()) {
      setShowPasswordError(true);
      return;
    }
    
    try {
      // 对密码进行URL编码，确保跨浏览器兼容性
      const encodedPassword = encodeURIComponent(password);
      const response = await axios.get(`${API_URL}?password=${encodedPassword}&templateType=${templateType}`);
      setHistory(response.data);
      setIsAuthenticated(true);
      setShowPasswordError(false);
    } catch (err) {
      console.error("密码错误:", err);
      setShowPasswordError(true);
    }
  };

  const loadHistory = async () => {
    if (!isAuthenticated) return;
    try {
      // 对密码进行URL编码，确保跨浏览器兼容性
      const encodedPassword = encodeURIComponent(password);
      // 添加 templateType 参数，根据当前选择的模板筛选历史记录
      const response = await axios.get(`${API_URL}?password=${encodedPassword}&templateType=${templateType}`);
      setHistory(response.data);
    } catch (err) {
      console.error("加载数据库失败:", err);
    }
  };

  // 监听 templateType 变化，切换模板时重新加载对应的历史记录
  useEffect(() => {
    loadHistory();
  }, [templateType, isAuthenticated]);

  // DeepSeek API 调用 (通过后端代理)
  const callDeepSeek = async (prompt) => {
    try {
      const response = await axios.post('/api/generate', { prompt });
      return response.data;
    } catch (error) {
      console.error("API 调用失败:", error);
      throw error;
    }
  };

  const generateReport = async () => {
    if (!rawWorkItems && !tomorrowPlan) {
      alert("请输入今日工作或明日计划内容");
      return;
    }
    
    setIsProcessing(true);
    try {
      const [y, m, d] = selectedDate.split('-');
      const formattedDate = `${y}年${parseInt(m)}月${parseInt(d)}日`;

      const todayPrompt = `请严格按照以下今日工作内容进行总结，保持内容的完整性，不要精简任何事项：
1. 意思相近的项目请合并并统计数量
2. 对于可计数的项目（如视频、直播等），请使用“内容X条”格式（如“剪辑唐老师视频3条”）
3. 对于不可计数的项目（如招聘、面试等），请不要添加数量描述（如只写“招聘人员”，不要写“招聘人员1条”）
4. 严格按照用户提供的原文内容进行总结，不要修改或精简任何信息
\n${rawWorkItems}`;
      const tomorrowPrompt = `请严格按照以下明日计划内容进行总结，保持内容的完整性，不要精简任何事项：
1. 意思相近的项目请合并并统计数量
2. 严格按照用户提供的原文内容进行总结，不要修改或精简任何信息
\n${tomorrowPlan}`;

      const [todayResult, tomorrowResult] = await Promise.all([
        rawWorkItems ? callDeepSeek(todayPrompt) : { items: [] },
        tomorrowPlan ? callDeepSeek(tomorrowPrompt) : { items: [] }
      ]);

      // 处理今日工作内容，移除不必要的"1条"描述
      const processItems = (items) => {
        return (items || []).map(item => {
          // 对于招聘、面试等不可计数的项目，移除"1条"
          if (item.includes('招聘') || item.includes('面试') || item.includes('人员') || item.includes('招商')) {
            return item.replace('1条', '').trim();
          }
          return item;
        });
      };

      const todaySummary = processItems(todayResult.items);
      const tomorrowSummary = tomorrowResult.items || [];

      let report = '';

      if (templateType === 'qianjiang') {
        report += `[拳头][拳头][拳头][拳头][拳头][拳头]\n`;
        report += `[爱心][爱心][爱心][爱心][爱心][爱心]\n`;
        report += `时间：${formattedDate}（早宣晚检）\n`;
        report += `公司：四川千江味业\n`;
        report += `部门：运营部\n`;
        report += `职位：运营总监\n`;
        report += `姓名：${name}\n`;
        report += `㈠今日总结\n`;
        report += `①昨日视频播放量（四大平台合计）：${playVolume || '-'}\n`;
        report += `②今日新增客资：${newCustomers || '0'}个\n`;
        
        if (todaySummary.length > 0) {
          todaySummary.forEach((item, index) => {
            report += `${String.fromCharCode(9314 + index)}${item}\n`;
          });
        } else {
          report += `③-\n`;
        }

        report += `㈡明日关键行动\n`;
        if (tomorrowSummary.length === 0) {
          report += `①-\n`;
        } else {
          tomorrowSummary.forEach((item, index) => {
            report += `${String.fromCharCode(9312 + index)}${item}\n`;
          });
        }

        report += `感恩公司[合十][合十]感恩老大[合十][合十]感恩同事[合十][合十]感恩自己\n`;
        report += `协同助我成 [拥抱] [拥抱]交付定江山\n`;
        report += `🔆🔆🔆🔆🔆🔆🔆🔆🔆\n`;
        report += `🚩🚩以身作则胜千言🚩🚩\n`;
        report += `❤坚定信念我想我要我创造❤`;
      } else if (templateType === 'tangmen') {
        report += `✊✊✊✊✊\n`;
        report += `❤️❤️❤️❤️❤️\n`;
        report += `时间:${formattedDate}\n`;
        report += `姓名:${name}\n`;
        report += `今日总结：\n`;
        
        if (todaySummary.length > 0) {
          todaySummary.forEach((item, index) => {
            report += `${index + 1}. ${item}\n`;
          });
        } else {
          report += `1. \n2. \n3. \n4. \n`;
        }

        report += `\n明天工作计划：\n`;
        
        if (tomorrowSummary.length > 0) {
          tomorrowSummary.forEach((item, index) => {
            report += `${index + 1}. ${item}\n`;
          });
        } else {
          report += `1. \n2. \n3. \n4. \n`;
        }

        report += `\n\n最后，感谢团队托举，感恩平台成就！\n`;
        report += ` 🔆🔆🔆🔆🔆🔆🔆🔆🔆\n`;
        report += ` 🚩🚩以身作则胜千言🚩🚩\n`;
        report += ` ❤️坚定信念我想我要我创造❤️\n`;
        report += ` 💪💪💪💪💪💪💪💪💪💪\n`;
        report += ` ✊🏻✊🏻✊🏻   上亿计划·势必达成✊🏻✊🏻✊🏻\n`;
        report += ` 🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹`;
      }

      setOutput(report);

      // 保存到数据库
      await axios.post(API_URL, {
        date: selectedDate,
        content: report,
        templateType // 添加 templateType
      });
      loadHistory();

    } catch (error) {
      console.error(error);
      alert("生成失败，请检查 API 配置或网络连接。");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyText = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("确定删除这条记录吗？")) return;
    try {
      // 对密码进行URL编码，确保跨浏览器兼容性
      const encodedPassword = encodeURIComponent(password);
      await axios.delete(`${API_URL}/${id}?password=${encodedPassword}`);
      loadHistory();
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 p-6 text-white flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                🚀 智能日报
              </h1>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="text-[10px] opacity-60 bg-white/20 p-1 rounded uppercase tracking-wider">
                SQLite Mode
              </div>
              <div className="text-[8px] opacity-50 font-mono text-right leading-none">
                {/* @ts-ignore */}
                <span>v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'}</span>
                <span className="mx-1">|</span>
                {/* @ts-ignore */}
                <span>{typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'Dev Mode'}</span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                  <label className="block text-sm font-bold mb-1 text-gray-600">选择模板</label>
                  <select 
                    className="w-full p-2.5 border rounded-lg outline-none bg-white"
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value)}
                  >
                    <option value="qianjiang">千江味总结</option>
                    <option value="tangmen">唐门餐饮总结</option>
                  </select>
               </div>
               <div>
                <label className="block text-sm font-bold mb-1 text-gray-600">日期</label>
                <input type="date" className="w-full p-2.5 border rounded-lg outline-none" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-gray-600">姓名</label>
                <input type="text" className="w-full p-2.5 border rounded-lg outline-none" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>

            {templateType === 'qianjiang' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1 text-gray-600">播放量</label>
                    <input type="text" className="w-full p-2.5 border rounded-lg outline-none" value={playVolume} onChange={(e) => setPlayVolume(e.target.value)} />
                  </div>
                </div>



                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <label className="block text-sm font-bold mb-1 text-blue-700">今日新增客资 (个)</label>
                  <input type="number" className="w-full p-2.5 border border-blue-200 rounded-lg outline-none" value={newCustomers} onChange={(e) => setNewCustomers(e.target.value)} />
                </div>
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <textarea className="w-full p-2.5 border rounded-lg h-32 text-sm" placeholder="今日具体工作..." value={rawWorkItems} onChange={(e) => setRawWorkItems(e.target.value)} />
              <textarea className="w-full p-2.5 border rounded-lg h-32 text-sm" placeholder="明日关键行动..." value={tomorrowPlan} onChange={(e) => setTomorrowPlan(e.target.value)} />
            </div>

            <button onClick={generateReport} disabled={isProcessing} className={`w-full font-bold py-4 rounded-xl text-white transition ${isProcessing ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {isProcessing ? '🤖 AI 正在处理任务...' : '✨ 生成并保存到数据库'}
            </button>

            {output && (
              <div className="mt-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-bold text-gray-400">最新日报预览</span>
                  <button onClick={() => copyText(output)} className="text-xs text-blue-600 font-bold">复制全文</button>
                </div>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-xl text-xs leading-relaxed whitespace-pre-wrap font-mono">
                  {output}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
            <h2 className="font-bold text-gray-700 italic underline">历史记录</h2>
            <span className="text-[10px] text-gray-400 italic">DATABASE</span>
          </div>
          {!isAuthenticated ? (
            <div className="p-8">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-600">请输入密码查看历史记录</label>
                  <input 
                    type="password" 
                    className={`w-full p-3 border rounded-lg outline-none ${showPasswordError ? 'border-red-500' : 'border-gray-300'}`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入密码"
                    autoFocus
                  />
                  {showPasswordError && (
                    <p className="text-xs text-red-500 mt-1">密码错误，请重新输入</p>
                  )}
                </div>
                <button type="submit" className="w-full font-bold py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition">
                  验证密码
                </button>
              </form>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
              {history.length === 0 ? (
                <div className="p-8 text-center text-gray-300 italic text-sm">暂无记录</div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="p-4 flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-blue-600">{item.date}</span>
                        <span className="text-[10px] text-gray-300">{new Date(item.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-gray-400 line-clamp-1">{item.content}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => copyText(item.content)} className="text-[10px] border px-2 py-1 rounded hover:bg-gray-50">复制</button>
                      <button onClick={() => handleDelete(item.id)} className="text-[10px] border px-2 py-1 rounded text-red-400 hover:bg-red-50">删除</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
