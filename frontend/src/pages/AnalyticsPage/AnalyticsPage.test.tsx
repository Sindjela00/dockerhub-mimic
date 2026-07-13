import * as logsApi from "../../services/admin/logs.api";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";

import AnalyticsPage from "./AnalyticsPage";
import { renderWithProviders } from "../../test/test.utils";
import userEvent from "@testing-library/user-event";

const searchLogsSpy = vi.spyOn(logsApi, "searchLogs");

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  searchLogsSpy.mockResolvedValue({
    data: { total: 0, entries: [] },
  } as any);
});

describe("AnalyticsPage", () => {
  it("renderuje formu za pretragu sa filterima", async () => {
    renderWithProviders(<AnalyticsPage />);

    await waitFor(() => expect(searchLogsSpy).toHaveBeenCalled());

    expect(screen.getByLabelText(/message contains/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/from/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/to/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Error" }),
    ).toBeInTheDocument();
  });

  it("filtrira po nivou klikom na dugme i prikazuje aktivan filter", async () => {
    searchLogsSpy.mockResolvedValue({
      data: {
        total: 1,
        entries: [
          {
            timestamp: "2026-07-05T10:00:00Z",
            level: "Error",
            message: "boom",
            score: 1.5,
          },
        ],
      },
    } as any);

    const user = userEvent.setup();
    renderWithProviders(<AnalyticsPage />);

    await waitFor(() => expect(searchLogsSpy).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: "Error" }));

    await waitFor(() =>
      expect(searchLogsSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ query: "level:error" }),
      ),
    );
    await waitFor(() => expect(screen.getByText("boom")).toBeInTheDocument());
    expect(screen.getByText("Active filters:")).toBeInTheDocument();
    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });

  it("pretrazuje tekst poruke sa debounce-om", async () => {
    searchLogsSpy.mockResolvedValue({
      data: {
        total: 1,
        entries: [
          {
            timestamp: "2026-07-05T09:00:00Z",
            level: "Warning",
            message: "careful",
            score: 1.0,
          },
        ],
      },
    } as any);

    const user = userEvent.setup();
    renderWithProviders(<AnalyticsPage />);

    await waitFor(() => expect(searchLogsSpy).toHaveBeenCalled());

    await user.type(screen.getByLabelText(/message contains/i), "careful");

    await waitFor(() =>
      expect(searchLogsSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ query: '"careful"' }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByText("careful")).toBeInTheDocument(),
    );
  });

  it("koristi napredni upit kada je ukljucen", async () => {
    searchLogsSpy.mockResolvedValueOnce({
      data: { total: 0, entries: [] },
    } as any);
    searchLogsSpy.mockResolvedValueOnce({
      data: {
        total: 2,
        entries: [
          {
            timestamp: "2026-07-05T10:00:00Z",
            level: "Error",
            message: "boom",
            score: 1.5,
          },
          {
            timestamp: "2026-07-05T09:00:00Z",
            level: "Warning",
            message: "careful",
            score: 1.0,
          },
        ],
      },
    } as any);

    const user = userEvent.setup();
    renderWithProviders(<AnalyticsPage />);

    await waitFor(() => expect(searchLogsSpy).toHaveBeenCalled());

    await user.click(
      screen.getByRole("button", { name: /advanced query/i }),
    );
    await user.type(
      screen.getByLabelText(/advanced query/i),
      '(level:warning OR level:error) AND "boom"',
    );
    await user.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() => expect(screen.getByText("boom")).toBeInTheDocument());
    expect(screen.getByText("careful")).toBeInTheDocument();
    expect(screen.getByText("Results (2)")).toBeInTheDocument();
    expect(searchLogsSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        query: '(level:warning OR level:error) AND "boom"',
      }),
    );
  });

  it("prikazuje gresku kada pretraga ne uspe", async () => {
    searchLogsSpy.mockResolvedValueOnce({
      data: { total: 0, entries: [] },
    } as any);
    searchLogsSpy.mockRejectedValueOnce({
      response: { data: { message: "Unknown field 'host'." } },
    });

    const user = userEvent.setup();
    renderWithProviders(<AnalyticsPage />);

    await waitFor(() => expect(searchLogsSpy).toHaveBeenCalled());

    await user.click(
      screen.getByRole("button", { name: /advanced query/i }),
    );
    await user.type(screen.getByLabelText(/advanced query/i), "host:server1");
    await user.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() =>
      expect(screen.getByText("Unknown field 'host'.")).toBeInTheDocument(),
    );
  });

  it("prikazuje prazno stanje kada nema rezultata", async () => {
    renderWithProviders(<AnalyticsPage />);

    await waitFor(() =>
      expect(
        screen.getByText(/no log entries found/i),
      ).toBeInTheDocument(),
    );
  });
});
