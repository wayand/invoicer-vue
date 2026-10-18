// The invoice PDF is a printed document, so it is always drawn in the light
// theme. The dark theme is switched on by `data-bs-theme="dark"` on <html>
// (see composables/useDarkTheme.js); html2canvas draws from a copy of the page
// and calls this with that copy, so the page the user is looking at is not
// touched.
export const renderInLightTheme = clonedDocument => {
    clonedDocument.documentElement.setAttribute('data-bs-theme', 'light')
}
