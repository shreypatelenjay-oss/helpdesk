import { jsx as _jsx } from "react/jsx-runtime";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { TicketDetailPage } from "./TicketDetailPage";
import { renderWithQuery } from "../test/render";
vi.mock("axios");
vi.mock("../components/Navbar", () => ({ Navbar: () => _jsx("nav", {}) }));
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
    replies: [],
};
const AGENT_REPLY = {
    id: "r1",
    body: "We are looking into this.",
    senderType: "AGENT",
    sentAt: "2024-02-01T13:00:00.000Z",
};
const CUSTOMER_REPLY = {
    id: "r2",
    body: "Thanks for the update!",
    senderType: "CUSTOMER",
    sentAt: "2024-02-01T14:00:00.000Z",
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
            mockedAxios.get.mockReturnValue(new Promise(() => { }));
            renderWithQuery(_jsx(TicketDetailPage, {}));
            expect(screen.getByTestId("detail-loading")).toBeInTheDocument();
            expect(screen.queryByText("Test Ticket Subject")).not.toBeInTheDocument();
        });
    });
    describe("error state", () => {
        it("shows error message when ticket fetch fails", async () => {
            mockedAxios.get.mockImplementation((url) => {
                if (url.includes("/api/tickets/"))
                    return Promise.reject(new Error("Network error"));
                return Promise.resolve({ data: AGENTS });
            });
            mockedAxios.isAxiosError.mockReturnValue(false);
            renderWithQuery(_jsx(TicketDetailPage, {}));
            await waitFor(() => expect(screen.getByTestId("detail-error")).toBeInTheDocument());
            expect(screen.getByText("Ticket not found")).toBeInTheDocument();
        });
        it("shows axios error message from server response", async () => {
            mockedAxios.get.mockImplementation((url) => {
                if (url.includes("/api/tickets/")) {
                    const err = new Error("Not found");
                    err.response = { data: { error: "Ticket does not exist" } };
                    return Promise.reject(err);
                }
                return Promise.resolve({ data: AGENTS });
            });
            mockedAxios.isAxiosError.mockReturnValue(true);
            renderWithQuery(_jsx(TicketDetailPage, {}));
            await waitFor(() => expect(screen.getByText("Ticket does not exist")).toBeInTheDocument());
        });
    });
    describe("loaded state", () => {
        beforeEach(() => {
            mockedAxios.get.mockImplementation((url) => {
                if (url.includes("/api/users/agents"))
                    return Promise.resolve({ data: AGENTS });
                if (url.includes("/api/tickets/"))
                    return Promise.resolve({ data: TICKET });
                return Promise.reject(new Error("Not Found"));
            });
            mockedAxios.patch.mockResolvedValue({ data: TICKET });
        });
        it("renders ticket subject, body, and sender", async () => {
            renderWithQuery(_jsx(TicketDetailPage, {}));
            await waitFor(() => expect(screen.getByText("Test Ticket Subject")).toBeInTheDocument());
            expect(screen.getByText("This is the body of the test ticket.")).toBeInTheDocument();
            expect(screen.getByText("sender@example.com")).toBeInTheDocument();
        });
        it("renders status and category badges", async () => {
            renderWithQuery(_jsx(TicketDetailPage, {}));
            await waitFor(() => screen.getByText("Test Ticket Subject"));
            expect(screen.getAllByText("Open").length).toBeGreaterThan(0);
            expect(screen.getAllByText("Technical").length).toBeGreaterThan(0);
        });
        it("sets correct initial values on all three selects", async () => {
            renderWithQuery(_jsx(TicketDetailPage, {}));
            // wait for both ticket and agents to load
            await waitFor(() => screen.getByText("Test Ticket Subject"));
            await waitFor(() => within(screen.getByLabelText("Assigned Agent")).getByRole("option", { name: "Alice" }));
            expect(screen.getByLabelText("Status")).toHaveValue("OPEN");
            expect(screen.getByLabelText("Category")).toHaveValue("TECHNICAL_QUESTION");
            expect(screen.getByLabelText("Assigned Agent")).toHaveValue("u1");
        });
        it("populates the assignee dropdown with agents", async () => {
            renderWithQuery(_jsx(TicketDetailPage, {}));
            await waitFor(() => screen.getByText("Test Ticket Subject"));
            await waitFor(() => within(screen.getByLabelText("Assigned Agent")).getByRole("option", { name: "Alice" }));
            const assigneeSelect = screen.getByLabelText("Assigned Agent");
            expect(within(assigneeSelect).getByRole("option", { name: "Alice" })).toBeInTheDocument();
            expect(within(assigneeSelect).getByRole("option", { name: "Bob" })).toBeInTheDocument();
        });
        it("patches status when status dropdown changes", async () => {
            renderWithQuery(_jsx(TicketDetailPage, {}));
            await waitFor(() => screen.getByText("Test Ticket Subject"));
            fireEvent.change(screen.getByLabelText("Status"), { target: { value: "RESOLVED" } });
            await waitFor(() => expect(mockedAxios.patch).toHaveBeenCalledWith("/api/tickets/t123", { status: "RESOLVED" }));
        });
        it("patches category when category dropdown changes", async () => {
            renderWithQuery(_jsx(TicketDetailPage, {}));
            await waitFor(() => screen.getByText("Test Ticket Subject"));
            fireEvent.change(screen.getByLabelText("Category"), { target: { value: "REFUND_REQUEST" } });
            await waitFor(() => expect(mockedAxios.patch).toHaveBeenCalledWith("/api/tickets/t123", { category: "REFUND_REQUEST" }));
        });
        it("patches assignedTo when assignee dropdown changes", async () => {
            renderWithQuery(_jsx(TicketDetailPage, {}));
            await waitFor(() => screen.getByText("Test Ticket Subject"));
            await waitFor(() => within(screen.getByLabelText("Assigned Agent")).getByRole("option", { name: "Bob" }));
            fireEvent.change(screen.getByLabelText("Assigned Agent"), { target: { value: "u2" } });
            await waitFor(() => expect(mockedAxios.patch).toHaveBeenCalledWith("/api/tickets/t123", { assignedTo: "u2" }));
        });
        it("sends null assignedTo when unassigning", async () => {
            renderWithQuery(_jsx(TicketDetailPage, {}));
            await waitFor(() => screen.getByText("Test Ticket Subject"));
            fireEvent.change(screen.getByLabelText("Assigned Agent"), { target: { value: "UNASSIGNED" } });
            await waitFor(() => expect(mockedAxios.patch).toHaveBeenCalledWith("/api/tickets/t123", { assignedTo: null }));
        });
        it("sends null category when unassigning category", async () => {
            renderWithQuery(_jsx(TicketDetailPage, {}));
            await waitFor(() => screen.getByText("Test Ticket Subject"));
            fireEvent.change(screen.getByLabelText("Category"), { target: { value: "UNASSIGNED" } });
            await waitFor(() => expect(mockedAxios.patch).toHaveBeenCalledWith("/api/tickets/t123", { category: null }));
        });
        it("shows patch error message when update fails", async () => {
            const err = new Error("Bad request");
            err.response = { data: { error: "Assigned agent not found" } };
            mockedAxios.patch.mockRejectedValue(err);
            mockedAxios.isAxiosError.mockReturnValue(true);
            renderWithQuery(_jsx(TicketDetailPage, {}));
            await waitFor(() => screen.getByText("Test Ticket Subject"));
            fireEvent.change(screen.getByLabelText("Assigned Agent"), { target: { value: "u2" } });
            await waitFor(() => expect(screen.getByText("Assigned agent not found")).toBeInTheDocument());
        });
    });
    describe("unassigned ticket", () => {
        it("shows UNASSIGNED for category and assignee when both are null", async () => {
            mockedAxios.get.mockImplementation((url) => {
                if (url.includes("/api/users/agents"))
                    return Promise.resolve({ data: AGENTS });
                if (url.includes("/api/tickets/")) {
                    return Promise.resolve({
                        data: { ...TICKET, category: null, assignedTo: null, agent: null },
                    });
                }
                return Promise.reject(new Error("Not Found"));
            });
            renderWithQuery(_jsx(TicketDetailPage, {}));
            await waitFor(() => screen.getByText("Test Ticket Subject"));
            expect(screen.getByLabelText("Category")).toHaveValue("UNASSIGNED");
            expect(screen.getByLabelText("Assigned Agent")).toHaveValue("UNASSIGNED");
        });
    });
});
describe("TicketDetailPage — reply thread", () => {
    function mockGetWith(ticket) {
        mockedAxios.get.mockImplementation((url) => {
            if (url.includes("/api/users/agents"))
                return Promise.resolve({ data: AGENTS });
            return Promise.resolve({ data: ticket });
        });
    }
    beforeEach(() => {
        vi.clearAllMocks();
        mockedAxios.patch.mockResolvedValue({ data: TICKET });
    });
    it("shows 'No replies yet.' when the reply list is empty", async () => {
        mockGetWith(TICKET);
        renderWithQuery(_jsx(TicketDetailPage, {}));
        await waitFor(() => screen.getByText("Test Ticket Subject"));
        expect(screen.getByText("No replies yet.")).toBeInTheDocument();
    });
    it("renders an agent reply with 'Agent' label", async () => {
        mockGetWith({ ...TICKET, replies: [AGENT_REPLY] });
        renderWithQuery(_jsx(TicketDetailPage, {}));
        await waitFor(() => screen.getByText("Test Ticket Subject"));
        expect(screen.getByText("We are looking into this.")).toBeInTheDocument();
        expect(screen.getByText(/^Agent ·/)).toBeInTheDocument();
    });
    it("renders a customer reply with 'Customer' label", async () => {
        mockGetWith({ ...TICKET, replies: [CUSTOMER_REPLY] });
        renderWithQuery(_jsx(TicketDetailPage, {}));
        await waitFor(() => screen.getByText("Test Ticket Subject"));
        expect(screen.getByText("Thanks for the update!")).toBeInTheDocument();
        expect(screen.getByText(/Customer/)).toBeInTheDocument();
    });
    it("renders multiple replies in order", async () => {
        mockGetWith({ ...TICKET, replies: [AGENT_REPLY, CUSTOMER_REPLY] });
        renderWithQuery(_jsx(TicketDetailPage, {}));
        await waitFor(() => screen.getByText("Test Ticket Subject"));
        // both reply bodies should appear, first agent then customer
        const allText = screen.getByTestId("reply-thread").textContent ?? "";
        const agentIdx = allText.indexOf("We are looking into this.");
        const customerIdx = allText.indexOf("Thanks for the update!");
        expect(agentIdx).toBeGreaterThanOrEqual(0);
        expect(customerIdx).toBeGreaterThan(agentIdx);
    });
});
describe("TicketDetailPage — reply form", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedAxios.get.mockImplementation((url) => {
            if (url.includes("/api/users/agents"))
                return Promise.resolve({ data: AGENTS });
            return Promise.resolve({ data: TICKET });
        });
        mockedAxios.patch.mockResolvedValue({ data: TICKET });
    });
    it("renders the reply textarea and submit button", async () => {
        renderWithQuery(_jsx(TicketDetailPage, {}));
        await waitFor(() => screen.getByText("Test Ticket Subject"));
        expect(screen.getByTestId("reply-input")).toBeInTheDocument();
        expect(screen.getByTestId("reply-submit")).toBeInTheDocument();
    });
    it("shows a validation error and does not POST when submitting an empty reply", async () => {
        renderWithQuery(_jsx(TicketDetailPage, {}));
        await waitFor(() => screen.getByText("Test Ticket Subject"));
        await userEvent.click(screen.getByTestId("reply-submit"));
        await waitFor(() => expect(screen.getByText("Reply cannot be empty")).toBeInTheDocument());
        expect(mockedAxios.post).not.toHaveBeenCalled();
    });
    it("POSTs to /api/tickets/:id/reply with the reply body", async () => {
        mockedAxios.post.mockResolvedValue({ data: AGENT_REPLY });
        renderWithQuery(_jsx(TicketDetailPage, {}));
        await waitFor(() => screen.getByText("Test Ticket Subject"));
        await userEvent.type(screen.getByTestId("reply-input"), "We are looking into this.");
        await userEvent.click(screen.getByTestId("reply-submit"));
        await waitFor(() => expect(mockedAxios.post).toHaveBeenCalledWith("/api/tickets/t123/reply", {
            body: "We are looking into this.",
        }));
    });
    it("clears the textarea after a successful submission", async () => {
        mockedAxios.post.mockResolvedValue({ data: AGENT_REPLY });
        renderWithQuery(_jsx(TicketDetailPage, {}));
        await waitFor(() => screen.getByText("Test Ticket Subject"));
        const textarea = screen.getByTestId("reply-input");
        await userEvent.type(textarea, "Some reply");
        await userEvent.click(screen.getByTestId("reply-submit"));
        await waitFor(() => expect(textarea.value).toBe(""));
    });
    it("shows a server error message when the POST fails", async () => {
        const err = new Error("Server error");
        err.response = { data: { error: "Failed to send reply" } };
        mockedAxios.post.mockRejectedValue(err);
        mockedAxios.isAxiosError.mockReturnValue(true);
        renderWithQuery(_jsx(TicketDetailPage, {}));
        await waitFor(() => screen.getByText("Test Ticket Subject"));
        await userEvent.type(screen.getByTestId("reply-input"), "Hello");
        await userEvent.click(screen.getByTestId("reply-submit"));
        await waitFor(() => expect(screen.getByText("Failed to send reply")).toBeInTheDocument());
    });
    it("disables the submit button while the mutation is in flight", async () => {
        let resolve;
        mockedAxios.post.mockReturnValue(new Promise((r) => { resolve = r; }));
        renderWithQuery(_jsx(TicketDetailPage, {}));
        await waitFor(() => screen.getByText("Test Ticket Subject"));
        await userEvent.type(screen.getByTestId("reply-input"), "Hello");
        await userEvent.click(screen.getByTestId("reply-submit"));
        await waitFor(() => expect(screen.getByTestId("reply-submit")).toBeDisabled());
        resolve({ data: AGENT_REPLY });
    });
});
