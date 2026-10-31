const textarea = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");

const MAX_CHARS = 200;
const WARNING_AT = 180;

function updateCounts() {
    const text = textarea.value;
    const length = text.length;
    const trimmed = text.trim();
    const words = trimmed === "" ? 0 : trimmed.split(/\s+/).length;

    charCount.textContent = `${length} / ${MAX_CHARS} characters`;
    wordCount.textContent = `${words} words`;

    charCount.classList.remove("warning", "over");
    if (length > MAX_CHARS) {
        charCount.classList.add("over");
    } else if (length > WARNING_AT) {
        charCount.classList.add("warning");
    }
}

function saveDraft() {
    localStorage.setItem("draft", textarea.value);
}

function clearAll() {
    textarea.value = "";
    localStorage.removeItem("draft");
    updateCounts();
}

function applyTheme(isDark) {
    document.body.classList.toggle("dark", isDark);
    themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
}

// Every input event: update counters and save the draft
textarea.addEventListener("input", () => {
    updateCounts();
    saveDraft();
});

// Clear button and Escape key
clearBtn.addEventListener("click", clearAll);
textarea.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        clearAll();
    }
});

// Theme toggle remembers the choice
themeToggle.addEventListener("click", () => {
    const isDark = !document.body.classList.contains("dark");
    applyTheme(isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
});

// On page load: restore draft and theme, then update counters
textarea.value = localStorage.getItem("draft") || "";
applyTheme(localStorage.getItem("theme") === "dark");
updateCounts();