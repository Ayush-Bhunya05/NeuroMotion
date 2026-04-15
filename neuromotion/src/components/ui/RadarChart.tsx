// NeuroMotion AI — Radar Chart Component (SVG-based)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText, TSpan } from 'react-native-svg';
import { colors, typography } from '../../theme';

interface RadarDataPoint {
  label: string;
  value: number; // 0-100
}

interface RadarChartProps {
  data: RadarDataPoint[];
  size?: number;
  color?: string;
}

export default function RadarChart({
  data,
  size = 220,
  color = colors.cognitive,
}: RadarChartProps) {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = (size / 2) * 0.52; // Very safe radius for large labels
  const angleStep = (Math.PI * 2) / data.length;

  const ICONS = ['🃏', '⚡', '🎯', '📖'];
  
  const getPoint = (value: number, angle: number) => {
    const r = (value / 100) * radius;
    return {
      x: centerX + r * Math.cos(angle - Math.PI / 2),
      y: centerY + r * Math.sin(angle - Math.PI / 2),
    };
  };

  const polygonPoints = data.map((d, i) => {
    const p = getPoint(d.value, i * angleStep);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Grid and Data SVG */}
      <Svg width={size} height={size}>
        {/* Grid Circles */}
        {[0.25, 0.5, 0.75, 1].map((level, i) => (
          <Circle
            key={i}
            cx={centerX}
            cy={centerY}
            r={level * radius}
            stroke="rgba(0,0,0,0.06)"
            strokeWidth={1}
            fill="none"
          />
        ))}

        {/* Axis Lines */}
        {data.map((d, i) => {
          const p = getPoint(100, i * angleStep);
          return (
            <Line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={p.x}
              y2={p.y}
              stroke="rgba(0,0,0,0.04)"
              strokeWidth={1}
            />
          );
        })}

        {/* Data Polygon */}
        <Polygon
          points={polygonPoints}
          fill={color}
          fillOpacity={0.25}
          stroke={color}
          strokeWidth={3}
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, i) => {
          if (d.value <= 10) return null;
          const p = getPoint(d.value, i * angleStep);
          return (
            <Circle key={i} cx={p.x} cy={p.y} r={4} fill={color} stroke="#FFF" strokeWidth={2} />
          );
        })}
      </Svg>

      {/* High-Visibility Clean Labels (Absolute Positioned) */}
      {data.map((d, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const dist = radius + 38;
        const lx = centerX + dist * Math.cos(angle);
        const ly = centerY + dist * Math.sin(angle);

        return (
          <View 
            key={i} 
            style={[
              styles.labelBox, 
              { 
                left: lx - 45, // Center the label box (assume width 90)
                top: ly - 20, 
              }
            ]}
          >
             <Text style={styles.labelTextIcon}>{ICONS[i]}</Text>
             <Text style={styles.labelTextName} numberOfLines={1}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  labelBox: {
    position: 'absolute',
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  labelTextIcon: {
    fontSize: 12,
  },
  labelTextName: {
    fontSize: 10,
    fontFamily: typography.fonts.bodySemiBold,
    color: colors.textPrimary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
