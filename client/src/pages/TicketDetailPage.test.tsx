import { vi, describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import axios from "axios";
import { TicketDetailPage } from "./TicketDetailPage";
import { renderWithQuery } from "../test/render";

vi.mock("axios");
vi.mock("../components/Navbar", () => ({ Navbar: () => <nav /> }));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "t123" }),
  };
});

const mockedAxios = vi.mocked(axios, true);

const TICKET = {
  id: "t123",
  subject: "Test Ticket Subject",
  body: "This is the body of the test ticket.",
  senderEmail: "sender@example.com",
  status: "OPEN",
  category: "TECHNICAL_QUESTION",
  createdAt: "2024-02-01T12:00:00.000Z",
  assignedTo: "u1",
  agent: { id: "u1", name: "Alice", email: "alice@example.com" },
};

const AGENTS = [
  { id: "u1", name: "Alice", email: "alice@example.com" },
  { id: "u2", name: "Bob", email: "bob@example.com" },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TicketDetailPage", () => {
  beforeEach(() => {
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes("/api/users/agents")) {
        return Promise.resolve({ data: AGENTS });
      }
      if (url.includes("/api/tickets/t123")) {
        return Promise.resolve({ data: TICKET });
      }
      return Promise.reject(new Error("Not Found"));
    });

    mockedAxios.patch.mockResolvedValue({ data: TICKET });
  });

  it("renders ticket details correctly", async () => {
    renderWithQuery(<TicketDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Ticket Subject")).toBeInTheDocument();
    });

    expect(screen.getByText("This is the body of the test ticket.")).toBeInTheDocument();
    expect(screen.getByText("sender@example.com")).toBeInTheDocument();
    expect(screen.getAllByText("Open").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Technical").length).toBeGreaterThan(0);
  });

  it("updates ticket status when status dropdown is changed", async () => {
    renderWithQuery(<TicketDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Ticket Subject")).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText("Status");
    fireEvent.change(statusSelect, { target: { value: "RESOLVED" } });

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith("/api/tickets/t123", { status: "RESOLVED" });
    });
  });

  it("updates ticket category when category dropdown is changed", async () => {
    renderWithQuery(<TicketDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Ticket Subject")).toBeInTheDocument();
    });

    const categorySelect = screen.getByLabelText("Category");
    fireEvent.change(categorySelect, { target: { value: "REFUND_REQUEST" } });

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith("/api/tickets/t123", { category: "REFUND_REQUEST" });
    });
  });

  it("updates ticket assignee when assignee dropdown is changed", async () => {
    renderWithQuery(<TicketDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Ticket Subject")).toBeInTheDocument();
    });

    const assigneeSelect = screen.getByLabelText("Assigned Agent");
    fireEvent.change(assigneeSelect, { target: { value: "u2" } });

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith("/api/tickets/t123", { assignedTo: "u2" });
    });
  });
});
