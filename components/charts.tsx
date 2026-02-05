"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Color palette for charts
const CHART_COLORS = {
  primary: "hsl(var(--chart-1))",
  secondary: "hsl(var(--chart-2))",
  tertiary: "hsl(var(--chart-3))",
  quaternary: "hsl(var(--chart-4))",
  quinary: "hsl(var(--chart-5))",
};

const DEFAULT_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
];

// Custom Tooltip Component
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    payload?: any;
  }>;
  label?: string;
  labelFormatter?: (label: string) => string;
  valueFormatter?: (value: number) => string;
}

function CustomTooltip({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="mb-2 font-medium text-sm">
        {labelFormatter && label ? labelFormatter(label) : label}
      </p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="size-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">
            {valueFormatter
              ? valueFormatter(entry.value as number)
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// Line Chart Component
export interface LineChartData {
  name: string;
  [key: string]: string | number;
}

interface LineChartCardProps {
  title: string;
  description?: string;
  data: LineChartData[];
  dataKeys: { key: string; name: string; color?: string }[];
  xAxisKey?: string;
  height?: number;
  className?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  labelFormatter?: (label: string) => string;
  valueFormatter?: (value: number) => string;
}

export function LineChartCard({
  title,
  description,
  data,
  dataKeys,
  xAxisKey = "name",
  height = 300,
  className,
  showLegend = true,
  showGrid = true,
  labelFormatter,
  valueFormatter,
}: LineChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            )}
            <XAxis
              dataKey={xAxisKey}
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--foreground))" }}
            />
            <YAxis
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--foreground))" }}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={
                <CustomTooltip
                  labelFormatter={labelFormatter}
                  valueFormatter={valueFormatter}
                />
              }
            />
            {showLegend && (
              <Legend wrapperStyle={{ color: "hsl(var(--foreground))" }} />
            )}
            {dataKeys.map((item, index) => (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.name}
                stroke={
                  item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                }
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Bar Chart Component
export interface BarChartData {
  name: string;
  [key: string]: string | number;
}

interface BarChartCardProps {
  title: string;
  description?: string;
  data: BarChartData[];
  dataKeys: { key: string; name: string; color?: string }[];
  xAxisKey?: string;
  height?: number;
  className?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  stacked?: boolean;
  labelFormatter?: (label: string) => string;
  valueFormatter?: (value: number) => string;
}

export function BarChartCard({
  title,
  description,
  data,
  dataKeys,
  xAxisKey = "name",
  height = 300,
  className,
  showLegend = true,
  showGrid = true,
  stacked = false,
  labelFormatter,
  valueFormatter,
}: BarChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="text-foreground">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data}>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted-foreground/50 dark:stroke-muted-foreground/40"
              />
            )}
            <XAxis
              dataKey={xAxisKey}
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "currentColor" }}
            />
            <YAxis
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "currentColor" }}
            />
            <Tooltip
              content={
                <CustomTooltip
                  labelFormatter={labelFormatter}
                  valueFormatter={valueFormatter}
                />
              }
            />
            {showLegend && (
              <Legend wrapperStyle={{ color: "currentColor" }} />
            )}
            {dataKeys.map((item, index) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                name={item.name}
                fill={
                  item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                }
                radius={[4, 4, 0, 0]}
                stackId={stacked ? "stack" : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Area Chart Component
export interface AreaChartData {
  name: string;
  [key: string]: string | number;
}

interface AreaChartCardProps {
  title: string;
  description?: string;
  data: AreaChartData[];
  dataKeys: { key: string; name: string; color?: string }[];
  xAxisKey?: string;
  height?: number;
  className?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  stacked?: boolean;
  labelFormatter?: (label: string) => string;
  valueFormatter?: (value: number) => string;
}

export function AreaChartCard({
  title,
  description,
  data,
  dataKeys,
  xAxisKey = "name",
  height = 300,
  className,
  showLegend = true,
  showGrid = true,
  stacked = false,
  labelFormatter,
  valueFormatter,
}: AreaChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            )}
            <XAxis
              dataKey={xAxisKey}
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              content={
                <CustomTooltip
                  labelFormatter={labelFormatter}
                  valueFormatter={valueFormatter}
                />
              }
            />
            {showLegend && <Legend />}
            {dataKeys.map((item, index) => (
              <Area
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.name}
                stroke={
                  item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                }
                fill={
                  item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                }
                fillOpacity={0.6}
                stackId={stacked ? "stack" : undefined}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Pie Chart Component
export interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface PieChartCardProps {
  title: string;
  description?: string;
  data: PieChartData[];
  height?: number;
  className?: string;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  valueFormatter?: (value: number) => string;
}

export function PieChartCard({
  title,
  description,
  data,
  height = 300,
  className,
  showLegend = true,
  innerRadius = 0,
  outerRadius = 80,
  valueFormatter,
}: PieChartCardProps) {
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data as any}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                  }
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) {
                  return null;
                }
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md">
                    <div className="flex items-center gap-2 text-sm">
                      <div
                        className="size-3 rounded-sm"
                        style={{ backgroundColor: data.color }}
                      />
                      <span className="font-medium">{data.name}:</span>
                      <span>
                        {valueFormatter
                          ? valueFormatter(data.value)
                          : data.value}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            {showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Donut Chart (Pie with inner radius)
export function DonutChartCard(props: PieChartCardProps) {
  return <PieChartCard {...props} innerRadius={60} outerRadius={80} />;
}

// Export chart colors for consistency
export { CHART_COLORS, DEFAULT_COLORS };
