import { type ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "@multica/core/i18n/react";
import enCommon from "../../locales/en/common.json";
import enAgents from "../../locales/en/agents.json";
import { DiffViewer } from "./diff-viewer";

const TEST_RESOURCES = {
  en: {
    common: enCommon,
    agents: enAgents,
  },
};

function I18nWrapper({ children }: { children: ReactNode }) {
  return (
    <I18nProvider locale="en" resources={TEST_RESOURCES}>
      {children}
    </I18nProvider>
  );
}

describe("DiffViewer", () => {
  it("renders unified diff and switches to split mode", async () => {
    const user = userEvent.setup();
    render(
      <DiffViewer
        output={[
          "--- a/file.txt",
          "+++ b/file.txt",
          "@@ -1 +1 @@",
          "-old line",
          "+new line",
        ].join("\n")}
      />,
      { wrapper: I18nWrapper },
    );

    expect(screen.getByText("Unified")).toBeInTheDocument();
    expect(screen.getByText("Split")).toBeInTheDocument();
    expect(screen.getByText("-old line")).toBeInTheDocument();
    expect(screen.getByText("+new line")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Split" }));

    expect(screen.getByText("old line")).toBeInTheDocument();
    expect(screen.getByText("new line")).toBeInTheDocument();
  });

  it("shows placeholder when no visual diff can be parsed", () => {
    render(<DiffViewer output="patched successfully" />, { wrapper: I18nWrapper });

    expect(
      screen.getByText("No visual diff available for this file change."),
    ).toBeInTheDocument();
  });
});
