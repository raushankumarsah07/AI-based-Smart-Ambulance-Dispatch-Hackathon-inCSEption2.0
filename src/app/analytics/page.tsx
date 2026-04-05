"use client";

import { hospitals, getDashboardStats } from "@/lib/simulation-data";
import StatCard from "@/components/ui/StatCard";
import {
  Activity,
  Clock,
  Heart,
  Leaf,
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ---- Mock Data ----

// Response time by hour (rush hour peaks)
const responseTimeData = Array.from({ length: 24 }, (_, hour) => {
  let base = 7;
  // Morning rush 8-10
  if (hour >= 8 && hour <= 10) base = 12 + Math.random() * 3;
  // Evening rush 17-20
  else if (hour >= 17 && hour <= 20) base = 14 + Math.random() * 4;
  // Late night (low traffic)
  else if (hour >= 23 || hour <= 5) base = 5 + Math.random() * 2;
  // Normal daytime
  else base = 8 + Math.random() * 2;
  return {
    hour: `${hour.toString().padStart(2, "0")}:00`,
    responseTime: Math.round(base * 10) / 10,
  };
});

// Severity distribution (realistic Delhi data)
const severityData = [
  { name: "P1 Critical", value: 18, color: "#ef4444" },
  { name: "P2 Urgent", value: 32, color: "#f97316" },
  { name: "P3 Moderate", value: 35, color: "#eab308" },
  { name: "P4 Minor", value: 15, color: "#22c55e" },
];

// Hospital utilization from real data
const hospitalUtilData = hospitals.map((h) => ({
  name: h.name.length > 20 ? h.name.slice(0, 18) + "..." : h.name,
  fullName: h.name,
  occupancy: Math.round(((h.totalBeds - h.availableBeds) / h.totalBeds) * 100),
  icuOccupancy: Math.round(((h.icuBeds - h.icuAvailable) / h.icuBeds) * 100),
}));

// Hourly emergency volume (peaks at night and rush hours)
const hourlyVolumeData = Array.from({ length: 24 }, (_, hour) => {
  let base = 3;
  // Late night (accidents, violence) 22-2
  if (hour >= 22 || hour <= 2) base = 7 + Math.random() * 3;
  // Morning rush 8-10
  else if (hour >= 8 && hour <= 10) base = 6 + Math.random() * 2;
  // Evening rush 17-20
  else if (hour >= 17 && hour <= 20) base = 8 + Math.random() * 3;
  // Early morning lull
  else if (hour >= 3 && hour <= 6) base = 2 + Math.random() * 1;
  // Normal daytime
  else base = 4 + Math.random() * 2;
  return {
    hour: `${hour.toString().padStart(2, "0")}:00`,
    emergencies: Math.round(base),
  };
});

// ---- Custom Tooltip ----
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-card-border bg-[#0a0f1c] px-3 py-2 shadow-xl">
      {label && (
        <p className="text-xs font-medium text-muted mb-1">{label}</p>
      )}
      {payload.map((entry, i) => (
        <p key={i} className="text-xs font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

// Tooltip specifically for pie chart
function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border border-card-border bg-[#0a0f1c] px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold" style={{ color: entry.payload.color }}>
        {entry.name}: {entry.value}%
      </p>
    </div>
  );
}

export default function AnalyticsPage() {
  const stats = getDashboardStats();

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Analytics & Reports
          </h1>
          <p className="text-sm text-muted mt-1">
            Performance metrics and emergency response analytics — Delhi NCR
          </p>
        </div>

        {/* Top row: Summary stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatCard
            title="Total Emergencies"
            value={stats.totalEmergencies}
            subtitle="Last 24 hours"
            icon={<Activity className="h-5 w-5" />}
            color="#06b6d4"
          />
          <StatCard
            title="Avg Response Time"
            value={`${stats.avgResponseTime} min`}
            subtitle="Target: < 10 min"
            icon={<Clock className="h-5 w-5" />}
            trend="down"
            color="#22c55e"
          />
          <StatCard
            title="Lives Impacted"
            value={stats.livesImpacted.toLocaleString()}
            subtitle="Since system launch"
            icon={<Heart className="h-5 w-5" />}
            trend="up"
            color="#f97316"
          />
          <StatCard
            title="CO2 Saved"
            value={`${stats.co2Saved} kg`}
            subtitle="Via optimized routing"
            icon={<Leaf className="h-5 w-5" />}
            trend="up"
            color="#22c55e"
          />
        </div>

        {/* Charts 2x2 grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 1. Response Time Trend (LineChart) */}
          <div className="rounded-xl border border-card-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Response Time Trend (24h)
            </h3>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    axisLine={{ stroke: "#1e293b" }}
                    tickLine={false}
                    interval={3}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    axisLine={{ stroke: "#1e293b" }}
                    tickLine={false}
                    unit=" min"
                    width={55}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="responseTime"
                    name="Avg Response"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: "#06b6d4",
                      stroke: "#0a0f1c",
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Emergencies by Severity (PieChart) */}
          <div className="rounded-xl border border-card-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Emergencies by Severity
            </h3>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span className="text-xs text-muted">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Hospital Utilization (BarChart — horizontal) */}
          <div className="rounded-xl border border-card-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Hospital Bed Occupancy
            </h3>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart
                  data={hospitalUtilData}
                  layout="vertical"
                  margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    axisLine={{ stroke: "#1e293b" }}
                    tickLine={false}
                    unit="%"
                    domain={[0, 100]}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    axisLine={{ stroke: "#1e293b" }}
                    tickLine={false}
                    width={130}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span className="text-xs text-muted">{value}</span>
                    )}
                  />
                  <Bar
                    dataKey="occupancy"
                    name="Total Beds"
                    fill="#06b6d4"
                    radius={[0, 4, 4, 0]}
                    barSize={12}
                  />
                  <Bar
                    dataKey="icuOccupancy"
                    name="ICU Beds"
                    fill="#8b5cf6"
                    radius={[0, 4, 4, 0]}
                    barSize={12}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Hourly Emergency Volume (AreaChart) */}
          <div className="rounded-xl border border-card-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Hourly Emergency Volume (24h)
            </h3>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <AreaChart data={hourlyVolumeData}>
                  <defs>
                    <linearGradient id="emergencyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    axisLine={{ stroke: "#1e293b" }}
                    tickLine={false}
                    interval={3}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    axisLine={{ stroke: "#1e293b" }}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="emergencies"
                    name="Emergencies"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fill="url(#emergencyGradient)"
                    activeDot={{
                      r: 4,
                      fill: "#06b6d4",
                      stroke: "#0a0f1c",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
