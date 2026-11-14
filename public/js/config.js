// Site configuration.
export const CONFIG = {
  // 'auto'   – use the Node backend when it's there (e.g. Render), otherwise run fully in the browser
  // 'server' – always use the Node backend
  // 'static' – never use the backend (GitHub Pages)
  mode: 'auto',

  // Where name, email and answers are sent when there's no backend (GitHub Pages).
  // Paste your Google Apps Script web-app URL here — see README → "Google Sheet setup".
  // Leave empty to not collect submissions.
  sheetUrl: 'https://script.google.com/macros/s/AKfycbxx7hR623CW-M3U6h9lppOgobpak9qnq8nicTiweODOVn2PpjooUgadKU3cZWirxChA/exec',
};
