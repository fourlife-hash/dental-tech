import { useState, useEffect } from 'react';

// 丸数字 ①〜⑧
const CIRCLED = ['①','②','③','④','⑤','⑥','⑦','⑧'];

// shiki文字列 → 選択セット(Set of "quadrant-num")
// 後方互換：既存テキストはそのままvalueとして扱いセレクターは空で開始
function parseShiki(text) {
  const selected = new Set();
  if (!text) return selected;
  // 丸数字から逆引き
  for (let q = 0; q < 4; q++) {
    for (let n = 0; n < 8; n++) {
      // 既存テキストから丸数字を検出してもquadrantは不明なので
      // 初期化では使わない（既存文字列はそのままinputに渡す）
    }
  }
  return selected;
}

// 選択セット → shiki文字列（歯番号昇順）
function buildShiki(selected) {
  // 歯番号(1-8)ごとに何象限選ばれているか集計
  const nums = new Set();
  for (const key of selected) {
    const n = parseInt(key.split('-')[1]);
    nums.add(n);
  }
  // 昇順で並べて丸数字化
  return [...nums].sort((a, b) => a - b).map(n => CIRCLED[n - 1]).join('');
}

// 象限ラベル
const QUAD_LABELS = ['右上', '左上', '右下', '左下'];
// 表示順（上顎：右→左 表示なので右上は8→1, 左上は1→8）
// 右上(q=0): 歯1〜8を右から左に並べる → 8,7,6,5,4,3,2,1
// 左上(q=1): 1,2,3,4,5,6,7,8
// 右下(q=2): 8,7,6,5,4,3,2,1
// 左下(q=3): 1,2,3,4,5,6,7,8
const QUAD_ORDER = [
  [8,7,6,5,4,3,2,1],  // 右上
  [1,2,3,4,5,6,7,8],  // 左上
  [8,7,6,5,4,3,2,1],  // 右下
  [1,2,3,4,5,6,7,8],  // 左下
];

const BLUE = '#4A90D9';

export default function ToothSelector({ value, onChange }) {
  const [selected, setSelected] = useState(new Set());

  // 外部からvalueが変わったとき（初期値など）→ セレクターはリセット
  useEffect(() => {
    if (!value) setSelected(new Set());
  }, []);

  function toggle(quadrant, num) {
    const key = `${quadrant}-${num}`;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      onChange(buildShiki(next));
      return next;
    });
  }

  function clearAll() {
    setSelected(new Set());
    onChange('');
  }

  const display = buildShiki(selected) || value || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* 歯式グリッド（上顎・下顎を2行に） */}
      <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 1, userSelect: 'none' }}>
        {/* 上顎行 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {/* 右上 */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
            {QUAD_ORDER[0].map(n => {
              const key = `0-${n}`;
              const sel = selected.has(key);
              return (
                <button key={key} type="button" onClick={() => toggle(0, n)}
                  style={{
                    width: 22, height: 22, padding: 0, fontSize: 10, cursor: 'pointer',
                    border: `1px solid ${sel ? BLUE : '#ccc'}`,
                    borderRadius: 3,
                    background: sel ? BLUE : '#f8f8f8',
                    color: sel ? '#fff' : '#333',
                    fontWeight: sel ? 'bold' : 'normal',
                  }}>
                  {CIRCLED[n - 1]}
                </button>
              );
            })}
          </div>
          {/* 中心線 */}
          <div style={{ width: 2, height: 22, background: '#888', margin: '0 2px' }} />
          {/* 左上 */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
            {QUAD_ORDER[1].map(n => {
              const key = `1-${n}`;
              const sel = selected.has(key);
              return (
                <button key={key} type="button" onClick={() => toggle(1, n)}
                  style={{
                    width: 22, height: 22, padding: 0, fontSize: 10, cursor: 'pointer',
                    border: `1px solid ${sel ? BLUE : '#ccc'}`,
                    borderRadius: 3,
                    background: sel ? BLUE : '#f8f8f8',
                    color: sel ? '#fff' : '#333',
                    fontWeight: sel ? 'bold' : 'normal',
                  }}>
                  {CIRCLED[n - 1]}
                </button>
              );
            })}
          </div>
        </div>

        {/* 水平中心線 */}
        <div style={{ height: 2, background: '#888', margin: '1px 0' }} />

        {/* 下顎行 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {/* 右下 */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
            {QUAD_ORDER[2].map(n => {
              const key = `2-${n}`;
              const sel = selected.has(key);
              return (
                <button key={key} type="button" onClick={() => toggle(2, n)}
                  style={{
                    width: 22, height: 22, padding: 0, fontSize: 10, cursor: 'pointer',
                    border: `1px solid ${sel ? BLUE : '#ccc'}`,
                    borderRadius: 3,
                    background: sel ? BLUE : '#f8f8f8',
                    color: sel ? '#fff' : '#333',
                    fontWeight: sel ? 'bold' : 'normal',
                  }}>
                  {CIRCLED[n - 1]}
                </button>
              );
            })}
          </div>
          {/* 中心線 */}
          <div style={{ width: 2, height: 22, background: '#888', margin: '0 2px' }} />
          {/* 左下 */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
            {QUAD_ORDER[3].map(n => {
              const key = `3-${n}`;
              const sel = selected.has(key);
              return (
                <button key={key} type="button" onClick={() => toggle(3, n)}
                  style={{
                    width: 22, height: 22, padding: 0, fontSize: 10, cursor: 'pointer',
                    border: `1px solid ${sel ? BLUE : '#ccc'}`,
                    borderRadius: 3,
                    background: sel ? BLUE : '#f8f8f8',
                    color: sel ? '#fff' : '#333',
                    fontWeight: sel ? 'bold' : 'normal',
                  }}>
                  {CIRCLED[n - 1]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 選択結果 + 直接入力 + クリア */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
        <input
          type="text"
          value={display}
          onChange={e => { onChange(e.target.value); }}
          placeholder="例: ⑥"
          className="dn-shiki-input"
          style={{ flex: 1 }}
        />
        <button type="button" onClick={clearAll}
          style={{ padding: '2px 8px', fontSize: 11, background: '#f0f0f0', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          クリア
        </button>
      </div>
    </div>
  );
}
