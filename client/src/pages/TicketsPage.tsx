import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { useState, useEffect } from "react";
import { type TicketStatus, type Ticket } from "@repo/core";
import { Navbar } from "../components/Navbar";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";


const STATUS_STYLES: Record<TicketStatus, string> = {
  NEW: "text-primary",
  PROCESSING: "text-amber-600",
  OPEN: "text-sky-700",
  RESOLVED: "text-emerald-700",
  CLOSED: "text-muted-foreground",
};

// Ledger edge: each row carries its status as a colored left rule; NEW is loudest.
const ROW_ACCENT: Record<TicketStatus, string> = {
  NEW: "border-l-primary bg-primary/[0.035]",
  PROCESSING: "border-l-amber-400",
  OPEN: "border-l-sky-500",
  RESOLVED: "border-l-emerald-500",
  CLOSED: "border-l-transparent",
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  NEW: "New",
  PROCESSING: "Processing",
  OPEN: "Open",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
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
    cell: (info) => {
      const id = info.row.original.id;
      return (
        <Link
          to={`/tickets/${id}`}
          className="font-medium text-primary hover:text-primary/80 truncate block"
        >
          {info.getValue()}
        </Link>
      );
    },
  }),
  columnHelper.accessor("senderEmail", {
    header: "From",
    cell: (info) => <span className="text-muted-foreground truncate block">{info.getValue()}</span>,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const status = info.getValue();
      return (
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${STATUS_STYLES[status]}`}
        >
          <span className="size-1.5 rounded-full bg-current" aria-hidden />
          {STATUS_LABELS[status]}
        </span>
      );
    },
  }),
  columnHelper.accessor("category", {
    header: "Category",
    cell: (info) => {
      const cat = info.getValue();
      return cat ? (
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {CATEGORY_LABELS[cat]}
        </span>
      ) : (
        <span className="text-muted-foreground/50">—</span>
      );
    },
  }),
  columnHelper.accessor("agent", {
    header: "Assigned to",
    enableSorting: false,
    cell: (info) => {
      const agent = info.getValue();
      return agent ? (
        <span className="text-muted-foreground truncate block">{agent.name ?? agent.email}</span>
      ) : (
        <span className="text-muted-foreground/50">Unassigned</span>
      );
    },
  }),
  columnHelper.accessor("createdAt", {
    header: "Created",
    cell: (info) => (
      <span className="text-muted-foreground tabular-nums">
        {new Date(info.getValue()).toLocaleDateString()}
      </span>
    ),
  }),
];

export function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [searchParams, setSearchParams] = useSearchParams();
  // Status lives in the URL so the sidebar's status links drive this page.
  const statusFilter = searchParams.get("status") ?? "ALL";
  const setStatusFilter = (value: string) => {
    setSearchParams(
      (prev) => {
        if (value === "ALL") prev.delete("status");
        else prev.set("status", value);
        return prev;
      },
      { replace: true }
    );
  };
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const sortBy = sorting[0]?.id;
  const sortDir = sorting[0] ? (sorting[0].desc ? "desc" : "asc") : undefined;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset to first page when filter configuration changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter, categoryFilter, assigneeFilter, debouncedSearch]);

  const { data: agents } = useQuery({
    queryKey: ["agents"],
    queryFn: () =>
      axios
        .get<{ id: string; name: string | null; email: string }[]>("/api/users/agents")
        .then((r) => r.data),
  });

  const { data: ticketsData, isPending, error } = useQuery({
    queryKey: ["tickets", sortBy, sortDir, statusFilter, categoryFilter, assigneeFilter, debouncedSearch, page, pageSize],
    queryFn: () => {
      const params = {
        sortBy,
        sortDir,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        category: categoryFilter !== "ALL" ? categoryFilter : undefined,
        assignedTo: assigneeFilter !== "ALL" ? assigneeFilter : undefined,
        search: debouncedSearch || undefined,
        page,
        pageSize,
      };
      return axios
        .get<{
          tickets: Ticket[];
          totalCount: number;
          totalPages: number;
          page: number;
          pageSize: number;
        }>("/api/tickets", { params })
        .then((r) => r.data);
    },
  });

  const tickets = ticketsData?.tickets ?? [];
  const totalCount = ticketsData?.totalCount ?? 0;
  const totalPages = Math.max(1, ticketsData?.totalPages ?? 1);

  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const isFiltered = statusFilter !== "ALL" || categoryFilter !== "ALL" || assigneeFilter !== "ALL" || searchQuery;

  return (
    <div className="min-h-screen bg-background md:pl-60">
      <Navbar />
      <div className="max-w-5xl mx-auto p-8">
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tickets</h1>
          <p className="text-sm text-muted-foreground tabular-nums">
            {totalCount} total
          </p>
        </div>

        {error && (
          <p className="text-destructive text-sm mb-4">
            {axiosError(error, "Failed to load tickets")}
          </p>
        )}

        {/* Filters Toolbar */}
        <div className="bg-card rounded-xl border border-border shadow-xs p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search subject, body or sender..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 h-9 text-sm rounded-lg border border-border bg-background hover:bg-muted/50 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/70"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Status Filter */}
            <div className="min-w-[140px]">
              <select
                aria-label="Filter by Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-1.5 h-9 text-sm rounded-lg border border-border bg-card hover:border-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="min-w-[150px]">
              <select
                aria-label="Filter by Category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-1.5 h-9 text-sm rounded-lg border border-border bg-card hover:border-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="GENERAL_QUESTION">General</option>
                <option value="TECHNICAL_QUESTION">Technical</option>
                <option value="REFUND_REQUEST">Refund</option>
                <option value="UNASSIGNED">Unassigned</option>
              </select>
            </div>

            {/* Assignee Filter */}
            <div className="min-w-[165px]">
              <select
                aria-label="Filter by Assignee"
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="w-full px-3 py-1.5 h-9 text-sm rounded-lg border border-border bg-card hover:border-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
              >
                <option value="ALL">All Assignees</option>
                <option value="UNASSIGNED">Unassigned</option>
                {agents?.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name ?? agent.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            {isFiltered && (
              <button
                onClick={() => {
                  setStatusFilter("ALL");
                  setCategoryFilter("ALL");
                  setAssigneeFilter("ALL");
                  setSearchQuery("");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 h-9 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all cursor-pointer border border-transparent hover:border-border"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

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
                  <tr key={headerGroup.id} className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const sorted = header.column.getIsSorted();
                      return (
                        <th key={header.id} className="px-4 py-2.5 font-medium">
                          {canSort ? (
                            <button
                              onClick={header.column.getToggleSortingHandler()}
                              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
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
                    <tr key={i} className="border-b border-border last:border-0">
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
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      {isFiltered ? "No tickets match the selected filters." : "No tickets yet."}
                    </td>
                  </tr>
                )}

                {!isPending &&
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className={`border-b border-border last:border-0 border-l-2 hover:bg-muted/40 transition-colors ${ROW_ACCENT[row.original.status]}`}>
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
          {!isPending && ticketsData && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card rounded-b-xl">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-lg text-foreground bg-card hover:bg-muted/50 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed select-none cursor-pointer transition-all focus:outline-none"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-lg text-foreground bg-card hover:bg-muted/50 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed select-none cursor-pointer transition-all focus:outline-none"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    Showing{" "}
                    <span className="font-semibold text-foreground">
                      {totalCount === 0 ? 0 : (page - 1) * pageSize + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-foreground">
                      {Math.min(page * pageSize, totalCount)}
                    </span>{" "}
                    of <span className="font-semibold text-foreground">{totalCount}</span> results
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  {/* Page Size Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page</span>
                    <select
                      aria-label="Rows per page"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                      className="px-2 py-1 text-xs font-medium rounded-md border border-border bg-card text-foreground hover:border-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <nav className="flex items-center gap-1" aria-label="Pagination">
                    <button
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed select-none cursor-pointer transition-all focus:outline-none"
                      aria-label="First page"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed select-none cursor-pointer transition-all focus:outline-none"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }).map((_, i) => {
                        const pageNum = i + 1;
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= page - 1 && pageNum <= page + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              aria-current={page === pageNum ? "page" : undefined}
                              className={`inline-flex items-center justify-center w-8 h-8 text-sm font-semibold rounded-lg transition-all select-none cursor-pointer focus:outline-none ${
                                page === pageNum
                                  ? "bg-primary text-primary-foreground shadow-xs"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                        if (pageNum === 2 || pageNum === totalPages - 1) {
                          return (
                            <span
                              key={`ellipsis-${pageNum}`}
                              className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium text-muted-foreground/60 select-none"
                            >
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed select-none cursor-pointer transition-all focus:outline-none"
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed select-none cursor-pointer transition-all focus:outline-none"
                      aria-label="Last page"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
