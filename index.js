import { extension_settings } from '../../../extensions.js';

// 注入白色 DC 主题 CSS
const dcLightStyles = `
    .dc-modal-mask {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(5px);
        z-index: 99999; display: flex; align-items: center; justify-content: center;
        font-family: 'gg sans', 'Noto Sans', sans-serif;
    }
    .dc-card-container {
        width: 420px; max-height: 85vh; background: #ffffff; border-radius: 12px;
        box-shadow: 0 12px 32px rgba(0,0,0,0.15); border: 1px solid #e3e5e8;
        display: flex; flex-direction: column; overflow: hidden; color: #2e3338;
        animation: dcPop 0.2s ease-out;
    }
    @keyframes dcPop { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .dc-header { background: #f2f3f5; padding: 14px 18px; border-bottom: 1px solid #e3e5e8; display: flex; justify-content: space-between; align-items: center; }
    .dc-header h3 { margin: 0; color: #060607; font-size: 16px; font-weight: 700; }
    .dc-btn-parse { background: #e3e5e8; color: #4f545c; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; }
    .dc-btn-parse:hover { background: #d7dadc; }
    .dc-body { padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
    .dc-parse-box { display: none; flex-direction: column; gap: 8px; background: #f2f3f5; padding: 10px; border-radius: 8px; border: 1px dashed #c7c9cc; }
    .dc-parse-box textarea { background: #ffffff; border: 1px solid #d7dadc; color: #2e3338; border-radius: 4px; padding: 6px; font-size: 12px; resize: vertical; height: 70px; }
    .dc-tags-grid { display: flex; flex-wrap: wrap; gap: 6px; }
    .dc-chip { background: #f2f3f5; border: 1px solid #e3e5e8; border-radius: 14px; padding: 3px 10px; font-size: 12px; color: #4f545c; }
    .dc-chip strong { color: #5865f2; }
    .dc-desc-box { background: #f8f9fa; padding: 12px; border-radius: 8px; font-size: 13px; line-height: 1.5; color: #2e3338; max-height: 200px; overflow-y: auto; white-space: pre-wrap; border: 1px solid #f2f3f5; }
    .dc-footer { padding: 12px 18px; background: #f2f3f5; display: flex; gap: 10px; border-top: 1px solid #e3e5e8; }
    .dc-btn-primary { flex: 1; background: #5865f2; color: #fff; border: none; padding: 8px; border-radius: 4px; font-weight: 600; font-size: 14px; cursor: pointer; }
    .dc-btn-primary:hover { background: #4752c4; }
    .dc-btn-secondary { background: #e3e5e8; color: #4f545c; border: none; padding: 8px 14px; border-radius: 4px; font-weight: 600; cursor: pointer; }
`;

// 智能解析文本逻辑
function parseDCText(rawText) {
    const info = { author: '未知', orientation: '全向', model: '通用', preset: '无', content: rawText };
    if (!rawText) return info;
    const a = rawText.match(/(?:作者|author)[:：]\s*([^\n]+)/i); if (a) info.author = a[1].trim();
    const o = rawText.match(/(?:性向|orientation)[:：]\s*([^\n]+)/i); if (o) info.orientation = o[1].trim();
    const m = rawText.match(/(?:模型|model)[:：]\s*([^\n]+)/i); if (m) info.model = m[1].trim();
    const p = rawText.match(/(?:预设|preset)[:：]\s*([^\n]+)/i); if (p) info.preset = p[1].trim();
    const parts = rawText.split(/----+|————+/);
    if (parts.length > 1) info.content = parts.slice(1).join('\n').trim();
    return info;
}

// 显示弹窗函数
function showDCCardModal(cardName, defaultText, onEnterChat) {
    const parsed = parseDCText(defaultText);
    const modalHtml = `
        <div class="dc-modal-mask" id="dcModalMask">
            <div class="dc-card-container">
                <div class="dc-header">
                    <h3>💬 ${cardName}</h3>
                    <button class="dc-btn-parse" id="toggleParseBtn">📋 粘贴DC原案</button>
                </div>
                <div class="dc-body">
                    <div class="dc-parse-box" id="parseBox">
                        <textarea id="rawInput" placeholder="在此粘贴作者发布的原案文案..."></textarea>
                        <button class="dc-btn-primary" style="padding: 4px; font-size: 12px;" id="applyParseBtn">应用解析</button>
                    </div>
                    <div class="dc-tags-grid">
                        <div class="dc-chip"><strong>作者:</strong> <span id="valAuthor">${parsed.author}</span></div>
                        <div class="dc-chip"><strong>性向:</strong> <span id="valOrient">${parsed.orientation}</span></div>
                        <div class="dc-chip"><strong>模型:</strong> <span id="valModel">${parsed.model}</span></div>
                        <div class="dc-chip"><strong>预设:</strong> <span id="valPreset">${parsed.preset}</span></div>
                    </div>
                    <div class="dc-desc-box" id="valContent">${parsed.content || "暂无介绍..."}</div>
                </div>
                <div class="dc-footer">
                    <button class="dc-btn-secondary" id="dcCloseBtn">取消</button>
                    <button class="dc-btn-primary" id="dcEnterBtn">进入聊天</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const mask = document.getElementById('dcModalMask');
    const parseBox = document.getElementById('parseBox');
    
    document.getElementById('toggleParseBtn').onclick = () => {
        parseBox.style.display = parseBox.style.display === 'flex' ? 'none' : 'flex';
    };

    document.getElementById('applyParseBtn').onclick = () => {
        const raw = document.getElementById('rawInput').value;
        const res = parseDCText(raw);
        document.getElementById('valAuthor').innerText = res.author;
        document.getElementById('valOrient').innerText = res.orientation;
        document.getElementById('valModel').innerText = res.model;
        document.getElementById('valPreset').innerText = res.preset;
        document.getElementById('valContent').innerText = res.content;
        parseBox.style.display = 'none';
    };

    document.getElementById('dcCloseBtn').onclick = () => mask.remove();
    document.getElementById('dcEnterBtn').onclick = () => {
        mask.remove();
        if (typeof onEnterChat === 'function') onEnterChat();
    };
}

// 自动挂载点击监听
jQuery(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = dcLightStyles;
    document.head.appendChild(styleEl);

    // 监听角色卡片点击
    $(document).on('click', '.character-select', function(e) {
        const index = $(this).attr('chid');
        if (index !== undefined && window.characters && window.characters[index]) {
            const char = window.characters[index];
            const rawDesc = char.description || char.first_mes || "";
            
            // 弹出咱们的白色 DC 界面
            showDCCardModal(char.name || "角色卡", rawDesc, () => {
                // 点击“进入聊天”后，继续执行酒馆原本的选中逻辑
            });
        }
    });

    console.log("[WhisperCard] 白色风格UI扩展挂载成功！");
});
