(function() {
    const splash = document.getElementById("splash-screen");
    if (!splash) return;

    if (sessionStorage.getItem('objectscope-splash')) {
        splash.remove();
        return;
    }

    sessionStorage.setItem('objectscope-splash', '1');

    let removed = false;
    function removeSplash() {
        if (removed) return;
        removed = true;
        splash.style.opacity = "0";
        splash.style.transition = "opacity 0.5s ease";
        setTimeout(() => splash.remove(), 500);
    }

    if (document.readyState === "complete") {
        setTimeout(removeSplash, 1200);
    } else {
        window.addEventListener("load", () => setTimeout(removeSplash, 1200));
    }

    setTimeout(removeSplash, 3000);
})();

const menuBtn = document.getElementById("menu-toggle");
const menu = document.querySelector(".nav-menu");
if (menuBtn && menu) {
    menuBtn.addEventListener("click", () => {
        menu.classList.toggle("active");
    });
}