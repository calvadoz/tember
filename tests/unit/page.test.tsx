import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: () => [],
}));

vi.mock("@/lib/db", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/db")>()),
  ensureLocalDatabase: vi.fn().mockResolvedValue(undefined),
}));

import Home from "@/app/page";
import { ensureLocalDatabase } from "@/lib/db";
import { getMessages } from "@/lib/i18n/messages";

const messages = getMessages();

afterEach(() => cleanup());

describe("Home", () => {
  it("opens the local pet journal", async () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      messages.dashboard.heading,
    );
    expect(
      await screen.findByText(messages.dashboard.emptyHeading),
    ).toBeInTheDocument();
    expect(screen.getAllByText(messages.nav.localStatus)).toHaveLength(1);
  });

  it("shows a loader instead of the empty state while local data initializes", async () => {
    let finishInitialization: (() => void) | undefined;
    vi.mocked(ensureLocalDatabase).mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishInitialization = resolve;
      }),
    );

    render(<Home />);

    expect(
      screen.getByRole("status", { name: messages.loading.label }),
    ).toBeVisible();
    expect(
      screen.queryByText(messages.dashboard.emptyHeading),
    ).not.toBeInTheDocument();

    finishInitialization?.();
    expect(
      await screen.findByText(messages.dashboard.emptyHeading),
    ).toBeVisible();
  });
});
