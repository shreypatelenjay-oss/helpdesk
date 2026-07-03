import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Bot, Clock, Inbox, TicketCheck, Tickets } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Navbar } from "../components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";

interface Stats {
  totalTickets: number;
  openTickets: number;
  aiResolvedTickets: number;
  aiResolvedPercent: number;
  avgResolutionMs: number | null;
}

interface DailyCount {
  date: string;
  count: number;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${totalSeconds}s`;
}

function formatChartDate(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${parseInt(month)}/${parseInt(day)}`;
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-muted-foreground/70">{icon}</span>
        </div>
        <p className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-5 rounded" />
        </div>
        <Skeleton className="h-9 w-20 mt-1" />
      </CardContent>
    </Card>
  );
}

export function HomePage() {
  const statsQuery = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: async () => (await axios.get<Stats>("/api/stats")).data,
  });

  const chartQuery = useQuery<DailyCount[]>({
    queryKey: ["stats", "tickets-per-day"],
    queryFn: async () =>
      (await axios.get<DailyCount[]>("/api/stats/tickets-per-day")).data,
  });

  return (
    <div className="min-h-screen bg-background md:pl-60">
      <Navbar />
      <main className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-6">Dashboard</h1>

        {statsQuery.isError && (
          <p className="text-destructive mb-4">Failed to load stats. Please refresh.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {statsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : statsQuery.data ? (
            <>
              <StatCard
                label="Total Tickets"
                value={statsQuery.data.totalTickets.toString()}
                icon={<Tickets className="h-5 w-5" />}
              />
              <StatCard
                label="Open Tickets"
                value={statsQuery.data.openTickets.toString()}
                icon={<Inbox className="h-5 w-5" />}
              />
              <StatCard
                label="Resolved by AI"
                value={statsQuery.data.aiResolvedTickets.toString()}
                icon={<Bot className="h-5 w-5" />}
              />
              <StatCard
                label="AI Resolution Rate"
                value={`${statsQuery.data.aiResolvedPercent}%`}
                icon={<TicketCheck className="h-5 w-5" />}
              />
              <StatCard
                label="Avg Resolution Time"
                value={
                  statsQuery.data.avgResolutionMs != null
                    ? formatDuration(statsQuery.data.avgResolutionMs)
                    : "—"
                }
                icon={<Clock className="h-5 w-5" />}
              />
            </>
          ) : null}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground/80">
              Tickets per Day — Last 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-6 pr-6">
            {chartQuery.isLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : chartQuery.isError ? (
              <p className="text-destructive text-sm">Failed to load chart data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={224}>
                <BarChart data={chartQuery.data} barSize={14}>
                  <CartesianGrid vertical={false} stroke="#e4e7ed" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatChartDate}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    cursor={{ fill: "#edeff4" }}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 6,
                      border: "1px solid #e5e7eb",
                    }}
                    formatter={(value) => [value, "Tickets"]}
                    labelFormatter={(label) => {
                      if (typeof label !== "string") return String(label);
                      const [y, m, d] = label.split("-");
                      return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      );
                    }}
                  />
                  <Bar dataKey="count" fill="#3b4a8c" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
