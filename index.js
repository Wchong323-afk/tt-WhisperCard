import { extension_settings } from '../../../extensions.js';

// 注入清爽的白色 DC 主题 CSS
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
    .dc-header h3 { margin: 0; color: #060607; font-size: 16px; font-weight: 700; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
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
    .whisper-fixed-btn {
        position: fixed; bottom: 90px; right: 18px; width: 44px; height: 44px;
        background: #5865f2; color: #ffffff; border-radius: 50%; box-shadow: 0 4px 14px rgba(88,101,242,0.5);
        z-index: 9999; display: flex; align-items: center; justify-content: center; font-size: 18px;
        cursor: pointer; border: 2px solid #ffffff;
    }
`;

// 智能文本解析逻辑
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

// 打开属于【当前正聊天角色】的独立面板
window.openWhisperCardPanel = function() {
    // 优先从酒馆底层获取当前角色的唯一标识 (ID 或名字)
    let charId = "default_char";
    let charName = "当前角色";

    if (window.selected_chid !== undefined && window.characters && window.characters[window.selected_chid]) {
        const currentActiveChar = window.characters[window.selected_chid];
        charId = currentActiveChar.avatar || currentActiveChar.name || window.selected_chid;
        charName = currentActiveChar.name || charName;
    } else {
        // 备用方案：抓取页面上显示的实时角色名
        const domName = $('.char_name_display').text().trim() || $('#selected_character_name').text().trim();
        if (domName) {
            charName = domName;
            charId = domName;
        }
    }

    // 关键：确保存储的 Key 绑定了该角色的唯一 ID，绝不全局混淆！
    const storageKey = `whisper_card_v2_${btoa(unescape(encodeURIComponent(charId)))}`;
    
    let savedData = localStorage.getItem(storageKey);
    let parsed;
    
    if (savedData) {
        parsed = JSON.parse(savedData);
    } else {
        parsed = parseDCText("作者：未知\n-----\n点击右上角「粘贴DC原案」按钮，为此角色录入专属档案！");
    }

    const modalHtml = `
        <div class="dc-modal-mask" id="dcModalMask">
            <div class="dc-card-container">
                <div class="dc-header">
                    <h3>💬 ${charName}</h3>
                    <button class="dc-btn-parse" id="toggleParseBtn">📋 粘贴DC原案</button>
                </div>
                <div class="dc-body">
                    <div class="dc-parse-box" id="parseBox" style="display:none;">
                        <textarea id="rawInput" placeholder="在此粘贴作者发布的原始文案..."></textarea>
                        <button class="dc-btn-primary" style="padding: 4px; font-size: 12px;" id="applyParseBtn">立即解析</button>
                    </div>
                    <div class="dc-tags-grid">
                        <div class="dc-chip"><strong>作者:</strong> <span id="valAuthor">${parsed.author}</span></div>
                        <div class="dc-chip"><strong>性向:</strong> <span id="valOrient">${parsed.orientation}</span></div>
                        <div class="dc-chip"><strong>模型:</strong> <span id="valModel">${parsed.model}</span></div>
                        <div class="dc-chip"><strong>预设:</strong> <span id="valPreset">${parsed.preset}</span></div>
                    </div>
                    <div class="dc-desc-box" id="valContent">${parsed.content}</div>
                </div>
                <div class="dc-footer">
                    <button class="dc-btn-secondary" id="dcCloseBtn">关闭</button>
                    <button class="dc-btn-primary" id="dcSaveBtn">💾 保存到此角色档案</button>
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
    
    // 点击保存：只存入当前这个角色的专属缓存格子里
    document.getElementById('dcSaveBtn').onclick = () => {
        const dataToSave = {
            author: document.getElementById('valAuthor').innerText,
            orientation: document.getElementById('valOrient').innerText,
            model: document.getElementById('valModel').innerText,
            preset: document.getElementById('valPreset').innerText,
            content: document.getElementById('valContent').innerText
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        alert(`✅ [${charName}] 的专属档案保存成功！`);
        mask.remove();
    };
};

// 挂载悬浮按钮
jQuery(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = dcLightStyles;
    document.head.appendChild(styleEl);

    if (!document.getElementById('whisperFixedBtn')) {
        const btn = document.createElement('div');
        btn.id = 'whisperFixedBtn';
        btn.className = 'whisper-fixed-btn';
        btn.innerHTML = '💬';
        btn.onclick = () => window.openWhisperCardPanel();
        document.body.appendChild(btn);
    }
});
