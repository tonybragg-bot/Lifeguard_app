import React from 'react';

// Deterministic QR-style matrix for the offline medical card demo.
// Visual representation of the encoded medical summary (real app embeds a scannable QR).
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const MedicalQR: React.FC<{ data: string; size?: number }> = ({ data, size = 160 }) => {
  const modules = 25;
  const cell = size / modules;
  const seed = hashString(data);

  const isFinder = (r: number, c: number) => {
    const inBox = (br: number, bc: number) =>
      r >= br && r < br + 7 && c >= bc && c < bc + 7 &&
      (r === br || r === br + 6 || c === bc || c === bc + 6 ||
        (r >= br + 2 && r <= br + 4 && c >= bc + 2 && c <= bc + 4));
    return inBox(0, 0) || inBox(0, modules - 7) || inBox(modules - 7, 0);
  };
  const isFinderZone = (r: number, c: number) => {
    const inZone = (br: number, bc: number) => r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return inZone(0, 0) || inZone(0, modules - 7) || inZone(modules - 7, 0);
  };

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      let fill = false;
      if (isFinder(r, c)) fill = true;
      else if (!isFinderZone(r, c)) {
        const v = hashString(`${seed}-${r}-${c}`);
        fill = (v % 100) < 48;
      }
      if (fill) {
        cells.push(
          <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#0f172a" />
        );
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg bg-white shadow-inner">
      <rect width={size} height={size} fill="#ffffff" />
      {cells}
    </svg>
  );
};

export default MedicalQR;
