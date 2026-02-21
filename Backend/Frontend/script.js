// Helper function: Automatic scoring based on user input
function calculateScores(inputs) {
    const scores = [];

    // Knowledge Level
    let knowledgeScore = Math.min(inputs.numLessons / 20 * 1.5, 1.5);
    scores.push({ name: "Knowledge Level", score: knowledgeScore, maxScore: 1.5 });

    // Comprehension (quizzes)
    let comprehensionScore = inputs.numQuizzes > 0 ? 1 : 0.5;
    scores.push({ name: "Comprehension", score: comprehensionScore, maxScore: 1 });

    // Application (interactive exercises)
    let applicationScore = inputs.interactiveExercises ? 2 : 0.5;
    scores.push({ name: "Application", score: applicationScore, maxScore: 2 });

    // Analysis (analytics)
    let analysisScore = inputs.analytics ? 1 : 0.5;
    scores.push({ name: "Analysis", score: analysisScore, maxScore: 1 });

    // Evaluation (feedback feature)
    let evaluationScore = inputs.analytics ? 1 : 0.5;
    scores.push({ name: "Evaluation", score: evaluationScore, maxScore: 1 });

    // Creation (creative projects)
    let creationScore = inputs.creativeProjects ? 2 : 1;
    scores.push({ name: "Creation", score: creationScore, maxScore: 2 });

    // Usability & Design
    let uiuxScore = (inputs.uiux / 5) * 1.5;
    scores.push({ name: "Usability & Design", score: uiuxScore, maxScore: 1.5 });

    // Interactivity
    let interactivityScore = inputs.interactiveExercises ? 1 : 0.5;
    scores.push({ name: "Interactivity", score: interactivityScore, maxScore: 1 });

    // Content Quality
    let contentScore = Math.min(inputs.numLessons / 20, 1);
    scores.push({ name: "Content Quality", score: contentScore, maxScore: 1 });

    // Engagement
    let engagementScore = inputs.gamification ? 0.5 : 0;
    scores.push({ name: "Overall Engagement", score: engagementScore, maxScore: 0.5 });

    return scores;
}

// DOMContentLoaded main listener
window.addEventListener('DOMContentLoaded', () => {

    // Update dashboard on load
    updateDashboard();

    // Start Evaluation button
    document.getElementById("start-evaluation").addEventListener("click", e => {
        e.preventDefault();
        document.getElementById("dashboard").style.display = "none";
        document.getElementById("evaluation-form").style.display = "block";
    });

    // Navbar navigation
    document.getElementById("nav-home").addEventListener("click", e => {
        e.preventDefault();
        showSection("dashboard");
    });
    document.getElementById("nav-evaluate").addEventListener("click", e => {
        e.preventDefault();
        showSection("evaluation-form");
    });
    document.getElementById("nav-results").addEventListener("click", e => {
        e.preventDefault();
        showSection("results-section");
    });

    // Evaluate Another button
    document.getElementById("evaluate-another").addEventListener("click", e => {
        e.preventDefault();
        showSection("evaluation-form");
        document.getElementById("appForm").reset();
    });

    // Export CSV button
    document.getElementById("export-csv").addEventListener("click", e => {
        e.preventDefault();
        window.location.href = "http://127.0.0.1:8000/evaluations/export";
    });

    // Form submit
    document.getElementById("appForm").addEventListener("submit", handleFormSubmit);

    // Function to switch sections
    function showSection(sectionId) {
        document.getElementById("dashboard").style.display = sectionId === "dashboard" ? "block" : "none";
        document.getElementById("evaluation-form").style.display = sectionId === "evaluation-form" ? "block" : "none";
        document.getElementById("results-section").style.display = sectionId === "results-section" ? "block" : "none";
    }

    // Handle form submit
    function handleFormSubmit(e) {
        e.preventDefault();

        const inputs = {
            appName: document.getElementById("appName").value,
            appCategory: document.getElementById("appCategory").value,
            numLessons: parseInt(document.getElementById("numLessons").value),
            numQuizzes: parseInt(document.getElementById("numQuizzes").value),
            interactiveExercises: parseInt(document.getElementById("interactiveExercises").value),
            creativeProjects: parseInt(document.getElementById("creativeProjects").value),
            analytics: parseInt(document.getElementById("analytics").value),
            uiux: parseInt(document.getElementById("uiux").value),
            gamification: parseInt(document.getElementById("gamification").value),
            targetAudience: document.getElementById("targetAudience").value,
            languageSupport: document.getElementById("languageSupport").value
        };

        const scores = calculateScores(inputs);
        const totalScore = scores.reduce((acc, s) => acc + s.score, 0);

        // Show results
        showSection("results-section");
        document.getElementById("result-appName").innerText = inputs.appName;
        document.getElementById("result-totalScore").innerText = totalScore.toFixed(2);

        // Populate chart
        const ctx = document.getElementById("criteriaChart").getContext("2d");
        new Chart(ctx, {
            type: "bar",
            data: {
                labels: scores.map(s => s.name),
                datasets: [{
                    label: "Score",
                    data: scores.map(s => s.score),
                    backgroundColor: "#1e3a8a"
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: Math.ceil(Math.max(...scores.map(s => s.maxScore)))
                    }
                }
            }
        });

        // Populate table
        const tbody = document.querySelector("#criteriaTable tbody");
        tbody.innerHTML = "";
        scores.forEach(s => {
            const row = document.createElement("tr");
            row.innerHTML = `<td>${s.name}</td><td>${s.score.toFixed(2)}</td><td>${s.maxScore}</td>`;
            tbody.appendChild(row);
        });

        // Recommendations
        const recList = document.getElementById("recommendationList");
        recList.innerHTML = "";
        scores.forEach(s => {
            if (s.score / s.maxScore < 0.6) {
                const li = document.createElement("li");
                li.innerText = `Improve ${s.name}: weight ${s.maxScore}`;
                recList.appendChild(li);
            }
        });

        // Save to backend
        fetch("http://127.0.0.1:8000/evaluations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                appName: inputs.appName,
                appCategory: inputs.appCategory,
                numLessons: inputs.numLessons,
                numQuizzes: inputs.numQuizzes,
                interactiveExercises: inputs.interactiveExercises,
                creativeProjects: inputs.creativeProjects,
                analytics: inputs.analytics,
                uiux: inputs.uiux,
                gamification: inputs.gamification,
                targetAudience: inputs.targetAudience,
                languageSupport: inputs.languageSupport
            })
        })
        .then(res => res.json())
        .then(data => {
            console.log("Saved:", data.message);
            updateDashboard();
        })
        .catch(err => console.warn("Could not save to backend:", err));
    }

    // Update dashboard
    function updateDashboard() {
        fetch("http://127.0.0.1:8000/evaluations")
            .then(res => res.json())
            .then(data => {
                document.getElementById("total-apps").innerText = data.length;

                // Filter out invalid or missing scores to prevent NaN
                const scoresList = data.map(d => d.totalScore).filter(s => typeof s === "number");
                const highest = scoresList.length > 0 ? Math.max(...scoresList) : 0;

                document.getElementById("highest-score").innerText = highest.toFixed(2);
                const last = data.length > 0 ? data[data.length - 1].appName : "-";
                document.getElementById("last-app").innerText = last;
            })
            .catch(err => {
                console.warn("Dashboard update failed:", err);
                document.getElementById("total-apps").innerText = "-";
                document.getElementById("highest-score").innerText = "-";
                document.getElementById("last-app").innerText = "-";
            });
    }
});




