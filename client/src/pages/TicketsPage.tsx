import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { type TicketStatus } from "@repo/core";
import { Navbar } from "../components/Navbar";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

type Ticket = {
  id: string;
  subject: string;
  senderEmail: string;
  status: TicketStatus;
  category: "GENERAL_QUESTION" | "TECHNICAL_QUESTION" | "REFUND_REQUEST" | null;
  createdAt: string;
  agent: { id: string; name: string | null; email: string } | null;
};

const STATUS_STYLES: Record<TicketStatus, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-600",
};

const CATEGORY_LABELS: Record<NonNullable<Ticket["category"]>, string> = {
  GENERAL_QUESTION: "General",
  TECHNICAL_QUESTION: "Technical",
  REFUND_REQUEST: "Refund",
};

function axiosError(e: unknown, fallback: string) {
  return axios.isAxiosError(e) ? (e.response?.data?.error ?? e.message) : fallback;
}

const columnHelper = createColumnHelper<Ticket>();

const columns = [
  columnHelper.accessor("subject", {
    header: "Subject",
    cell: (info) => (
      <span className="font-medium text-gray-900 truncate block">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("senderEmail", {
    header: "From",
    cell: (info) => <span className="text-gray-600 truncate block">{info.getValue()}</span>,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const status = info.getValue();
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
        >
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </span>
      );
    },
  }),
  columnHelper.accessor("category", {
    header: "Category",
    cell: (info) => {
      const cat = info.getValue();
      return cat ? (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700">
          {CATEGORY_LABELS[cat]}
        </span>
      ) : (
        <span className="text-gray-400">—</span>
      );
    },
  }),
  columnHelper.accessor("agent", {
    header: "Assigned to",
    enableSorting: false,
    cell: (info) => {
      const agent = info.getValue();
      return agent ? (
        <span className="text-gray-600 truncate block">{agent.name ?? agent.email}</span>
      ) : (
        <span className="text-gray-400">Unassigned</span>
      );
    },
  }),
  columnHelper.accessor("createdAt", {
    header: "Created",
    cell: (info) => (
      <span className="text-gray-500">{new Date(info.getValue()).toLocaleDateString()}</span>
    ),
  }),
];

export function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);

  const sortBy = sorting[0]?.id;
  const sortDir = sorting[0] ? (sorting[0].desc ? "desc" : "asc") : undefined;

  const { data: tickets, isPending, error } = useQuery({
    queryKey: ["tickets", sortBy, sortDir],
    queryFn: () =>
      axios
        .get<Ticket[]>("/api/tickets", { params: { sortBy, sortDir } })
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Tickets</h1>
        </div>

        {error && (
          <p className="text-destructive text-sm mb-4">
            {axiosError(error, "Failed to load tickets")}
          </p>
        )}

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[30%]" />  {/* Subject */}
                <col className="w-[20%]" />  {/* From */}
                <col className="w-[10%]" />  {/* Status */}
                <col className="w-[12%]" />  {/* Category */}
                <col className="w-[16%]" />  {/* Assigned to */}
                <col className="w-[12%]" />  {/* Created */}
              </colgroup>
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b text-left text-gray-500">
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const sorted = header.column.getIsSorted();
                      return (
                        <th key={header.id} className="px-4 py-3 font-medium">
                          {canSort ? (
                            <button
                              onClick={header.column.getToggleSortingHandler()}
                              className="inline-flex items-center gap-1 hover:text-gray-800 transition-colors"
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {sorted === "asc" ? (
                                <ArrowUp className="w-3 h-3" />
                              ) : sorted === "desc" ? (
                                <ArrowDown className="w-3 h-3" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 opacity-40" />
                              )}
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {isPending &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    </tr>
                  ))}

                {!isPending && tickets?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                      No tickets yet.
                    </td>
                  </tr>
                )}

                {!isPending &&
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50/50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
