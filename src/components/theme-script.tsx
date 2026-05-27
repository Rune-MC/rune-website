const SCRIPT = `(function(){try{var s=localStorage.getItem("rune-theme");var d=s==="dark"||(s===null&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

export function ThemeScript() {
  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: required for no-flash theme application before hydration
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
    />
  );
}
