// משחזר את הכתובת המקורית אחרי ההפניה מ-public/404.html (GitHub Pages)
export function restoreSpaRedirect(): void {
  const l = window.location
  if (l.search[1] !== '/') return
  const decoded = l.search
    .slice(1)
    .split('&')
    .map(s => s.replace(/~and~/g, '&'))
    .join('?')
  window.history.replaceState(null, '', l.pathname.slice(0, -1) + decoded + l.hash)
}
