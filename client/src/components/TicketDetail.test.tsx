import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TicketDetail } from "./TicketDetail";
import type { Ticket } from "@repo/core";

const BASE_TICKET: Ticket = {
  id: "t1",
  subject: "My printer is on fire",
  body: "Please send help.",
  senderEmail: "user@example.com",
  status: "OPEN",
  category: "TECHNICAL_QUESTION",
  createdAt: "2024-03-15T10:00:00.000Z",
  assignedTo: null,
  agent: null,
  replies: [],
};

function renderTicket(overrides: Partial<Ticket> = {}) {
  return render(<TicketDetail ticket={{ ...BASE_TICKET, ...overrides }} />);
}

describe("TicketDetail", () => {
  describe("header fields", () => {
    it("renders the ticket subject", () => {
      renderTicket();
      expect(screen.getByText("My printer is on fire")).toBeInTheDocument();
    });

    it("renders the sender email", () => {
      renderTicket();
      expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });

    it("renders the ticket body", () => {
      renderTicket();
      expect(screen.getByText("Please send help.")).toBeInTheDocument();
    });

    it("renders a formatted created-at date", () => {
      renderTicket();
      const formatted = new Date("2024-03-15T10:00:00.000Z").toLocaleString();
      expect(screen.getByText(formatted)).toBeInTheDocument();
    });
  });

  describe("status badge", () => {
    it("shows 'Open' for OPEN status", () => {
      renderTicket({ status: "OPEN" });
      expect(screen.getByText("Open")).toBeInTheDocument();
    });

    it("shows 'Resolved' for RESOLVED status", () => {
      renderTicket({ status: "RESOLVED" });
      expect(screen.getByText("Resolved")).toBeInTheDocument();
    });

    it("shows 'Closed' for CLOSED status", () => {
      renderTicket({ status: "CLOSED" });
      expect(screen.getByText("Closed")).toBeInTheDocument();
    });
  });

  describe("category badge", () => {
    it("shows 'Technical' for TECHNICAL_QUESTION", () => {
      renderTicket({ category: "TECHNICAL_QUESTION" });
      expect(screen.getByText("Technical")).toBeInTheDocument();
    });

    it("shows 'General' for GENERAL_QUESTION", () => {
      renderTicket({ category: "GENERAL_QUESTION" });
      expect(screen.getByText("General")).toBeInTheDocument();
    });

    it("shows 'Refund' for REFUND_REQUEST", () => {
      renderTicket({ category: "REFUND_REQUEST" });
      expect(screen.getByText("Refund")).toBeInTheDocument();
    });

    it("renders no category badge when category is null", () => {
      renderTicket({ category: null });
      expect(screen.queryByText("Technical")).not.toBeInTheDocument();
      expect(screen.queryByText("General")).not.toBeInTheDocument();
      expect(screen.queryByText("Refund")).not.toBeInTheDocument();
    });
  });
});
