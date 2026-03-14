// ============================
// DOM ELEMENTS
// ============================
const inputField = document.getElementById("appName")
const resultContainer = document.getElementById("result")
const loadingBox = document.getElementById("loading")

// STORE ALL FETCHED APPS
let appsData = []

// ============================
// FETCH APP DATA FROM SERVER
// ============================
function fetchApp() {
    let appNames = inputField.value.trim()

    if (appNames === "") {
        showError("Please enter one or more app names")
        return
    }

    loadingBox.style.display = "block"

    fetch(`/fetchApp?name=${encodeURIComponent(appNames)}`)
        .then(response => response.json())
        .then(data => {
            loadingBox.style.display = "none"
            appsData = [] // Reset for new search

            if (!Array.isArray(data) || data.length === 0) {
                showError("No valid apps found")
                autoHide()
                return
            }

            data.forEach(app => {
                if (!app.error) appsData.push(app)
            })

            if (appsData.length === 0) {
                showError("No valid apps found")
                autoHide()
                return
            }

            // SORT BY BENCHMARK SCORE
            appsData.sort((a, b) => b.benchmark_score - a.benchmark_score)

            // CALCULATE PERCENTILE
            appsData.forEach((app, index) => {
                app.percentile_rank = Math.round((appsData.length - index) / appsData.length * 100)
            })

            // DISPLAY
            displayResults(appsData)

            inputField.value = ""
        })
        .catch(error => {
            loadingBox.style.display = "none"
            showError("Failed to fetch data")
            autoHide()
        })
}

// ============================
// DISPLAY RESULTS / COMPARISON
// ============================
function displayResults(dataArray) {
    resultContainer.innerHTML = ""

    if (dataArray.length === 2) {
        // SIDE-BY-SIDE COMPARISON
        resultContainer.innerHTML = `
        <div class="comparison-container" style="display:flex; gap:20px; flex-wrap:wrap; justify-content:center;">
            ${dataArray.map(data => {
                let color = getScoreColor(data.benchmark_score)
                return `
                <div class="result-card" style="flex:1; min-width:300px;">
                    <h3>${data.name || "N/A"}</h3>
                    <p><strong>Developer:</strong> ${data.developer || "N/A"}</p>
                    <p><strong>Category:</strong> ${data.category || "N/A"}</p>
                    <p><strong>Rating:</strong> ${data.rating || 0}</p>
                    <p><strong>Installs:</strong> ${data.installs || 0}</p>
                    <p><strong>Positive Reviews:</strong> ${data.positive_reviews || 0}</p>
                    <p><strong>Negative Reviews:</strong> ${data.negative_reviews || 0}</p>
                    <p><strong>Quizzes:</strong> ${data.quizzes || 0}</p>
                    <p><strong>Courses:</strong> ${data.courses || 0}</p>
                    <p><strong>Practice Tests:</strong> ${data.practice_tests || 0}</p>
                    <hr>
                    <h4 style="margin-top:10px;">EduBenchmark Score</h4>
                    <div style="
                        font-size:28px;
                        font-weight:bold;
                        color:${color};
                        margin-top:5px;
                    ">
                        ${data.benchmark_score || 0} / 100
                    </div>
                    <p><strong>Percentile Rank:</strong> ${data.percentile_rank || 0}%</p>
                </div>`
            }).join("")}
        </div>
        `
    } else {
        // NORMAL VERTICAL LIST
        dataArray.forEach(data => {
            let color = getScoreColor(data.benchmark_score)
            resultContainer.innerHTML += `
            <div class="result-card">
                <h3>${data.name || "N/A"}</h3>
                <p><strong>Developer:</strong> ${data.developer || "N/A"}</p>
                <p><strong>Category:</strong> ${data.category || "N/A"}</p>
                <p><strong>Rating:</strong> ${data.rating || 0}</p>
                <p><strong>Installs:</strong> ${data.installs || 0}</p>
                <p><strong>Positive Reviews:</strong> ${data.positive_reviews || 0}</p>
                <p><strong>Negative Reviews:</strong> ${data.negative_reviews || 0}</p>
                <p><strong>Quizzes:</strong> ${data.quizzes || 0}</p>
                <p><strong>Courses:</strong> ${data.courses || 0}</p>
                <p><strong>Practice Tests:</strong> ${data.practice_tests || 0}</p>
                <hr>
                <h4 style="margin-top:10px;">EduBenchmark Score</h4>
                <div style="
                    font-size:28px;
                    font-weight:bold;
                    color:${color};
                    margin-top:5px;
                ">
                    ${data.benchmark_score || 0} / 100
                </div>
                <p><strong>Percentile Rank:</strong> ${data.percentile_rank || 0}%</p>
            </div>
            `
        })
    }
}

// ============================
// SCORE COLOR
// ============================
function getScoreColor(score) {
    if (score >= 80) return "#28a745"
    if (score >= 50) return "#ffc107"
    return "#dc3545"
}

// ============================
// ERROR MESSAGE
// ============================
function showError(message) {
    resultContainer.innerHTML = `
    <div class="result-card">
        <p style="color:red;">${message}</p>
    </div>
    `
}

// ============================
// ENTER KEY SUPPORT
// ============================
inputField.addEventListener("keypress", function (e) {
    if (e.key === "Enter") fetchApp()
})

// ============================
// AUTO HIDE ERROR
// ============================
function autoHide() {
    setTimeout(() => {
        resultContainer.innerHTML = ""
    }, 4000)
}

// ============================
// SMOOTH SCROLL
// ============================
document.querySelectorAll("a[href^='#']").forEach(anchor => {
    anchor.addEventListener("click", function (e) {
        e.preventDefault()
        document.querySelector(this.getAttribute("href")).scrollIntoView({
            behavior: "smooth"
        })
    })
})

// ============================
// PAGE LOAD ANIMATION
// ============================
window.addEventListener("load", () => {
    document.body.style.opacity = "1"
})

// ============================
// INPUT FOCUS EFFECT
// ============================
inputField.addEventListener("focus", () => {
    inputField.style.border = "2px solid #2f4ba3"
})
inputField.addEventListener("blur", () => {
    inputField.style.border = "1px solid #ccc"
})