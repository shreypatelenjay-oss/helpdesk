import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, } from "@tanstack/react-table";
import { useState } from "react";
import { Navbar } from "../components/Navbar";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
const STATUS_STYLES = {
    OPEN: "bg-blue-100 text-blue-700",
    RESOLVED: "bg-green-100 text-green-700",
    CLOSED: "bg-gray-100 text-gray-600",
};
const CATEGORY_LABELS = {
    GENERAL_QUESTION: "General",
    TECHNICAL_QUESTION: "Technical",
    REFUND_REQUEST: "Refund",
};
function axiosError(e, fallback) {
    return axios.isAxiosError(e) ? (e.response?.data?.error ?? e.message) : fallback;
}
const columnHelper = createColumnHelper();
const columns = [
    columnHelper.accessor("subject", {
        header: "Subject",
        cell: (info) => (_jsx("span", { className: "font-medium text-gray-900 truncate block", children: info.getValue() })),
    }),
    columnHelper.accessor("senderEmail", {
        header: "From",
        cell: (info) => _jsx("span", { className: "text-gray-600 truncate block", children: info.getValue() }),
    }),
    columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
            const status = info.getValue();
            return (_jsx("span", { className: `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`, children: status.charAt(0) + status.slice(1).toLowerCase() }));
        },
    }),
    columnHelper.accessor("category", {
        header: "Category",
        cell: (info) => {
            const cat = info.getValue();
            return cat ? (_jsx("span", { className: "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700", children: CATEGORY_LABELS[cat] })) : (_jsx("span", { className: "text-gray-400", children: "\u2014" }));
        },
    }),
    columnHelper.accessor("agent", {
        header: "Assigned to",
        enableSorting: false,
        cell: (info) => {
            const agent = info.getValue();
            return agent ? (_jsx("span", { className: "text-gray-600 truncate block", children: agent.name ?? agent.email })) : (_jsx("span", { className: "text-gray-400", children: "Unassigned" }));
        },
    }),
    columnHelper.accessor("createdAt", {
        header: "Created",
        cell: (info) => (_jsx("span", { className: "text-gray-500", children: new Date(info.getValue()).toLocaleDateString() })),
    }),
];
export function TicketsPage() {
    const [sorting, setSorting] = useState([{ id: "createdAt", desc: true }]);
    const sortBy = sorting[0]?.id;
    const sortDir = sorting[0] ? (sorting[0].desc ? "desc" : "asc") : undefined;
    const { data: tickets, isPending, error } = useQuery({
        queryKey: ["tickets", sortBy, sortDir],
        queryFn: () => axios
            .get("/api/tickets", { params: { sortBy, sortDir } })
            .then((r) => r.data),
    });
    const table = useReactTable({
        data: tickets ?? [],
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        manualSorting: true,
        getCoreRowModel: getCoreRowModel(),
    });
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Navbar, {}), _jsxs("div", { className: "max-w-5xl mx-auto p-8", children: [_jsx("div", { className: "flex items-center justify-between mb-6", children: _jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Tickets" }) }), error && (_jsx("p", { className: "text-destructive text-sm mb-4", children: axiosError(error, "Failed to load tickets") })), _jsx(Card, { children: _jsx(CardContent, { className: "p-0", children: _jsxs("table", { className: "w-full text-sm table-fixed", children: [_jsxs("colgroup", { children: [_jsx("col", { className: "w-[30%]" }), "  ", _jsx("col", { className: "w-[20%]" }), "  ", _jsx("col", { className: "w-[10%]" }), "  ", _jsx("col", { className: "w-[12%]" }), "  ", _jsx("col", { className: "w-[16%]" }), "  ", _jsx("col", { className: "w-[12%]" }), "  "] }), _jsx("thead", { children: table.getHeaderGroups().map((headerGroup) => (_jsx("tr", { className: "border-b text-left text-gray-500", children: headerGroup.headers.map((header) => {
                                                const canSort = header.column.getCanSort();
                                                const sorted = header.column.getIsSorted();
                                                return (_jsx("th", { className: "px-4 py-3 font-medium", children: canSort ? (_jsxs("button", { onClick: header.column.getToggleSortingHandler(), className: "inline-flex items-center gap-1 hover:text-gray-800 transition-colors", children: [flexRender(header.column.columnDef.header, header.getContext()), sorted === "asc" ? (_jsx(ArrowUp, { className: "w-3 h-3" })) : sorted === "desc" ? (_jsx(ArrowDown, { className: "w-3 h-3" })) : (_jsx(ArrowUpDown, { className: "w-3 h-3 opacity-40" }))] })) : (flexRender(header.column.columnDef.header, header.getContext())) }, header.id));
                                            }) }, headerGroup.id))) }), _jsxs("tbody", { children: [isPending &&
                                                Array.from({ length: 5 }).map((_, i) => (_jsxs("tr", { className: "border-b last:border-0", children: [_jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-4 w-48" }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-4 w-36" }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-5 w-16 rounded-full" }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-5 w-20 rounded-full" }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-4 w-24" }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-4 w-20" }) })] }, i))), !isPending && tickets?.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-4 py-6 text-center text-gray-400", children: "No tickets yet." }) })), !isPending &&
                                                table.getRowModel().rows.map((row) => (_jsx("tr", { className: "border-b last:border-0 hover:bg-gray-50/50", children: row.getVisibleCells().map((cell) => (_jsx("td", { className: "px-4 py-3", children: flexRender(cell.column.columnDef.cell, cell.getContext()) }, cell.id))) }, row.id)))] })] }) }) })] })] }));
}
