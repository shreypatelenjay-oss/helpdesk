import { vi, describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor, fireEvent, within } from "@testing-library/react";
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
  describe("loading state", () => {
    it("renders skeleton while fetching", () => {
      mockedAxios.get.mockReturnValue(new Promise(() => {}));
      renderWithQuery(<TicketDetailPage />);
      expect(screen.getByTestId("detail-loading")).toBeInTheDocument();
      expect(screen.queryByText("Test Ticket Subject")).not.toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows error message when ticket fetch fails", async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes("/api/tickets/")) return Promise.reject(new Error("Network error"));
        return Promise.resolve({ data: AGENTS });
      });
      mockedAxios.isAxiosError.mockReturnValue(false);

      renderWithQuery(<TicketDetailPage />);

      await waitFor(() =>
        expect(screen.getByTestId("detail-error")).toBeInTheDocument()
      );
      expect(screen.getByText("Ticket not found")).toBeInTheDocument();
    });

    it("shows axios error message from server response", async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes("/api/tickets/")) {
          const err: any = new Error("Not found");
          err.response = { data: { error: "Ticket does not exist" } };
          return Promise.reject(err);
        }
        return Promise.resolve({ data: AGENTS });
      });
      mockedAxios.isAxiosError.mockReturnValue(true);

      renderWithQuery(<TicketDetailPage />);

      await waitFor(() =>
        expect(screen.getByText("Ticket does not exist")).toBeInTheDocument()
      );
    });
  });

  describe("loaded state", () => {
    beforeEach(() => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes("/api/users/agents")) return Promise.resolve({ data: AGENTS });
        if (url.includes("/api/tickets/")) return Promise.resolve({ data: TICKET });
        return Promise.reject(new Error("Not Found"));
      });
      mockedAxios.patch.mockResolvedValue({ data: TICKET });
    });

    it("renders ticket subject, body, and sender", async () => {
      renderWithQuery(<TicketDetailPage />);

      await waitFor(() =>
        expect(screen.getByText("Test Ticket Subject")).toBeInTheDocument()
      );
      expect(screen.getByText("This is the body of the test ticket.")).toBeInTheDocument();
      expect(screen.getByText("sender@example.com")).toBeInTheDocument();
    });

    it("renders status and category badges", async () => {
      renderWithQuery(<TicketDetailPage />);

      await waitFor(() => screen.getByText("Test Ticket Subject"));
      expect(screen.getAllByText("Open").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Technical").length).toBeGreaterThan(0);
    });

    it("sets correct initial values on all three selects", async () => {
      renderWithQuery(<TicketDetailPage />);

      await waitFor(() => screen.getByText("Test Ticket Subject"));

      expect(screen.getByLabelText("Status")).toHaveValue("OPEN");
      expect(screen.getByLabelText("Category")).toHaveValue("TECHNICAL_QUESTION");
      expect(screen.getByLabelText("Assigned Agent")).toHaveValue("u1");
    });

    it("populates the assignee dropdown with agents", async () => {
      renderWithQuery(<TicketDetailPage />);

      await waitFor(() => screen.getByText("Test Ticket Subject"));

      const assigneeSelect = screen.getByLabelText("Assigned Agent");
      expect(within(assigneeSelect).getByRole("option", { name: "Alice" })).toBeInTheDocument();
      expect(within(assigneeSelect).getByRole("option", { name: "Bob" })).toBeInTheDocument();
    });

    it("patches status when status dropdown changes", async () => {
      renderWithQuery(<TicketDetailPage />);

      await waitFor(() => screen.getByText("Test Ticket Subject"));

      fireEvent.change(screen.getByLabelText("Status"), { target: { value: "RESOLVED" } });

      await waitFor(() =>
        expect(mockedAxios.patch).toHaveBeenCalledWith("/api/tickets/t123", { status: "RESOLVED" })
      );
    });

    it("patches category when category dropdown changes", async () => {
      renderWithQuery(<TicketDetailPage />);

      await waitFor(() => screen.getByText("Test Ticket Subject"));

      fireEvent.change(screen.getByLabelText("Category"), { target: { value: "REFUND_REQUEST" } });

      await waitFor(() =>
        expect(mockedAxios.patch).toHaveBeenCalledWith("/api/tickets/t123", { category: "REFUND_REQUEST" })
      );
    });

    it("patches assignedTo when assignee dropdown changes", async () => {
      renderWithQuery(<TicketDetailPage />);

      await waitFor(() => screen.getByText("Test Ticket Subject"));

      fireEvent.change(screen.getByLabelText("Assigned Agent"), { target: { value: "u2" } });

      await waitFor(() =>
        expect(mockedAxios.patch).toHaveBeenCalledWith("/api/tickets/t123", { assignedTo: "u2" })
      );
    });

    it("sends null assignedTo when unassigning", async () => {
      renderWithQuery(<TicketDetailPage />);

      await waitFor(() => screen.getByText("Test Ticket Subject"));

      fireEvent.change(screen.getByLabelText("Assigned Agent"), { target: { value: "UNASSIGNED" } });

      await waitFor(() =>
        expect(mockedAxios.patch).toHaveBeenCalledWith("/api/tickets/t123", { assignedTo: null })
      );
    });

    it("sends null category when unassigning category", async () => {
      renderWithQuery(<TicketDetailPage />);

      await waitFor(() => screen.getByText("Test Ticket Subject"));

      fireEvent.change(screen.getByLabelText("Category"), { target: { value: "UNASSIGNED" } });

      await waitFor(() =>
        expect(mockedAxios.patch).toHaveBeenCalledWith("/api/tickets/t123", { category: null })
      );
    });

    it("shows patch error message when update fails", async () => {
      const err: any = new Error("Bad request");
      err.response = { data: { error: "Assigned agent not found" } };
      mockedAxios.patch.mockRejectedValue(err);
      mockedAxios.isAxiosError.mockReturnValue(true);

      renderWithQuery(<TicketDetailPage />);

      await waitFor(() => screen.getByText("Test Ticket Subject"));

      fireEvent.change(screen.getByLabelText("Assigned Agent"), { target: { value: "u2" } });

      await waitFor(() =>
        expect(screen.getByText("Assigned agent not found")).toBeInTheDocument()
      );
    });
  });

  describe("unassigned ticket", () => {
    it("shows UNASSIGNED for category and assignee when both are null", async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes("/api/users/agents")) return Promise.resolve({ data: AGENTS });
        if (url.includes("/api/tickets/")) {
          return Promise.resolve({
            data: { ...TICKET, category: null, assignedTo: null, agent: null },
          });
        }
        return Promise.reject(new Error("Not Found"));
      });

      renderWithQuery(<TicketDetailPage />);

      await waitFor(() => screen.getByText("Test Ticket Subject"));

      expect(screen.getByLabelText("Category")).toHaveValue("UNASSIGNED");
      expect(screen.getByLabelText("Assigned Agent")).toHaveValue("UNASSIGNED");
    });
  });
});
