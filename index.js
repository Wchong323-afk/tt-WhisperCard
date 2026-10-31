import { extension_settings } from '../../../extensions.js';

// DC Fehér téma stílusok
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

    /* Fix elem gomb stílus */
    .whisper-fixed-btn {
        position: fixed; bottom: 90px; right: 18px; width: 44px; height: 44px;
        background: #5865f2; color: #ffffff; border-radius: 50%; box-shadow: 0 4px 14px rgba(88,101,242,0.5);
        z-index: 9999; display: flex; align-items: center; justify-content: center; font-size: 18px;
        cursor: pointer; border: 2px solid #ffffff;
    }
`;

// Okos elemző logika
function parseDCText(rawText) {
    const info = { author: 'Ismeretlen', orientation: 'Minden', model: 'Általános', preset: 'Nincs', content: rawText };
    if (!rawText) return info;
    const a = rawText.match(/(?:作者|author)[:：]\s*([^\n]+)/i); if (a) info.author = a[1].trim();
    const o = rawText.match(/(?:性向|orientation)[:：]\s*([^\n]+)/i); if (o) info.orientation = o[1].trim();
    const m = rawText.match(/(?:模型|model)[:：]\s*([^\n]+)/i); if (m) info.model = m[1].trim();
    const p = rawText.match(/(?:预设|preset)[:：]\s*([^\n]+)/i); if (p) info.preset = p[1].trim();
    const parts = rawText.split(/----+|————+/);
    if (parts.length > 1) info.content = parts.slice(1).join('\n').trim();
    return info;
}

// Modális ablak megjelenítése és helyi mentés
window.openWhisperCardPanel = function() {
    let charName = $('.char_name_display').text().trim() || "Karakter";
    const storageKey = `whisper_card_data_${charName}`;
    
    let savedData = localStorage.getItem(storageKey);
    let parsed;
    
    if (savedData) {
        parsed = JSON.parse(savedData);
    } else {
        parsed = parseDCText("作者：Ismeretlen\n-----\nKattints a jobb felső gombra az eredeti DC leírás beillesztéséhez!");
    }

    const modalHtml = `
        <div class="dc-modal-mask" id="dcModalMask">
            <div class="dc-card-container">
                <div class="dc-header">
                    <h3>💬 ${charName}</h3>
                    <button class="dc-btn-parse" id="toggleParseBtn">📋 DC Leírás Beillesztése</button>
                </div>
                <div class="dc-body">
                    <div class="dc-parse-box" id="parseBox" style="display:none;">
                        <textarea id="rawInput" placeholder="Illeszd be ide a szöveget..."></textarea>
                        <button class="dc-btn-primary" style="padding: 4px; font-size: 12px;" id="applyParseBtn">Feldolgozás</button>
                    </div>
                    <div class="dc-tags-grid">
                        <div class="dc-chip"><strong>Szerző:</strong> <span id="valAuthor">${parsed.author}</span></div>
                        <div class="dc-chip"><strong>Orientáció:</strong> <span id="valOrient">${parsed.orientation}</span></div>
                        <div class="dc-chip"><strong>Modell:</strong> <span id="valModel">${parsed.model}</span></div>
                        <div class="dc-chip"><strong>Preset:</strong> <span id="valPreset">${parsed.preset}</span></div>
                    </div>
                    <div class="dc-desc-box" id="valContent">${parsed.content}</div>
                </div>
                <div class="dc-footer">
                    <button class="dc-btn-secondary" id="dcCloseBtn">Bezárás</button>
                    <button class="dc-btn-primary" id="dcSaveBtn">💾 Mentés a Karakterhez</button>
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
    
    document.getElementById('dcSaveBtn').onclick = () => {
        const dataToSave = {
            author: document.getElementById('valAuthor').innerText,
            orientation: document.getElementById('valOrient').innerText,
            model: document.getElementById('valModel').innerText,
            preset: document.getElementById('valPreset').innerText,
            content: document.getElementById('valContent').innerText
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        alert("✅ Sikeresen elmentve! Legközelebb automatikusan betöltődik ehhez a karakterhez.");
        mask.remove();
    };
};

// Betöltés a felületre
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
