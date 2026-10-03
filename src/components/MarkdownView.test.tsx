import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import MarkdownView from "./MarkdownView";

describe("MarkdownView", () => {
  it("formata negrito, lista e código como a resposta da IA espera", () => {
    const { container } = render(
      <MarkdownView>{"**Setor:** Gastronomia\n\n* um\n* dois\n\nUse `select 1`."}</MarkdownView>,
    );

    expect(container.querySelector("strong")?.textContent).toBe("Setor:");
    expect(container.querySelectorAll("li")).toHaveLength(2);
    expect(container.querySelector("code")?.textContent).toBe("select 1");
    expect(container.textContent).not.toContain("**");
  });

  it("não interpreta HTML vindo do texto (sem script, sem imagem, sem handlers)", () => {
    const { container } = render(
      <MarkdownView>{'<script>alert(1)</script><img src=x onerror="alert(1)"><b>x</b> texto'}</MarkdownView>,
    );

    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
  });

  it("links abrem em outra aba sem passar o opener", () => {
    render(<MarkdownView>{"[site](https://exemplo.com)"}</MarkdownView>);

    const link = screen.getByRole("link", { name: "site" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("javascript: em link não vira link clicável", () => {
    render(<MarkdownView>{"[clique](javascript:alert(1))"}</MarkdownView>);

    const link = screen.queryByRole("link", { name: "clique" });
    expect(link?.getAttribute("href") ?? "").not.toMatch(/^javascript:/i);
  });
});
