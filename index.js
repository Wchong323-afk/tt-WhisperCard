import { extension_settings } from '../../../extensions.js';

console.log("[WhisperCard] 正在加载...");

// 注入样式
const style = document.createElement('style');
style.innerHTML = `
    .test-mask {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.5); z-index: 999999;
        display: flex; align-items: center; justify-content: center;
    }
    .test-box {
        background: #ffffff; padding: 20px; border-radius: 12px; color: #000;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2); font-size: 16px; text-align: center;
    }
    .test-box button {
        margin-top: 15px; background: #5865f2; color: #fff; border: none;
        padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;
    }
`;
document.head.appendChild(style);

// 页面加载后强行弹出一个测试窗
setTimeout(() => {
    const div = document.createElement('div');
    div.className = 'test-mask';
    div.innerHTML = `
        <div class="test-box">
            <h3>🎉 WhisperCard 插件加载成功！</h3>
            <p>说明手机端成功读取了你的仓库代码！</p>
            <button id="closeTest">点我关闭</button>
        </div>
    `;
    document.body.appendChild(div);
    document.getElementById('closeTest').onclick = () => div.remove();
}, 1000);
