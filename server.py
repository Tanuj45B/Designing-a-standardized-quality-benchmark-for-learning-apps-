import http.server
import socketserver
import json
import urllib.parse
from google_play_scraper import search
import math
import random

PORT = 8000
FRONTEND_DIR = "../Frontend"

# =============================
# MANUAL APP DATA (100+ apps)
# =============================

manual_app_data = {}

apps_list = [
"Duolingo","Khan Academy","Byju's","Unacademy","Vedantu","Toppr","Brainly",
"Coursera","Udemy","PhysicsWallah","Carrer Will","singhkori education","edX",
"Quizlet","Skillshare","Photomath","Remind","Vajiram","Drishti IAS","RWA"
"Socratic","Google Classroom","LinkedIn Learning","Simplilearn","Babbel",
"Memrise","Rosetta Stone","Chegg","ClassDojo","Brilliant","Codecademy",
"FutureLearn","Udacity","LearnEnglish","iTalki","Mimo","Tynker","SoloLearn",
"ABCmouse","Epic","Prodigy","ScratchJr","Starfall","Seesaw","Mathway",
"Quizizz","Brainscape","Edmodo","Teachmint","WhiteHat Jr","Cuemath",
"Reading Eggs","Learning A-Z","DragonBox","CodeSpark","Funbrain","IXL",
"Prodigy Math Game","Classcraft","TypingClub","Timez Attack","Zearn","CK-12",
"Book Creator","Nearpod","Explain Everything","Kodable","GoNoodle","Scratch",
"Google Arts & Culture","National Geographic Kids","Mystery Science",
"TED-Ed","PBS Kids Games","ABCya","BrainPOP","Learning Ally","CodeMonkey",
"Minecraft Education","Coding Games for Kids","Mango Languages","LingQ",
"OpenLearn","MasterClass","Skillshare Classes","TED Talks","Duolingo ABC",
"Lingvist","Khan Kids","Prodigy English","Coding with Roblox",
"Code Kingdoms","Blockly Games","Play & Learn Science","Science360",
"NASA Kids Club","Fun Science","Math Playground","Coolmath Games",
"ABC Mouse Reading","Starfall Learn"
]

# Generate realistic random metrics
for app in apps_list:

    positive = random.randint(5000, 500000)
    negative = random.randint(500, 20000)

    manual_app_data[app] = {
        "quizzes": random.randint(80, 2000),
        "courses": random.randint(10, 150),
        "practice_tests": random.randint(30, 600),
        "positive_reviews": positive,
        "negative_reviews": negative
    }

# =============================
# HELPER: Convert installs string
# =============================

def parseInstalls(installs_str):

    installs_str = installs_str.replace(",", "").replace("+", "").upper()

    if "B" in installs_str:
        return float(installs_str.replace("B", "")) * 1_000_000_000

    elif "M" in installs_str:
        return float(installs_str.replace("M", "")) * 1_000_000

    elif "K" in installs_str:
        return float(installs_str.replace("K", "")) * 1_000

    else:
        try:
            return int(installs_str)
        except:
            return 0


# =============================
# BENCHMARK SCORING
# =============================

def calculateBenchmarkScore(rating, installs):

    rating_score = (rating / 5) * 60
    installs_score = min(math.log10(installs + 1) / 9 * 40, 40) if installs > 0 else 0

    return round(rating_score + installs_score, 2)


# =============================
# FETCH PLAY STORE DATA
# =============================

def fetchPlayStoreData(app_name):

    try:

        results = search(app_name, lang="en", country="in")

        if not results:
            return {"error": "App not found"}

        app_data = results[0]

        rating = app_data.get("score", 0)
        installs = parseInstalls(app_data.get("installs", "0"))

        benchmark_score = calculateBenchmarkScore(rating, installs)

        # =============================
        # FUZZY MATCH FOR MANUAL DATA
        # =============================

        manual = {
            "quizzes": 0,
            "courses": 0,
            "practice_tests": 0,
            "positive_reviews": 0,
            "negative_reviews": 0
        }

        title_lower = app_data.get("title", "").lower()

        for key, val in manual_app_data.items():
            if key.lower() in title_lower:
                manual = val
                break

        return {

            "name": app_data.get("title"),
            "developer": app_data.get("developer"),
            "rating": rating,
            "installs": app_data.get("installs"),
            "category": app_data.get("genre", ""),

            "benchmark_score": benchmark_score,

            # Manual metrics
            "quizzes": manual["quizzes"],
            "courses": manual["courses"],
            "practice_tests": manual["practice_tests"],

            "positive_reviews": manual["positive_reviews"],
            "negative_reviews": manual["negative_reviews"]
        }

    except Exception as e:
        return {"error": str(e)}


# =============================
# MULTIPLE APP HANDLER
# =============================

def fetchMultipleApps(app_names_str):

    app_names = [a.strip() for a in app_names_str.split(",") if a.strip()]

    results = []

    for name in app_names:
        data = fetchPlayStoreData(name)
        results.append(data)

    return results


# =============================
# SERVER HANDLER
# =============================

class Handler(http.server.SimpleHTTPRequestHandler):

    def do_GET(self):

        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == "/fetchApp":

            query = urllib.parse.parse_qs(parsed.query)
            app_names_str = query.get("name", [""])[0]

            data = fetchMultipleApps(app_names_str)

            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()

            self.wfile.write(json.dumps(data).encode())

        else:

            if self.path == "/":
                self.path = "/index.html"

            self.path = FRONTEND_DIR + self.path

            return http.server.SimpleHTTPRequestHandler.do_GET(self)


# =============================
# START SERVER
# =============================

with socketserver.TCPServer(("", PORT), Handler) as httpd:

    print(f"Server running at http://localhost:{PORT}")

    httpd.serve_forever()