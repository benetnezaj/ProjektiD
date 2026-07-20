/* ==========================================================================
   Project Guard, Session Timer & Initialization Helpers
   ========================================================================== */

// 1. Check if the session has completely expired (30 minutes)
const sessionExpiry = sessionStorage.getItem("sessionExpiry");
const currentTime = new Date().getTime();

if (sessionExpiry && currentTime > Number(sessionExpiry)) {
    // Session is dead! Log them out and wipe page memory so they start over next time
    sessionStorage.removeItem("loggedIn");
    sessionStorage.removeItem("sessionExpiry");
    localStorage.removeItem("currentSheet");
    localStorage.removeItem("currentMobilePage");
}

// 2. Redirect guard if not logged in
if (sessionStorage.getItem("loggedIn") !== "true") {
    window.location.href = "index.html";
} else {
    // If they are logged in but don't have an expiry set yet, set it now (30 mins from now)
    if (!sessionStorage.getItem("sessionExpiry")) {
        const thirtyMinutes = 30 * 60 * 1000; 
        sessionStorage.setItem("sessionExpiry", (currentTime + thirtyMinutes).toString());
    }
}

let desktopAnimating = false;
let mobileAnimating = false;

/* ==========================================================================
   Desktop Book Logic (Double Page Flip)
   ========================================================================== */

const sheets = document.querySelectorAll(".sheet");
const nextButton = document.getElementById("next");
const prevButton = document.getElementById("prev");

let currentSheet = Number(localStorage.getItem("currentSheet")) || 0;

if (sheets.length > 0) {
    // Stack sheets dynamically
    sheets.forEach((sheet, index) => {
        sheet.style.zIndex = sheets.length - index;
    });

    // Disable transitions while restoring state
    sheets.forEach(sheet => {
        sheet.style.transition = "none";
    });

    // Restore flipped sheets
    for (let i = 0; i < currentSheet; i++) {
        if (!sheets[i]) continue;
        sheets[i].classList.add("flipped");
        sheets[i].style.zIndex = i + 1; // Ruan strukturën e saktë 3D pas rifreskimit
    }

    // Re-enable transitions after restoring state
    setTimeout(() => {
        sheets.forEach(sheet => {
            sheet.style.transition = "transform 1.25s cubic-bezier(0.25, 1, 0.5, 1)";
        });
    });
}

/* ==========================================================================
   Desktop Navigation Buttons
   ========================================================================== */

if (nextButton) {
    nextButton.addEventListener("click", (e) => {
        e.preventDefault();
        if (desktopAnimating) return;
        if (currentSheet < sheets.length) {
            flipNext();
        }
    });
}

if (prevButton) {
    prevButton.addEventListener("click", (e) => {
        e.preventDefault();
        if (desktopAnimating) return;
        if (currentSheet > 0) {
            flipPrevious();
        }
    });
}

function flipNext() {
    const sheet = sheets[currentSheet];
    if (!sheet) return;

    desktopAnimating = true;
    
    // E ngremë z-index lart që fleta të fluturojë sipër të tjerave gjatë rrotullimit 3D
    sheet.style.zIndex = sheets.length + 100;
    sheet.classList.add("flipped");
    currentSheet++;
    localStorage.setItem("currentSheet", currentSheet);

    let unlocked = false;
    function unlockNext() {
        if (unlocked) return;
        unlocked = true;
        // Pasi përfundon rrotullimi, fleta ulet në z-index-in e ri të pirgut të majtë
        sheet.style.zIndex = currentSheet;
        desktopAnimating = false;
        sheet.removeEventListener("transitionend", unlockNext);
    }

    sheet.addEventListener("transitionend", unlockNext);
    setTimeout(unlockNext, 1250); // Sinkronizuar saktësisht me tranzicionin CSS (1.25s)
}

function flipPrevious() {
    currentSheet--;
    const sheet = sheets[currentSheet];
    if (!sheet) return;

    desktopAnimating = true;
    
    // E ngremë z-index lart që fleta të qëndrojë sipër kur kthehet mbrapsht djathtas
    sheet.style.zIndex = sheets.length + 100;
    sheet.classList.remove("flipped");
    localStorage.setItem("currentSheet", currentSheet);

    let unlocked = false;
    function unlockPrevious() {
        if (unlocked) return;
        unlocked = true;
        // Pasi fleta mbyllet në të djathtë, merr z-index-in origjinal të pirgut
        sheet.style.zIndex = sheets.length - currentSheet;
        desktopAnimating = false;
        sheet.removeEventListener("transitionend", unlockPrevious);
    }

    sheet.addEventListener("transitionend", unlockPrevious);
    setTimeout(unlockPrevious, 1250); // Sinkronizuar saktësisht me tranzicionin CSS (1.25s)
}

/* ==========================================================================
   Mobile Book Logic (Bulletproof 2D Deck States)
   ========================================================================== */

const mobilePages = document.querySelectorAll(".mobile-page");
const mobilePrevBtn = document.getElementById("mobilePrev");
const mobileNextBtn = document.getElementById("mobileNext");
const mobileCounter = document.getElementById("mobileCounter");

let currentMobilePage = Number(localStorage.getItem("currentMobilePage")) || 0;
const totalMobilePages = mobilePages.length;

function initMobileBook() {
    if (totalMobilePages === 0) return;

    if (currentMobilePage >= totalMobilePages) {
        currentMobilePage = totalMobilePages - 1;
    }
    if (currentMobilePage < 0) {
        currentMobilePage = 0;
    }

    updateMobilePageDisplay(null);
}

function updateMobilePageDisplay(direction) {
    mobilePages.forEach((page, index) => {
        page.classList.remove(
            "active",
            "exit-next",
            "exit-prev",
            "slide-forward",
            "slide-backward",
            "past-hidden",
            "future-hidden"
        );

        page.style.pointerEvents = "none";

        if (index === currentMobilePage) {
            page.classList.add("active");
            page.style.pointerEvents = "auto";
        } 
        else if (index < currentMobilePage) {
            if (direction === "next" && index === currentMobilePage - 1) {
                page.classList.add("exit-next");
            } else {
                page.classList.add("past-hidden");
            }
        } 
        else if (index > currentMobilePage) {
            if (direction === "prev" && index === currentMobilePage + 1) {
                page.classList.add("exit-prev");
            } else {
                page.classList.add("future-hidden");
            }
        }

        if (direction === "next" && index === currentMobilePage) {
            page.classList.add("slide-forward");
        } 
        else if (direction === "prev" && index === currentMobilePage) {
            page.classList.add("slide-backward");
        }
    });

    if (mobileCounter) {
        mobileCounter.textContent = `${currentMobilePage + 1} / ${totalMobilePages}`;
    }

    if (direction !== null) {
        mobileAnimating = true;
        setTimeout(() => {
            mobileAnimating = false;
        }, 500); 
    }

    localStorage.setItem("currentMobilePage", currentMobilePage);
}

/* ==========================================================================
   Mobile Navigation Action Triggers
   ========================================================================== */

function goNextMobile() {
    if (currentMobilePage >= totalMobilePages - 1) return;
    currentMobilePage++;
    updateMobilePageDisplay("next");
}

function goPrevMobile() {
    if (currentMobilePage <= 0) return;
    currentMobilePage--;
    updateMobilePageDisplay("prev");
}

/* ==========================================================================
   Mobile Arrow Buttons
   ========================================================================== */

if (mobileNextBtn) {
    mobileNextBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (mobileAnimating) return;
        goNextMobile();
    });
}

if (mobilePrevBtn) {
    mobilePrevBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (mobileAnimating) return;
        goPrevMobile();
    });
}

/* ==========================================================================
   Mobile Swipe Gestures
   ========================================================================== */

let touchStartX = 0;
const swipeThresholdX = 40;

document.addEventListener("touchstart", (e) => {
    if (window.innerWidth > 768) return;
    touchStartX = e.touches[0].clientX;
}, { passive: true });

document.addEventListener("touchend", (e) => {
    if (window.innerWidth > 768 || mobileAnimating) return;

    const touchEndX = e.changedTouches[0].clientX;
    const differenceX = touchEndX - touchStartX;

    if (differenceX > swipeThresholdX) {
        goPrevMobile();
    } else if (differenceX < -swipeThresholdX) {
        goNextMobile();
    }
}, { passive: true });

/* ==========================================================================
   Mobile Side-Screen Tap Navigation
   ========================================================================== */

document.addEventListener("click", (e) => {
    if (window.innerWidth > 768 || mobileAnimating) return;

    if (e.target.closest(".mobile-controls") || e.target.closest(".mobile-arrow")) {
        return;
    }

    const width = window.innerWidth;
    const x = e.clientX;

    if (x < width * 0.20) {
        goPrevMobile();
    } else if (x > width * 0.80) {
        goNextMobile();
    }
});

/* ==========================================================================
   Initialize Mobile Book
   ========================================================================== */

initMobileBook();