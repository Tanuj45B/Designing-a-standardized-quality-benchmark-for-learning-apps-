import http.server
import socketserver
import json
import os
import urllib
import csv

PORT = 8000
DATA_FILE = "evaluations.json"
FRONTEND_DIR = "frontend"

# Ensure evaluations.json exists
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, "w") as f:
        json.dump([], f)

# Helper function: Automatic scoring based on user input
def calculateScores(inputs):
    scores = []

    # Knowledge Level
    knowledgeScore = min(inputs.get("numLessons",0)/20 * 1.5, 1.5)
    scores.append({"name":"Knowledge Level","score":knowledgeScore,"maxScore":1.5})

    # Comprehension (quizzes)
    comprehensionScore = 1 if inputs.get("numQuizzes",0) > 0 else 0.5
    scores.append({"name":"Comprehension","score":comprehensionScore,"maxScore":1})

    # Application (interactive exercises)
    applicationScore = 2 if inputs.get("interactiveExercises",0) else 0.5
    scores.append({"name":"Application","score":applicationScore,"maxScore":2})

    # Analysis (analytics)
    analysisScore = 1 if inputs.get("analytics",0) else 0.5
    scores.append({"name":"Analysis","score":analysisScore,"maxScore":1})

    # Evaluation (feedback feature)
    evaluationScore = 1 if inputs.get("analytics",0) else 0.5
    scores.append({"name":"Evaluation","score":evaluationScore,"maxScore":1})

    # Creation (creative projects)
    creationScore = 2 if inputs.get("creativeProjects",0) else 1
    scores.append({"name":"Creation","score":creationScore,"maxScore":2})

    # Usability & Design
    uiuxScore = (inputs.get("uiux",3)/5)*1.5
    scores.append({"name":"Usability & Design","score":uiuxScore,"maxScore":1.5})

    # Interactivity
    interactivityScore = 1 if inputs.get("interactiveExercises",0) else 0.5
    scores.append({"name":"Interactivity","score":interactivityScore,"maxScore":1})

    # Content Quality
    contentScore = min(inputs.get("numLessons",0)/20,1)
    scores.append({"name":"Content Quality","score":contentScore,"maxScore":1})

    # Engagement
    engagementScore = 0.5 if inputs.get("gamification",0) else 0
    scores.append({"name":"Overall Engagement","score":engagementScore,"maxScore":0.5})

    totalScore = sum(s["score"] for s in scores)
    return totalScore, scores


class Handler(http.server.SimpleHTTPRequestHandler):

    # Handle preflight requests (OPTIONS)
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == "/evaluations":
            with open(DATA_FILE, "r") as f:
                data = json.load(f)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")  # CORS
            self.end_headers()
            self.wfile.write(json.dumps(data).encode())

        elif parsed_path.path == "/evaluations/export":
            with open(DATA_FILE, "r") as f:
                data = json.load(f)
            if len(data) == 0:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"error":"No evaluations"}).encode())
                return

            csv_file = "app_evaluations.csv"
            with open(csv_file, "w", newline='') as f_csv:
                writer = csv.writer(f_csv)
                headers = ["App Name","Category","Total Score"] + [s["name"] for s in data[0]["scores"]]
                writer.writerow(headers)
                for app in data:
                    row = [app["name"], app["category"], app["totalScore"]] + [s["score"] for s in app["scores"]]
                    writer.writerow(row)

            self.send_response(200)
            self.send_header("Content-Type", "text/csv")
            self.send_header("Content-Disposition", "attachment; filename=app_evaluations.csv")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            with open(csv_file, "rb") as f_csv:
                self.wfile.write(f_csv.read())

        else:
            # Serve frontend files
            self.path = FRONTEND_DIR + self.path
            return http.server.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == "/evaluations":
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            inputs = json.loads(body)

            # Backend calculates the scores
            totalScore, scores = calculateScores(inputs)

            new_eval = {
                "name": inputs.get("appName","-"),
                "category": inputs.get("appCategory","-"),
                "totalScore": totalScore,
                "scores": scores
            }

            # Load existing data
            with open(DATA_FILE, "r") as f:
                data = json.load(f)

            # Append new evaluation
            data.append(new_eval)

            # Save back
            with open(DATA_FILE, "w") as f:
                json.dump(data, f, indent=2)

            # Return JSON response
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")  # CORS
            self.end_headers()
            self.wfile.write(json.dumps({"message":"Evaluation saved", "totalScore":totalScore, "scores":scores}).encode())


# Run server
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Server running at http://localhost:{PORT}")
    httpd.serve_forever()




