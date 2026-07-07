export function ThemeScript() {
  const script = `
(() => {
  try {
    const theme = window.localStorage.getItem("lablens-theme");
    if (theme === "light" || theme === "dark") {
      document.documentElement.dataset.theme = theme;
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  } catch {}
})();
`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
