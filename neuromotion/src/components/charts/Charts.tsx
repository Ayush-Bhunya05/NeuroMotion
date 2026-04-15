// NeuroMotion AI — Simple Chart Components (SVG-based, no external chart lib dependency)
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Rect, Text as SvgText, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { colors, typography, spacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DataPoint {
  label: string;
  value: number;
}

// ─── LINE CHART ──────────────────────────────────────────
interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
  showArea?: boolean;
  title?: string;
}

export function MiniLineChart({
  data,
  width = SCREEN_WIDTH - 80,
  height = 180,
  color = colors.primary,
  showDots = true,
  showArea = true,
  title,
}: LineChartProps) {
  if (data.length === 0) return null;

  const gradId = `grad_${Math.random().toString(36).substr(2, 9)}`;
  const padding = { top: 30, bottom: 35, left: 25, right: 15 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map(d => d.value), 100);
  const minVal = 0;
  const range = maxVal - minVal;

  const points = data.map((d, i) => ({
    x: padding.left + (data.length > 1 ? (i / (data.length - 1)) * chartWidth : chartWidth / 2),
    y: padding.top + chartHeight - ((d.value - minVal) / range) * chartHeight,
    value: d.value
  }));

  let linePath = points.length > 0 ? `M ${points[0].x} ${points[0].y}` : '';
  if (points.length > 1) {
    for (let i = 1; i < points.length; i++) {
      const cp1x = (points[i - 1].x + points[i].x) / 2;
      linePath += ` C ${cp1x} ${points[i - 1].y}, ${cp1x} ${points[i].y}, ${points[i].x} ${points[i].y}`;
    }
  }

  const areaPath = points.length > 1 ? (linePath +
    ` L ${points[points.length - 1].x} ${padding.top + chartHeight}` +
    ` L ${points[0].x} ${padding.top + chartHeight} Z`) : '';

  return (
    <View>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <Svg width={width} height={height}>
        <Defs>
          <SvgGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.4" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </SvgGradient>
        </Defs>

        {/* Grid lines & Y-axis labels */}
        {[0, 25, 50, 75, 100].map((val, i) => {
          const y = padding.top + chartHeight - (val / 100) * chartHeight;
          return (
            <React.Fragment key={i}>
              <Line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
              <SvgText
                x={padding.left - 6}
                y={y + 3}
                fontSize={9}
                fill={colors.textMuted}
                textAnchor="end"
              >
                {val}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Area fill */}
        {showArea && <Path d={areaPath} fill={`url(#${gradId})`} />}

        {/* Line */}
        <Path d={linePath} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />

        {/* Dots & Value Labels */}
        {showDots && points.map((p, i) => (
          <React.Fragment key={i}>
            <Circle cx={p.x} cy={p.y} r={5} fill={color} stroke={colors.bgPrimary} strokeWidth={2} />
            <SvgText
              x={p.x}
              y={p.y - 10}
              fontSize={10}
              fontWeight="bold"
              fill={colors.textPrimary}
              textAnchor="middle"
            >
              {Math.round(p.value)}
            </SvgText>
          </React.Fragment>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <SvgText
            key={i}
            x={points[i].x}
            y={height - 8}
            fontSize={10}
            fill={colors.textMuted}
            textAnchor="middle"
          >
            {d.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

// ─── BAR CHART ──────────────────────────────────────────
interface BarChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  title?: string;
}

export function MiniBarChart({
  data,
  width = SCREEN_WIDTH - 80,
  height = 140,
  color = colors.primary,
  title,
}: BarChartProps) {
  const padding = { top: 10, bottom: 30, left: 10, right: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barWidth = Math.min(30, (chartWidth / data.length) * 0.6);
  const gap = (chartWidth - barWidth * data.length) / (data.length + 1);

  return (
    <View>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <Svg width={width} height={height}>
        <Defs>
          <SvgGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="1" />
            <Stop offset="1" stopColor={color} stopOpacity="0.4" />
          </SvgGradient>
        </Defs>
        {data.map((d, i) => {
          const barHeight = (d.value / maxVal) * chartHeight;
          const x = padding.left + gap + i * (barWidth + gap);
          const y = padding.top + chartHeight - barHeight;
          return (
            <React.Fragment key={i}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill="url(#barGrad)"
              />
              <SvgText
                x={x + barWidth / 2}
                y={height - 6}
                fontSize={10}
                fill={colors.textMuted}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

// ─── STAT ROW ──────────────────────────────────────────
interface StatItem {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
}

export function StatRow({ items }: { items: StatItem[] }) {
  return (
    <View style={styles.statRow}>
      {items.map((item, i) => (
        <View key={i} style={styles.statItem}>
          {item.icon && <Text style={styles.statIcon}>{item.icon}</Text>}
          <Text style={[styles.statValue, item.color ? { color: item.color } : undefined]}>
            {item.value}
          </Text>
          <Text style={styles.statLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chartTitle: {
    fontSize: 14,
    fontFamily: typography.fonts.bodySemiBold,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 20,
    fontFamily: typography.fonts.headingBold,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: typography.fonts.body,
  },
});
