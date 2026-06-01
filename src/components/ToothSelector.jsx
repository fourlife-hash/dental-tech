import { useState } from 'react';

const CIRCLED  = ['①','②','③','④','⑤','⑥','⑦','⑧'];
const FULLWIDE = ['１','２','３','４','５','６','７','８'];

// 象限0=右上 1=左上 2=右下 3=左下
// shiki 保存形式: "Q:{q0teeth},{q1teeth},{q2teeth},{q3teeth}"
// 旧形式（Q:で始まらない）はそのまま表示（後方互換）

function buildShiki(stateMap) {
  const quadNums = {0:[], 1:[], 2:[], 3:[]};
  for (const [key, state] of stateMap.entries()) {
    if (state === 0) continue;
    const [q, n] = key.split('-').map(Number);
    quadNums[q].push({ n, state });
  }
  const byQuad = {};
  for (let q = 0; q < 4; q++) {
    // 右側(q=0,2)は降順（8→1：正中から遠い順）、左側(q=1,3)は昇順（1→8：正中から近い順）
    const isRight = q === 0 || q === 2;
    byQuad[q] = quadNums[q]
      .sort((a, b) => isRight ? b.n - a.n : a.n - b.n)
      .map(({ n, state }) => state === 1 ? CIRCLED[n - 1] : FULLWIDE[n - 1])
      .join('');
  }
  if (!byQuad[0] && !byQuad[1] && !byQuad[2] && !byQuad[3]) return '';
  return `Q:${byQuad[0]},${byQuad[1]},${byQuad[2]},${byQuad[3]}`;
}

export function parseCross(shiki) {
  if (!shiki?.startsWith('Q:')) return null;
  const [q0, q1, q2, q3] = shiki.slice(2).split(',');
  return { ur: q0 || '', ul: q1 || '', lr: q2 || '', ll: q3 || '' };
}

export function CrossDiagram({ shiki, cellSize = 18, fontSize = '9pt', borderColor = '#555' }) {
  const cross = parseCross(shiki);
  if (!cross) return <span>{shiki || ''}</span>;
  const hasAny = cross.ur || cross.ul || cross.lr || cross.ll;
  if (!hasAny) return null;
  const tdBase = {
    padding: '1px 2px',
    minWidth: cellSize,
    lineHeight: 1.2,
    fontSize,
  };
  return (
    <table style={{ borderCollapse: 'collapse', margin: '0 auto' }}>
      <tbody>
        <tr>
          <td style={{ ...tdBase, borderRight: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, textAlign: 'right' }}>{cross.ur}</td>
          <td style={{ ...tdBase, borderBottom: `1px solid ${borderColor}`, textAlign: 'left' }}>{cross.ul}</td>
        </tr>
        <tr>
          <td style={{ ...tdBase, borderRight: `1px solid ${borderColor}`, textAlign: 'right' }}>{cross.lr}</td>
          <td style={{ ...tdBase, textAlign: 'left' }}>{cross.ll}</td>
        </tr>
      </tbody>
    </table>
  );
}

const BLUE  = '#4A90D9';
const GREEN = '#27ae60';

const QUAD_ORDER = [
  [8,7,6,5,4,3,2,1],  // q0 右上（右→中心）
  [1,2,3,4,5,6,7,8],  // q1 左上（中心→左）
  [8,7,6,5,4,3,2,1],  // q2 右下
  [1,2,3,4,5,6,7,8],  // q3 左下
];
const QUAD_LABELS = ['右上','左上','右下','左下'];

function ToothButton({ quadrant, num, stateMap, onToggle }) {
  const key   = `${quadrant}-${num}`;
  const state = stateMap.get(key) ?? 0;
  const label = state === 1 ? CIRCLED[num-1] : state === 2 ? FULLWIDE[num-1] : String(num);
  const bg    = state === 1 ? BLUE : state === 2 ? GREEN : '#f0f0f0';
  const color = state > 0 ? '#fff' : '#666';
  return (
    <button type="button" onClick={() => onToggle(key)}
      title={`${QUAD_LABELS[quadrant]} ${num}番歯`}
      style={{
        width: 24, height: 24, padding: 0, fontSize: 11,
        cursor: 'pointer',
        border: `1px solid ${state === 1 ? BLUE : state === 2 ? GREEN : '#ccc'}`,
        borderRadius: 3,
        background: bg, color,
        fontWeight: state > 0 ? 'bold' : 'normal',
        lineHeight: '22px',
      }}>
      {label}
    </button>
  );
}

export default function ToothSelector({ value, onChange }) {
  const [stateMap, setStateMap] = useState(new Map());

  function toggle(key) {
    setStateMap(prev => {
      const next = new Map(prev);
      next.set(key, ((next.get(key) ?? 0) + 1) % 3);
      onChange(buildShiki(next));
      return next;
    });
  }

  function clearAll() {
    setStateMap(new Map());
    onChange('');
  }

  const shikiValue = buildShiki(stateMap) || value || '';

  const divV = <div style={{ width: 2, background: '#888', alignSelf: 'stretch', margin: '0 2px' }} />;
  const divH = <div style={{ height: 2, background: '#888', margin: '1px 0' }} />;

  function renderRow(q0, q1) {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 1 }}>
          {QUAD_ORDER[q0].map(n => <ToothButton key={`${q0}-${n}`} quadrant={q0} num={n} stateMap={stateMap} onToggle={toggle} />)}
        </div>
        {divV}
        <div style={{ display: 'flex', gap: 1 }}>
          {QUAD_ORDER[q1].map(n => <ToothButton key={`${q1}-${n}`} quadrant={q1} num={n} stateMap={stateMap} onToggle={toggle} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

      {/* 凡例 */}
      <div style={{ fontSize: 10, color: '#666', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <span><span style={{ background: BLUE,  color:'#fff', padding:'0 3px', borderRadius:2 }}>①</span> 1回：丸数字</span>
        <span><span style={{ background: GREEN, color:'#fff', padding:'0 3px', borderRadius:2 }}>１</span> 2回：普通数字</span>
        <span style={{ color:'#aaa' }}>3回で解除</span>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* 左：歯式グリッド */}
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 1, userSelect: 'none' }}>
          <div style={{ fontSize: 10, color: '#888', textAlign: 'center', marginBottom: 2 }}>
            ← 右　　　　　　　　左 →
          </div>
          {renderRow(0, 1)}
          {divH}
          {renderRow(2, 3)}
        </div>

        {/* 右：十字プレビュー */}
        {shikiValue.startsWith('Q:') && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 10, color: '#888' }}>部位プレビュー</div>
            <CrossDiagram shiki={shikiValue} cellSize={24} fontSize="13pt" />
          </div>
        )}
      </div>

      {/* 直接編集 + クリア */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="text"
          value={shikiValue}
          onChange={e => onChange(e.target.value)}
          placeholder="自動入力または直接編集"
          className="dn-shiki-input"
          style={{ flex: 1, fontSize: 13 }}
        />
        <button type="button" onClick={clearAll}
          style={{ padding: '2px 8px', fontSize: 11, background: '#f0f0f0', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          クリア
        </button>
      </div>
    </div>
  );
}
