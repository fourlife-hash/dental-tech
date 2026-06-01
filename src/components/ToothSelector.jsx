import { useState } from 'react';

// 丸数字 ①〜⑧ と 全角数字 １〜８
const CIRCLED  = ['①','②','③','④','⑤','⑥','⑦','⑧'];
const FULLWIDE = ['１','２','３','４','５','６','７','８'];

// 選択状態: 0=未選択, 1=丸数字, 2=普通数字
// Map key: "quadrant-num"  value: 0|1|2

function buildShiki(stateMap) {
  // 歯番号(1-8)ごとに最初に見つかった状態で表示
  // 出力: 歯番号昇順で丸・普通混在
  const perNum = {}; // num -> state (1 or 2)
  for (const [key, state] of stateMap.entries()) {
    if (state === 0) continue;
    const n = parseInt(key.split('-')[1]);
    // 同じ番号で複数象限が選ばれたら最初のを優先
    if (!perNum[n]) perNum[n] = state;
  }
  return Object.keys(perNum)
    .map(Number)
    .sort((a, b) => a - b)
    .map(n => perNum[n] === 1 ? CIRCLED[n-1] : FULLWIDE[n-1])
    .join('');
}

const BLUE  = '#4A90D9';
const GREEN = '#27ae60';

// 象限ごとの表示順（右→中心線 の並び）
const QUAD_ORDER = [
  [8,7,6,5,4,3,2,1],  // 右上
  [1,2,3,4,5,6,7,8],  // 左上
  [8,7,6,5,4,3,2,1],  // 右下
  [1,2,3,4,5,6,7,8],  // 左下
];

function ToothButton({ quadrant, num, stateMap, onToggle }) {
  const key = `${quadrant}-${num}`;
  const state = stateMap.get(key) ?? 0;
  const label = state === 1 ? CIRCLED[num-1] : state === 2 ? FULLWIDE[num-1] : String(num);
  const bg    = state === 1 ? BLUE  : state === 2 ? GREEN : '#f0f0f0';
  const color = state > 0   ? '#fff' : '#555';
  return (
    <button type="button" onClick={() => onToggle(key)}
      title={`クリック: 丸数字(${CIRCLED[num-1]}) → 普通(${FULLWIDE[num-1]}) → 解除`}
      style={{
        width: 24, height: 24, padding: 0, fontSize: 11, cursor: 'pointer',
        border: `1px solid ${state === 1 ? BLUE : state === 2 ? GREEN : '#ccc'}`,
        borderRadius: 3,
        background: bg,
        color,
        fontWeight: state > 0 ? 'bold' : 'normal',
        lineHeight: '22px',
      }}>
      {label}
    </button>
  );
}

export default function ToothSelector({ value, onChange }) {
  // stateMap: key -> 0|1|2
  const [stateMap, setStateMap] = useState(new Map());

  function toggle(key) {
    setStateMap(prev => {
      const next = new Map(prev);
      const cur  = next.get(key) ?? 0;
      next.set(key, (cur + 1) % 3);  // 0→1→2→0
      onChange(buildShiki(next));
      return next;
    });
  }

  function clearAll() {
    setStateMap(new Map());
    onChange('');
  }

  const display = buildShiki(stateMap) || value || '';

  const divider = <div style={{ width: 2, background: '#888', alignSelf: 'stretch', margin: '0 2px' }} />;
  const hLine   = <div style={{ height: 2, background: '#888', margin: '1px 0' }} />;

  function renderRow(q0, q1) {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 1 }}>
          {QUAD_ORDER[q0].map(n => <ToothButton key={`${q0}-${n}`} quadrant={q0} num={n} stateMap={stateMap} onToggle={toggle} />)}
        </div>
        {divider}
        <div style={{ display: 'flex', gap: 1 }}>
          {QUAD_ORDER[q1].map(n => <ToothButton key={`${q1}-${n}`} quadrant={q1} num={n} stateMap={stateMap} onToggle={toggle} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

      {/* 凡例 */}
      <div style={{ fontSize: 10, color: '#666', display: 'flex', gap: 8 }}>
        <span><span style={{ background: BLUE,  color:'#fff', padding:'0 3px', borderRadius:2 }}>①</span> 1回クリック：丸数字</span>
        <span><span style={{ background: GREEN, color:'#fff', padding:'0 3px', borderRadius:2 }}>１</span> 2回クリック：普通数字</span>
        <span>3回クリック：解除</span>
      </div>

      {/* 歯式グリッド */}
      <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 1, userSelect: 'none' }}>
        {renderRow(0, 1)}{/* 上顎 */}
        {hLine}
        {renderRow(2, 3)}{/* 下顎 */}
      </div>

      {/* 選択結果 + 直接編集 + クリア */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="text"
          value={display}
          onChange={e => onChange(e.target.value)}
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
