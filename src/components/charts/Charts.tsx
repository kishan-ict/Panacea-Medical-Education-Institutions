import type { ReactNode } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/utils/cn'

/** Semantic chart palette — switches automatically with the theme tokens. */
export const CHART_COLORS = [
  'var(--c-chart-1)',
  'var(--c-chart-2)',
  'var(--c-chart-3)',
  'var(--c-chart-4)',
  'var(--c-chart-5)',
  'var(--c-chart-6)',
] as const

export const GRID_COLOR = 'var(--c-grid)'
const AXIS_COLOR = 'var(--c-ink3)'

interface SeriesSpec {
  key: string
  name: string
  color?: string
}

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean
  payload?: { name?: string; value?: number | string; color?: string; dataKey?: string }[]
  label?: string
  formatter?: (value: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-line bg-panel px-3 py-2 shadow-pop">
      {label != null && <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink3">{label}</p>}
      <div className="space-y-0.5">
        {payload.map((entry, index) => (
          <p key={index} className="flex items-center gap-2 text-xs text-ink">
            <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-ink2">{entry.name}</span>
            <span className="ml-auto font-semibold tabular-nums">
              {formatter && typeof entry.value === 'number'
                ? formatter(entry.value)
                : String(entry.value ?? '—')}
            </span>
          </p>
        ))}
      </div>
    </div>
  )
}

function ChartLegend({ payload }: { payload?: readonly { value?: unknown; color?: unknown }[] }) {
  if (!payload?.length) return null
  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
      {payload.map((entry, index) => (
        <span key={index} className="flex items-center gap-1.5 text-[11px] text-ink2">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color as string }} />
          {String(entry.value ?? '')}
        </span>
      ))}
    </div>
  )
}

/* ------------------------------ trends ---------------------------- */

export function TrendChart({
  data,
  xKey,
  series,
  height = 240,
  area = false,
  yFormatter,
  yDomain,
  className,
}: {
  data: Record<string, unknown>[]
  xKey: string
  series: SeriesSpec[]
  height?: number
  area?: boolean
  yFormatter?: (value: number) => string
  yDomain?: [number | 'auto' | 'dataMin', number | 'auto' | 'dataMax']
  className?: string
}) {
  const Chart = area ? AreaChart : LineChart
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={GRID_COLOR} vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fill: AXIS_COLOR, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: GRID_COLOR }}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            tick={{ fill: AXIS_COLOR, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={54}
            domain={yDomain ?? [0, 'auto']}
            tickFormatter={yFormatter}
          />
          <Tooltip
            content={<ChartTooltip formatter={yFormatter} />}
            cursor={{ stroke: GRID_COLOR, strokeWidth: 1 }}
          />
          <Legend content={(props) => <ChartLegend payload={props.payload} />} />
          {series.map((spec) =>
            area ? (
              <Area
                key={spec.key}
                type="monotone"
                dataKey={spec.key}
                name={spec.name}
                stroke={spec.color ?? CHART_COLORS[0]}
                strokeWidth={2}
                fill={spec.color ?? CHART_COLORS[0]}
                fillOpacity={0.12}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ) : (
              <Line
                key={spec.key}
                type="monotone"
                dataKey={spec.key}
                name={spec.name}
                stroke={spec.color ?? CHART_COLORS[0]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ),
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  )
}

/* ------------------------------- bars ----------------------------- */

export function BarSeriesChart({
  data,
  xKey,
  bars,
  height = 240,
  stacked = false,
  horizontal = false,
  yFormatter,
  className,
  labelColor,
}: {
  data: Record<string, unknown>[]
  xKey: string
  bars: SeriesSpec[]
  height?: number
  stacked?: boolean
  horizontal?: boolean
  yFormatter?: (value: number) => string
  className?: string
  labelColor?: string
}) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={GRID_COLOR} vertical={false} strokeDasharray="3 3" />
          {horizontal ? (
            <>
              <XAxis type="number" tick={{ fill: AXIS_COLOR, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={yFormatter} />
              <YAxis
                type="category"
                dataKey={xKey}
                tick={{ fill: labelColor ?? AXIS_COLOR, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={110}
              />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={{ fill: AXIS_COLOR, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID_COLOR }} interval={0} angle={data.length > 7 ? -18 : 0} textAnchor={data.length > 7 ? 'end' : 'middle'} height={data.length > 7 ? 56 : 32} />
              <YAxis tick={{ fill: AXIS_COLOR, fontSize: 11 }} tickLine={false} axisLine={false} width={44} tickFormatter={yFormatter} />
            </>
          )}
          <Tooltip content={<ChartTooltip formatter={yFormatter} />} cursor={{ fill: 'rgba(127,144,170,.10)' }} />
          <Legend content={(props) => <ChartLegend payload={props.payload} />} />
          {bars.map((bar) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.name}
              fill={bar.color ?? CHART_COLORS[0]}
              radius={stacked ? [0, 0, 0, 0] : [5, 5, 0, 0]}
              stackId={stacked ? 'stack' : undefined}
              barSize={horizontal ? 16 : 26}
              maxBarSize={48}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ------------------------------- donut ---------------------------- */

export function DonutChart({
  data,
  height = 230,
  centerLabel,
  centerValue,
  className,
}: {
  data: { name: string; value: number; color?: string }[]
  height?: number
  centerLabel?: string
  centerValue?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('relative w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((row, index) => (
              <Cell key={row.name} fill={row.color ?? CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend content={(props) => <ChartLegend payload={props.payload} />} />
        </PieChart>
      </ResponsiveContainer>
      {(centerValue || centerLabel) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
          <span className="font-display text-2xl font-bold text-ink">{centerValue}</span>
          {centerLabel && <span className="text-[11px] uppercase tracking-wide text-ink3">{centerLabel}</span>}
        </div>
      )}
    </div>
  )
}
