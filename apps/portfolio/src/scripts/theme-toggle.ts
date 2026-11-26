// Flips between light and dark from whatever is showing now, and remembers the choice.
const root = document.documentElement;
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

type Theme = "light" | "dark";

function current(): Theme {
  const chosen = root.dataset.theme;
  if (chosen === "light" || chosen === "dark") return chosen;
  return systemDark.matches ? "dark" : "light";
}

function label(button: HTMLElement): void {
  button.setAttribute("aria-label", current() === "dark" ? "Switch to light theme" : "Switch to dark theme");
}

for (const button of document.querySelectorAll<HTMLElement>("[data-theme-toggle]")) {
  label(button);
  systemDark.addEventListener("change", () => label(button));
  button.addEventListener("click", () => {
    const next: Theme = current() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage blocked: the switch still applies for this visit.
    }
    label(button);
  });
}
