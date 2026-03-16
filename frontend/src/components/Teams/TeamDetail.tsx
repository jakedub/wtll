import React from 'react';
import { Stage, Layer, Circle, Line, Rect } from 'react-konva';

const TeamDetail: React.FC = () => {
  const scale = 1.75; // 1 ft ≈ 1.75 px

  // Key points
  const homePlate = { x: 350, y: 630 };
  const firstBase = { x: homePlate.x + 60 * scale, y: homePlate.y - 60 * scale };
  const secondBase = { x: homePlate.x, y: homePlate.y - 84.85 * scale };
  const thirdBase = { x: homePlate.x - 60 * scale, y: homePlate.y - 60 * scale };
  const pitcher = { x: homePlate.x, y: homePlate.y - 46 * scale };

  // Outfield arc points (200 ft radius)
  const outfieldArcPoints = () => {
    const cx = homePlate.x;
    const cy = homePlate.y;
    const r = 200 * scale;
    const steps = 100;
    const points: number[] = [];
    const startAngle = Math.PI * 5 / 4; // 225°
    const endAngle = Math.PI * 7 / 4;   // 315°
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = startAngle + t * (endAngle - startAngle);
      points.push(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    }
    return points;
  };

  return (
    <Stage width={700} height={700}>
      <Layer>
        {/* Grass */}
        <Rect x={0} y={0} width={700} height={700} fill="#4caf50" />

        {/* Outfield arc */}
        <Line points={outfieldArcPoints()} stroke="white" strokeWidth={3} closed={false} />

        {/* Infield dirt */}
        <Line
          points={[
            homePlate.x, homePlate.y,
            firstBase.x, firstBase.y,
            secondBase.x, secondBase.y,
            thirdBase.x, thirdBase.y
          ]}
          closed
          fill="#DEB887"
          stroke="#DEB887"
          strokeWidth={2}
          opacity={0.9}
        />

        {/* Baselines */}
        <Line points={[homePlate.x, homePlate.y, firstBase.x, firstBase.y]} stroke="white" strokeWidth={2} />
        <Line points={[firstBase.x, firstBase.y, secondBase.x, secondBase.y]} stroke="white" strokeWidth={2} />
        <Line points={[secondBase.x, secondBase.y, thirdBase.x, thirdBase.y]} stroke="white" strokeWidth={2} />
        <Line points={[thirdBase.x, thirdBase.y, homePlate.x, homePlate.y]} stroke="white" strokeWidth={2} />

        {/* Foul lines */}
        <Line points={[homePlate.x, homePlate.y, firstBase.x + 150, firstBase.y - 150]} stroke="white" strokeWidth={3} />
        <Line points={[homePlate.x, homePlate.y, thirdBase.x - 150, thirdBase.y - 150]} stroke="white" strokeWidth={3} />

        {/* Bases */}
        {[firstBase, secondBase, thirdBase].map((b, idx) => (
          <Rect key={idx} x={b.x - 3} y={b.y - 3} width={6} height={6} rotation={45} fill="white" stroke="black" strokeWidth={1} />
        ))}

        {/* Home plate */}
        <Line
          points={[
            homePlate.x - 8, homePlate.y + 8,
            homePlate.x + 8, homePlate.y + 8,
            homePlate.x + 12, homePlate.y,
            homePlate.x, homePlate.y - 12,
            homePlate.x - 12, homePlate.y
          ]}
          closed
          fill="white"
          stroke="black"
          strokeWidth={2}
        />

        {/* Pitcher's mound */}
        <Circle x={pitcher.x} y={pitcher.y} radius={5 * scale} fill="#DEB887" stroke="black" strokeWidth={1} />
      </Layer>
    </Stage>
  );
};

export default TeamDetail;