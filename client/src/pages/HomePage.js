import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Bot, Clock, Inbox, TicketCheck, Tickets } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, } from "recharts";
import { Navbar } from "../components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
function formatDuration(ms) {
    const totalSeconds = Math.round(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0)
        return `${hours}h ${minutes}m`;
    if (minutes > 0)
        return `${minutes}m`;
    return `${totalSeconds}s`;
}
function formatChartDate(isoDate) {
    const [, month, day] = isoDate.split("-");
    return `${parseInt(month)}/${parseInt(day)}`;
}
function StatCard({ label, value, icon }) {
    return (_jsx(Card, { children: _jsxs(CardContent, { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-gray-500", children: label }), _jsx("span", { className: "text-gray-400", children: icon })] }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: value })] }) }));
}
function StatCardSkeleton() {
    return (_jsx(Card, { children: _jsxs(CardContent, { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx(Skeleton, { className: "h-4 w-28" }), _jsx(Skeleton, { className: "h-5 w-5 rounded" })] }), _jsx(Skeleton, { className: "h-9 w-20 mt-1" })] }) }));
}
export function HomePage() {
    const statsQuery = useQuery({
        queryKey: ["stats"],
        queryFn: async () => (await axios.get("/api/stats")).data,
    });
    const chartQuery = useQuery({
        queryKey: ["stats", "tickets-per-day"],
        queryFn: async () => (await axios.get("/api/stats/tickets-per-day")).data,
    });
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Navbar, {}), _jsxs("main", { className: "p-6 max-w-7xl mx-auto", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-6", children: "Dashboard" }), statsQuery.isError && (_jsx("p", { className: "text-red-500 mb-4", children: "Failed to load stats. Please refresh." })), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8", children: statsQuery.isLoading ? (Array.from({ length: 5 }).map((_, i) => _jsx(StatCardSkeleton, {}, i))) : statsQuery.data ? (_jsxs(_Fragment, { children: [_jsx(StatCard, { label: "Total Tickets", value: statsQuery.data.totalTickets.toString(), icon: _jsx(Tickets, { className: "h-5 w-5" }) }), _jsx(StatCard, { label: "Open Tickets", value: statsQuery.data.openTickets.toString(), icon: _jsx(Inbox, { className: "h-5 w-5" }) }), _jsx(StatCard, { label: "Resolved by AI", value: statsQuery.data.aiResolvedTickets.toString(), icon: _jsx(Bot, { className: "h-5 w-5" }) }), _jsx(StatCard, { label: "AI Resolution Rate", value: `${statsQuery.data.aiResolvedPercent}%`, icon: _jsx(TicketCheck, { className: "h-5 w-5" }) }), _jsx(StatCard, { label: "Avg Resolution Time", value: statsQuery.data.avgResolutionMs != null
                                        ? formatDuration(statsQuery.data.avgResolutionMs)
                                        : "—", icon: _jsx(Clock, { className: "h-5 w-5" }) })] })) : null }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base font-semibold text-gray-700", children: "Tickets per Day \u2014 Last 30 Days" }) }), _jsx(CardContent, { className: "pt-0 pb-6 pr-6", children: chartQuery.isLoading ? (_jsx(Skeleton, { className: "h-56 w-full" })) : chartQuery.isError ? (_jsx("p", { className: "text-red-500 text-sm", children: "Failed to load chart data." })) : (_jsx(ResponsiveContainer, { width: "100%", height: 224, children: _jsxs(BarChart, { data: chartQuery.data, barSize: 14, children: [_jsx(CartesianGrid, { vertical: false, stroke: "#f0f0f0" }), _jsx(XAxis, { dataKey: "date", tickFormatter: formatChartDate, tick: { fontSize: 11, fill: "#9ca3af" }, axisLine: false, tickLine: false, interval: 4 }), _jsx(YAxis, { allowDecimals: false, tick: { fontSize: 11, fill: "#9ca3af" }, axisLine: false, tickLine: false, width: 28 }), _jsx(Tooltip, { cursor: { fill: "#f9fafb" }, contentStyle: {
                                                    fontSize: 12,
                                                    borderRadius: 6,
                                                    border: "1px solid #e5e7eb",
                                                }, formatter: (value) => [value, "Tickets"], labelFormatter: (label) => {
                                                    if (typeof label !== "string")
                                                        return String(label);
                                                    const [y, m, d] = label.split("-");
                                                    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                                                } }), _jsx(Bar, { dataKey: "count", fill: "#6366f1", radius: [3, 3, 0, 0] })] }) })) })] })] })] }));
}
