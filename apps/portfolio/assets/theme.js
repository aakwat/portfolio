// Runs before the page paints, so a chosen theme never flashes the other one first.
try {
  const theme = localStorage.getItem("theme");
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
} catch {
  // Storage can be blocked (private mode); the system theme then applies.
}
