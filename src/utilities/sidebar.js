
import PerfectScrollbar from 'perfect-scrollbar';

export const isDesktop = (window) => window.innerWidth > 1200

/**
 * Calculate nested children height in sidebar menu
* @param {HTMLElement} el 
*/
export const calculateChildrenHeight = (el, deep = false) => {
    const children = el.children
    
    let height = 0
    for(let i = 0; i < el.childElementCount; i++) {
        const child = children[i]
        height += child.querySelector('.submenu-link').clientHeight

        // 2-level menu
        if(deep && child.classList.contains('has-sub')) {
            const subsubmenu = child.querySelector('.submenu')

            if(subsubmenu.classList.contains('submenu-open')) {
                const childrenHeight =  ~~[...subsubmenu.querySelectorAll('.submenu-link')].reduce((acc,curr) => acc + curr.clientHeight,0)
                height += childrenHeight
            }
        }
    }
    el.style.setProperty('--submenu-height', height + 'px')
    return height
}

/**
 * a Sidebar component
 * @param  {HTMLElement} el - sidebar element
 * @param  {object} options={} - options
 */
export class Sidebar {
    constructor(el, options = {}) {
        this.sidebarEL = el instanceof HTMLElement ? el : document.querySelector(el)
        this.options = options
        this.init()
    }

    /**
     * initialize the sidebar
     */
    init() {
        // add event listener to sidebar
        document
            .querySelectorAll(".burger-btn")
            .forEach((el) => el.addEventListener("click", this.toggle.bind(this)))
        document
            .querySelectorAll(".sidebar-hide")
            .forEach((el) => el.addEventListener("click", this.toggle.bind(this)))
        window.addEventListener("resize", this.onResize.bind(this))

        
        const toggleSubmenu = (el) => {
            if (el.classList.contains("submenu-open")) {
                el.classList.remove('submenu-open')
                el.classList.add('submenu-closed')
            } else {
                el.classList.remove("submenu-closed")
                el.classList.add("submenu-open")
            }
        }


        let sidebarItems = document.querySelectorAll(".sidebar-item.has-sub")
        for (var i = 0; i < sidebarItems.length; i++) {
            let sidebarItem = sidebarItems[i]
            
            sidebarItems[i]
                .querySelector(".sidebar-link")
                .addEventListener("click", (e) => {
                    e.preventDefault()
                    let submenu = sidebarItem.querySelector(".submenu")
                    toggleSubmenu(submenu)
                })
            
            
            // If submenu has submenu
            const submenuItems = sidebarItem.querySelectorAll('.submenu-item.has-sub') 
            submenuItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    const submenuLevelTwo = item.querySelector('.submenu')
                    toggleSubmenu(submenuLevelTwo)
                    
                    // Pass second .submenu
                    const height = calculateChildrenHeight(item.parentElement, true)
                    console.log('submenu has submenu -> line no. 94 :', height, 'e:', e)
                })
            })
        }

        // all a tag link with class submenu-link
        const links = this.sidebarEL.querySelectorAll('.submenu-link')
        links.forEach(link => {
            link.addEventListener('click', () => {
                const linkSubmenu = link.closest('.submenu')
                linkSubmenu.classList.remove("submenu-closed")
                linkSubmenu.classList.add("submenu-open")
            })
        })

        // Perfect Scrollbar Init
        if (typeof PerfectScrollbar == "function") {
            const container = document.querySelector(".sidebar-wrapper")
            const ps = new PerfectScrollbar(container, {
                wheelPropagation: false,
            })
            console.log('utilities/sidebar.js 105. UnUsed ps: ', ps)
        }

        // Scroll into active sidebar
        setTimeout(() => {
            //this.forceElementVisibility(document.querySelector(".sidebar-item.active"))
            this.forceElementVisibility(this.sidebarEL)
        }, 300)

    }

    /**
     * On Sidebar Rezise Event
     */
    onResize() {
        if (isDesktop(window)) {
            this.sidebarEL.classList.add("active")
        } else {
            this.sidebarEL.classList.remove("active")
        }

        // reset
        this.deleteBackdrop()
        this.toggleOverflowBody(true)
    }

    /**
     * Toggle Sidebar
     */
    toggle() {
        const sidebarState = this.sidebarEL.classList.contains("active")
        if (sidebarState) {
            this.hide()
        } else {
            this.show()
        }
    }

    /**
     * Show Sidebar
     */
    show() {
        this.sidebarEL.classList.add("active")
        this.sidebarEL.classList.remove("inactive")
        this.createBackdrop()
        this.toggleOverflowBody()
    }

    /**
     * Hide Sidebar
     */
    hide() {
        this.sidebarEL.classList.remove("active")
        this.sidebarEL.classList.add("inactive")
        this.deleteBackdrop()
        this.toggleOverflowBody()
    }

    /**
     * Create Sidebar Backdrop
     */
    createBackdrop() {
        if (isDesktop(window)) return
        this.deleteBackdrop()
        const backdrop = document.createElement("div")
        backdrop.classList.add("sidebar-backdrop")
        backdrop.addEventListener("click", this.hide.bind(this))
        document.body.appendChild(backdrop)
    }

    /**
     * Delete Sidebar Backdrop
     */
    deleteBackdrop() {
        const backdrop = document.querySelector(".sidebar-backdrop")
        if (backdrop) {
            backdrop.remove()
        }
    }

    /**
     * Toggle Overflow Body
     */
    toggleOverflowBody(active) {
        if(isDesktop(window)) return;
        const sidebarState = this.sidebarEL.classList.contains("active")
        const body = document.querySelector("body")
        if (typeof active == "undefined") {
            body.style.overflowY = sidebarState ? "hidden" : "auto"
        } else {
            body.style.overflowY = active ? "auto" : "hidden"
        }
    }

    isElementInViewport(el) {
        var rect = el.getBoundingClientRect()

        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <=
                (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        )
    }

    forceElementVisibility(el) {
        if (!this.isElementInViewport(el)) {
            el.scrollIntoView(false)
        }
    }
}

export const onFirstLoad = (sidebarEL) => {
    if(!sidebarEL) return
    if (isDesktop(window)) {
        sidebarEL.classList.add("active")
        sidebarEL.classList.add('sidebar-desktop')
    }

    // Get submenus size
    let submenus = document.querySelectorAll(".sidebar-item.has-sub .submenu")
    for (var i = 0; i < submenus.length; i++) {
        let submenu = submenus[i]
        const sidebarItem = submenu.parentElement
        const height = submenu.clientHeight
        console.log('utilities/sidebar.js 229. UnUsed height: ', height)

        if(sidebarItem.classList.contains('active')) submenu.classList.add('submenu-open')
        else submenu.classList.add('submenu-closed')
        setTimeout(() => {
            const height = calculateChildrenHeight(submenu, true)
            console.log('utilities/sidebar.js 235. UnUsed height: ', height)
        }, 50);
    }
}

export const init = (sidebarEl) => {
    onFirstLoad(sidebarEl)
    
    /**
     * Create Sidebar Wrapper
     */
    if (sidebarEl) {
        window.sidebar = new Sidebar(sidebarEl)
    }
}