export const UseSetTheme = (theme, isDarkMode, persist=false) => {
    document.body.classList.add(theme)
    document.documentElement.setAttribute('data-bs-theme', theme)
    if (typeof isDarkMode !== 'undefined') isDarkMode.value = theme==='dark' ? true : false
    if (persist) {
        localStorage.setItem('theme', theme)
    }
}

export const UseInitTheme = (isDarkMode) => {
    const storedTheme = localStorage.getItem('theme')
    if (storedTheme) {
        UseSetTheme(storedTheme, isDarkMode)
    }

    if (!window.matchMedia) {
        console.log('no window.matchMedia')
        return
    }
    //Media query to detect dark preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    if (!storedTheme && mediaQuery) {
        UseSetTheme(mediaQuery.matches ? "dark" : "light", isDarkMode, true)
    }

    //Register change listener
    mediaQuery.addEventListener("change", (e) => {
        UseSetTheme(e.matches ? "dark" : "light", isDarkMode, true)
    })
}