from flask import Flask, render_template, request, send_file, jsonify, redirect, url_for, session, send_from_directory
import re
import subprocess
from docx import Document
import os
import requests
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, ListFlowable, ListItem
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from io import BytesIO
import json
import asyncio

try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
except Exception:
    PLAYWRIGHT_AVAILABLE = False

# --------------------------------
# Simple .env loader (no dependency)
# --------------------------------
def _load_env_file(path: str = ".env") -> None:
    try:
        if not os.path.exists(path):
            return
        with open(path, "r", encoding="utf-8") as f:
            for raw in f:
                line = raw.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" not in line:
                    continue
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = val
    except Exception:
        # Fail silently; env can still be provided via real env vars
        pass

_load_env_file()

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret-change-me")

# -------------------------------
# Configurable Ollama model
# -------------------------------
OLLAMA_MODEL = os.environ.get("MODEL_NAME", "meta-llama/llama-4-scout-17b-16e-instruct")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

# -------------------------------
# Resume Enhancement Prompts (CAG-style)
# -------------------------------
GLOBAL_RULES = [
    "Use a professional, employer-focused tone.",
    "Do not use first-person pronouns.",
    "Be concise, quantifiable, and clear.",
    "Fix grammar, spelling, capitalization, and punctuation.",
    "Do not invent experiences, tools, dates, companies, or metrics.",
    "Never output placeholders (e.g., [Company], <Role>, {Year}, N/A). If data is missing, omit it.",
    "Do not introduce new sections or fields that the user did not provide.",
]

GLOBAL_RULE = (
    "Global Resume Rules:\n" +
    "\n".join(f"{i+1}. {rule}" for i, rule in enumerate(GLOBAL_RULES)) +
    "\n"
)

resume_prompts = {
    "summary": (
        "Role: Expert Resume Consultant\n"
        "Objective: Improve the Professional Summary section.\n"
        "Context: The user is seeking to present themselves professionally for job applications.\n"
        "Instruction 1: Rewrite the summary in 55–90 words as ONE paragraph.\n"
        "Instruction 2: Do NOT include headings, labels, steps, bullets, or sections.\n"
        "Instruction 3: Do NOT mention other resume sections (skills, education, projects, certifications, achievements, hobbies).\n"
        "Instruction 4: Do NOT add or infer information not present in the user's input (no new tools, companies, dates, or claims).\n"
        "Instruction 5: Ensure the tone is employer-focused and concise; correct spelling/grammar.\n"
        "Instruction 6: Return only the final paragraph with no prefixes or explanations.\n"
        "Notes: Follow all Global Resume Rules."
    ),
    "experience": (
        "Role: Expert Resume Consultant\n"
        "Objective: Enhance the Work Experience section.\n"
        "Context: The user wants to showcase achievements and responsibilities.\n"
        "Instruction 1: Rewrite experience in 70–120 words (single block, no headings).\n"
        "Instruction 2: Emphasize measurable outcomes and use action verbs.\n"
        "Instruction 3: Quantify results and highlight transferable skills.\n"
        "Instruction 4: Do NOT add employers, tools, or responsibilities not present in the user's text.\n"
        "Instruction 5: Capitalize the first letter of every sentence and proper nouns.\n"
        "Instruction 6: Return only the single best version for the resume.\n"
        "Notes: Follow all Global Resume Rules."
    ),
    "skills": (
        "Role: Expert Resume Consultant\n"
        "Objective: Fix spelling and capitalization in the Skills section.\n"
        "Context: The user wants their existing skills list cleaned up.\n"
        "Instruction 1: Keep ALL skills exactly as provided by the user.\n"
        "Instruction 2: ONLY fix spelling mistakes and standardize capitalization.\n"
        "Instruction 3: Do NOT add, remove, or reorder any skills.\n"
        "Instruction 4: Do NOT group, categorize, or reorganize skills.\n"
        "Instruction 5: Return as a simple comma-separated list.\n"
        "Instruction 6: Preserve the exact order and content of user's skills.\n"
        "Notes: Follow all Global Resume Rules. Only correct spelling and capitalization."
    ),
    "education": (
        "Role: Expert Resume Consultant\n"
        "Objective: Improve the Education section.\n"
        "Context: The user wants to highlight academic achievements.\n"
        "Instruction 1: Rewrite in 50–100 words. No headings; single block.\n"
        "Instruction 2: Clearly present degrees, certifications, and relevant coursework.\n"
        "Instruction 3: Focus on what supports career goals. Do NOT add schools, degrees, years, or awards not present.\n"
        "Instruction 4: Capitalize the first letter of every sentence and proper nouns.\n"
        "Instruction 5: Return only the single best version for the resume.\n"
        "Notes: Follow all Global Resume Rules."
    ),
    "projects": (
        "Role: Expert Resume Consultant\n"
        "Objective: Enhance the Projects section with proper formatting and corrections.\n"
        "Context: The user wants to showcase project work professionally.\n"
        "Instruction 1: Rewrite each project in 30–60 words. Preserve multiple projects if present.\n"
        "Instruction 2: Fix ALL spelling mistakes and grammar errors.\n"
        "Instruction 3: Capitalize the first letter of each sentence and proper nouns.\n"
        "Instruction 4: Use proper punctuation and sentence structure.\n"
        "Instruction 5: Highlight scope, technologies, contributions, and results for each project.\n"
        "Instruction 6: Do NOT add new projects, tools, or metrics beyond user input.\n"
        "Instruction 7: Separate multiple projects with blank lines. Keep each project distinct.\n"
        "Instruction 8: Do NOT combine multiple projects into one.\n"
        "Instruction 9: Ensure each project description starts with a capital letter.\n"
        "Notes: Follow all Global Resume Rules. Focus on spelling, grammar, and proper capitalization."
    ),
    "certifications": (
        "Role: Expert Resume Consultant\n"
        "Objective: Refine the Certifications section.\n"
        "Context: The user wants to emphasize relevant certifications.\n"
        "Instruction 1: Rewrite in 30–60 words.\n"
        "Instruction 2: Highlight relevance and impact.\n"
        "Instruction 3: Return only the single best version for the resume.\n"
        "Notes: Follow all Global Resume Rules."
    ),
    "achievements": (
        "Role: Expert Resume Consultant\n"
        "Objective: Improve the Achievements section.\n"
        "Context: The user wants to showcase awards and recognitions.\n"
        "Instruction 1: Rewrite in 40–80 words.\n"
        "Instruction 2: Make achievements concise, quantifiable, and professional.\n"
        "Instruction 3: Return only the single best version for the resume.\n"
        "Notes: Follow all Global Resume Rules."
    ),
}
# -------------------------------
# Helper Functions
# -------------------------------
def _call_groq_chat(model_name: str, prompt: str, timeout_seconds: int = 90) -> str:
    """Call Groq Chat Completions API with a single user message and return text."""
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model_name,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 512,
        "stream": False,
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=timeout_seconds)
    resp.raise_for_status()
    data = resp.json()
    content = (
        (data.get("choices") or [{}])[0]
        .get("message", {})
        .get("content", "")
    )
    return content or ""


def enhance_section(section_name, user_input):
    """Enhance a resume section using Ollama (CAG approach)"""
    if not user_input.strip():
        return user_input

    section_key = section_name.lower()
    if section_key not in resume_prompts:
        return user_input

    global_rules = (
        "Global Editing Rules:\n"
        "- Correct all spelling, grammar, and punctuation.\n"
        "- Standardize capitalization and spacing.\n"
        "- Keep original meaning; do not invent content.\n"
        "- Prefer concise, professional wording.\n"
        "- Do NOT explain what changed; output only the final improved content.\n"
    )

    combined_prompt = (
        f"{GLOBAL_RULE}\n{resume_prompts[section_key]}\n\n"
        f"User Input (verbatim; do not add new facts):\n{user_input}\n\n"
        f"Output Policy:\n"
        f"- Return ONLY the improved text for the {section_key} section.\n"
        f"- Do NOT include headings, labels, steps, notes, or explanations.\n"
        f"- Do NOT add entities, tools, dates, metrics, or claims not present above.\n"
        f"- Do NOT output placeholders; if something is missing, leave it out.\n"
        f"- Avoid repetition and filler. Keep it concise and direct.\n"
        f"- Stay within the specified word range.\n\n"
        f"Improved Content:"
    )

    try:
        if not GROQ_API_KEY:
            return user_input

        # Groq is the primary and only path now
        enhanced_text = _call_groq_chat(OLLAMA_MODEL, combined_prompt, timeout_seconds=90).strip()

        # Remove any common prefixes or headings
        prefixes = [
            f"{section_name.title()}:",
            f"{section_name.upper()}:",
            "Summary:",
            "Improved Content:",
            "Enhanced:",
            "Here is the improved text:",
            "Here's the enhanced version:",
            "Explanation of changes:",
            "Explanation:",
            "Notes:",
            ##"Here's a polished and concise resume summary/objective tailored for a user:"
        ]
        for p in prefixes:
            if enhanced_text.startswith(p):
                enhanced_text = enhanced_text[len(p):].strip()

        # 1) Keep only content after the last 'Improved Content:' or 'Steps' markers (case-insensitive)
        if re.search(r"improved\s*content\s*:", enhanced_text, flags=re.IGNORECASE):
            parts = re.split(r"improved\s*content\s*:", enhanced_text, flags=re.IGNORECASE)
            enhanced_text = parts[-1].strip()
        # Remove typical step-by-step blocks the model may emit
        enhanced_text = re.sub(r"(?is)^\s*(?:steps?|process|procedure)\s*:?[\s\S]*?(?=\n\s*\S|$)", "", enhanced_text).strip()

        # 2) Remove any echoed 'Global Editing Rules' block anywhere
        enhanced_text = re.sub(r"^\s*global\s+editing\s+rules:?[\s\S]*?(?:\n\s*user\s+input\s*:\s*|$)", "", enhanced_text, flags=re.IGNORECASE)

        # 3) Remove any echoed 'User Input:' header if present
        enhanced_text = re.sub(r"^\s*user\s+input\s*:\s*", "", enhanced_text, flags=re.IGNORECASE)

        # Remove any explanation/steps lines the model may add
        lines = [ln.rstrip() for ln in enhanced_text.splitlines()]
        filtered_lines = [
            ln for ln in lines
            if not ln.strip().lower().startswith((
                "explanation of changes",
                "explanation:",
                "changes:",
                "what changed:",
                "here's what i changed",
                "notes:",
                "rationale:",
                "step ",
                "step:",
                "steps:",
                "process:",
            ))
        ]
        enhanced_text = "\n".join(filtered_lines).strip()

        # Remove common placeholder patterns the model might introduce
        enhanced_text = re.sub(r"\[[^\]]*\]", "", enhanced_text)  # [Placeholder]
        enhanced_text = re.sub(r"<[^>]*>", "", enhanced_text)        # <Placeholder>
        enhanced_text = re.sub(r"\{[^}]*\}", "", enhanced_text)    # {Placeholder}

        # Preserve bullets/asterisks; trim whitespace only and hard-cap length
        enhanced_text = enhanced_text.strip()

        # Length caps per section to avoid runaway generations
        word_caps = {
            "summary": 100,
            "experience": 140,
            "education": 120,
            "projects": 200,  # increased for multiple projects
            "skills": 200,  # skills are comma-separated
        }
        cap = word_caps.get(section_key, 150)
        words = enhanced_text.split()
        if len(words) > cap:
            enhanced_text = " ".join(words[:cap])

        # Post-process projects to ensure proper capitalization
        if section_key == "projects":
            # Split into individual projects
            project_parts = enhanced_text.split('\n\n')
            capitalized_parts = []
            
            for part in project_parts:
                part = part.strip()
                if part:
                    # Capitalize first letter of the project description
                    if part and not part[0].isupper():
                        part = part[0].upper() + part[1:]
                    
                    # Ensure proper sentence structure
                    sentences = re.split(r'(?<=[.!?])\s+', part)
                    capitalized_sentences = []
                    
                    for sentence in sentences:
                        sentence = sentence.strip()
                        if sentence:
                            # Capitalize first letter of each sentence
                            if sentence and not sentence[0].isupper():
                                sentence = sentence[0].upper() + sentence[1:]
                            capitalized_sentences.append(sentence)
                    
                    part = '. '.join(capitalized_sentences)
                    # Remove double periods
                    part = re.sub(r'\.\.+', '.', part)
                    capitalized_parts.append(part)
            
            enhanced_text = '\n\n'.join(capitalized_parts)

        # Post-process experience and education: capitalize first letters of sentences
        if section_key in ("experience", "education"):
            sentences = re.split(r'(?<=[.!?])\s+', enhanced_text)
            fixed = []
            for s in sentences:
                s = s.strip()
                if not s:
                    continue
                if s and not s[0].isupper():
                    s = s[0].upper() + s[1:]
                fixed.append(s)
            enhanced_text = ' '.join(fixed)

        # Normalize skills output to comma-separated list without labels
        if section_key == "skills":
            # Extract all skills from user input (case-insensitive for matching)
            original_skills = [s.strip() for s in re.split(r",|\n|;", user_input) if s.strip()]
            original_skills_lower = [s.lower() for s in original_skills]
            
            # Extract skills from enhanced output
            lines = [ln.strip().lstrip("-•*") for ln in enhanced_text.splitlines() if ln.strip()]
            enhanced_skills = []
            for ln in lines:
                parts = [p.strip() for p in re.split(r",|;", ln) if p.strip()]
                for p in parts:
                    if not p.lower().startswith(("explanation", "note", "reason", "changes", "skills")):
                        enhanced_skills.append(p)
            
            # Only keep skills that match the original (case-insensitive) and preserve original order
            filtered = []
            for orig_skill in original_skills:
                # Find the enhanced version of this skill (case-insensitive match)
                for enhanced_skill in enhanced_skills:
                    if orig_skill.lower() == enhanced_skill.lower():
                        filtered.append(enhanced_skill)  # Use the enhanced version (fixed spelling/caps)
                        break
                else:
                    # If no enhanced version found, keep original
                    filtered.append(orig_skill)
            
            enhanced_text = ", ".join(filtered)

        return enhanced_text if enhanced_text else user_input

    # Ollama paths disabled; only Groq errors are handled
    except requests.RequestException as e:
        print(f"Groq API error for {section_name}: {str(e)}")
        return user_input
    except Exception as e:
        print(f"Unexpected error enhancing {section_name}: {str(e)}")
        return user_input


def save_resume_docx(enhanced_resume, filename="Enhanced_Resume.docx"):
    """Save enhanced resume to DOCX file"""
    doc = Document()
    doc.add_heading("Enhanced Resume", 0)
    for section, text in enhanced_resume.items():
        if text:
            doc.add_heading(section.title(), level=1)
            doc.add_paragraph(text)
    doc.save(filename)
    return filename

# -------------------------------
# Flask Routes
# -------------------------------
@app.route("/", methods=["GET", "POST"])
def index():
    # Redirect root to React app
    return redirect(url_for('serve_app_index'))

@app.route("/enhance", methods=["POST"])
def enhance_ajax():
    """AJAX endpoint for individual section enhancement"""
    try:
        data = request.get_json()
        section_name = data.get('section')
        content = data.get('content')

        if not section_name or not content:
            return jsonify({'success': False, 'error': 'Missing section name or content'}), 400

        enhanced_content = enhance_section(section_name, content)

        return jsonify({'success': True, 'enhanced_content': enhanced_content, 'section': section_name})

    except Exception as e:
        return jsonify({'success': False, 'error': f'Server error: {str(e)}'}), 500

@app.route("/download")
def download():
    filename = "Enhanced_Resume.docx"
    if os.path.exists(filename):
        return send_file(filename, as_attachment=True)
    return "File not found.", 404

@app.route("/api/generate", methods=["POST"])
def api_generate_docx():
    """Generate a DOCX from provided resume data; optionally enhance first.

    Expected JSON body:
    {
      "personalInfo": { "summary": "..." },
      "experience": [ { "title": "...", "company": "...", "description": "..." } ],
      "education": [ { "degree": "...", "school": "..." } ],
      "skills": "...",
      "projects": "...",
      "enhance": true
    }
    """
    try:
        data = request.get_json(force=True, silent=True) or {}
        enhance_flag = bool(data.get("enhance", True))

        # Flatten arrays into text blocks similar to legacy template behavior
        def join_experience(items):
            lines = []
            for it in items or []:
                title = it.get("title", "").strip()
                company = it.get("company", "").strip()
                desc = it.get("description", "").strip()
                header = f"{title} at {company}".strip()
                lines.append(f"{header}: {desc}" if header else desc)
            return "\n\n".join([l for l in lines if l])

        def join_education(items):
            lines = []
            for it in items or []:
                degree = it.get("degree", "").strip()
                school = it.get("school", "").strip()
                grad = it.get("graduationDate", "").strip()
                gpa = it.get("gpa", "").strip()
                parts = [p for p in [f"{degree} from {school}", f"Graduated: {grad}" if grad else "", f"GPA: {gpa}" if gpa else ""] if p]
                lines.append(". ".join(parts))
            return "\n\n".join([l for l in lines if l])

        summary = (data.get("personalInfo", {}) or {}).get("summary", "")
        experience_text = join_experience(data.get("experience", []))
        education_text = join_education(data.get("education", []))
        skills_text = data.get("skills", "")
        projects_text = data.get("projects", "")

        sections = {
            "summary": summary,
            "experience": experience_text,
            "education": education_text,
            "skills": skills_text,
            "projects": projects_text,
        }

        final_sections = {}
        for key, value in sections.items():
            if enhance_flag:
                final_sections[key] = enhance_section(key, value or "")
            else:
                final_sections[key] = value or ""

        filename = save_resume_docx(final_sections)
        return send_file(filename, as_attachment=True)

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/health")
def health_check():
    """Check Groq API availability and model presence"""
    if not GROQ_API_KEY:
        return jsonify({'status': 'unhealthy', 'groq_available': False, 'error': 'GROQ_API_KEY not set'}), 500
    try:
        # Probe Groq API by attempting a cheap models list call
        url = "https://api.groq.com/openai/v1/models"
        headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}
        r = requests.get(url, headers=headers, timeout=10)
        r.raise_for_status()
        data = r.json() if r.content else {}
        models = [m.get('id') for m in (data.get('data') or [])]
        model_available = OLLAMA_MODEL in (models or []) if models else True  # Some accounts may not list all
        return jsonify({'status': 'healthy', 'groq_available': True, 'model_available': model_available})
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'groq_available': False, 'error': str(e)}), 500

# -------------------------------
# Plan Pages - Routes
# -------------------------------
def _get_resume_data():
    return session.setdefault("resume_data", {
        "summary": "",
        "experience": "",
        "education": "",
        "skills": "",
        "projects": "",
    })


# -------------------------------
# Multi-step Resume Flow
# -------------------------------
@app.route("/start")
def start_resume_flow():
    session["resume_data"] = _get_resume_data()
    return redirect(url_for("resume_summary"))


@app.route("/resume/summary", methods=["GET", "POST"])
def resume_summary():
    data = _get_resume_data()
    if request.method == "POST":
        data["summary"] = request.form.get("summary", "")
        session.modified = True
        return redirect(url_for("resume_experience"))
    return render_template("resume_summary.html", data=data)


@app.route("/resume/experience", methods=["GET", "POST"])
def resume_experience():
    data = _get_resume_data()
    if request.method == "POST":
        data["experience"] = request.form.get("experience", "")
        session.modified = True
        return redirect(url_for("resume_education"))
    return render_template("resume_experience.html", data=data)


@app.route("/resume/education", methods=["GET", "POST"])
def resume_education():
    data = _get_resume_data()
    if request.method == "POST":
        data["education"] = request.form.get("education", "")
        session.modified = True
        return redirect(url_for("resume_skills"))
    return render_template("resume_education.html", data=data)


@app.route("/resume/skills", methods=["GET", "POST"])
def resume_skills():
    data = _get_resume_data()
    if request.method == "POST":
        data["skills"] = request.form.get("skills", "")
        session.modified = True
        return redirect(url_for("resume_projects"))
    return render_template("resume_skills.html", data=data)


@app.route("/resume/projects", methods=["GET", "POST"])
def resume_projects():
    data = _get_resume_data()
    if request.method == "POST":
        data["projects"] = request.form.get("projects", "")
        session.modified = True
        return redirect(url_for("resume_review"))
    return render_template("resume_projects.html", data=data)


@app.route("/resume/review", methods=["GET", "POST"])
def resume_review():
    data = _get_resume_data()
    if request.method == "POST":
        enhanced = {}
        for section in ["summary", "experience", "education", "skills", "projects"]:
            enhanced[section] = enhance_section(section, data.get(section, ""))
        filename = save_resume_docx(enhanced)
        return render_template("resume_done.html", enhanced_resume=enhanced, download_file=filename)
    return render_template("resume_review.html", data=data)


@app.route("/resume/final-edit", methods=["POST"])
def resume_final_edit():
    """Handle final editing of enhanced resume content"""
    try:
        # Get the edited content from the form
        final_resume = {}
        for section in ["summary", "experience", "education", "skills", "projects"]:
            final_resume[section] = request.form.get(section, "")
        
        # Save the final edited resume
        filename = save_resume_docx(final_resume)
        
        # Return success message with download link
        return render_template("resume_done.html", 
                             enhanced_resume=final_resume, 
                             download_file=filename,
                             final_edited=True)
    except Exception as e:
        return render_template("resume_done.html", 
                             enhanced_resume={}, 
                             error=f"Error saving final resume: {str(e)}")

# -------------------------------
# Error Handlers
# -------------------------------
@app.errorhandler(404)
def not_found(error):
    return render_template('index.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# -------------------------------
# Frontend (Vite) - Static Serving
# -------------------------------

# Serve built React app from react-frontend/dist if present
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), 'react-frontend', 'dist')

@app.route('/app')
def serve_app_index():
    if os.path.exists(os.path.join(FRONTEND_DIST, 'index.html')):
        return send_from_directory(FRONTEND_DIST, 'index.html')
    # If not built yet, fall back to legacy page
    return render_template("index.html")

@app.route('/app/<path:path>')
def serve_app_assets(path):
    asset_path = os.path.join(FRONTEND_DIST, path)
    if os.path.exists(asset_path):
        return send_from_directory(FRONTEND_DIST, path)
    # SPA fallback
    if os.path.exists(os.path.join(FRONTEND_DIST, 'index.html')):
        return send_from_directory(FRONTEND_DIST, 'index.html')
    return render_template("index.html")

# Serve built assets when index.html references /assets/* at site root
@app.route('/assets/<path:path>')
def serve_built_assets_root(path):
    assets_dir = os.path.join(FRONTEND_DIST, 'assets')
    file_path = os.path.join(assets_dir, path)
    if os.path.exists(file_path):
        return send_from_directory(assets_dir, path)
    return ("", 404)

# Serve favicons from dist if present
@app.route('/favicon.ico')
def serve_favicon_ico():
    fav = os.path.join(FRONTEND_DIST, 'favicon.ico')
    if os.path.exists(fav):
        return send_from_directory(FRONTEND_DIST, 'favicon.ico')
    return ("", 404)

@app.route('/favicon.jpg')
def serve_favicon_jpg():
    fav = os.path.join(FRONTEND_DIST, 'favicon.jpg')
    if os.path.exists(fav):
        return send_from_directory(FRONTEND_DIST, 'favicon.jpg')
    return ("", 404)

@app.route('/favicon.png')
def serve_favicon_png():
    fav = os.path.join(FRONTEND_DIST, 'favicon.png')
    if os.path.exists(fav):
        return send_from_directory(FRONTEND_DIST, 'favicon.png')
    return ("", 404)

# -------------------------------
# PDF Generation Functions
# -------------------------------
def generate_pdf(resume_data):
    """Generate a PDF resume from the provided data."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Detect template style
    template = (resume_data.get('template') or 'modern').lower()

    # Create styles, theme colors vary by template
    if template == 'modern':
        primary_color = colors.HexColor('#2563eb')
        heading_color = colors.HexColor('#1e40af')
    elif template == 'professional':
        primary_color = colors.HexColor('#0ea5e9')
        heading_color = colors.HexColor('#0369a1')
    elif template == 'minimal':
        primary_color = colors.HexColor('#374151')
        heading_color = colors.HexColor('#1f2937')
    elif template == 'elegant':
        primary_color = colors.HexColor('#7c3aed')
        heading_color = colors.HexColor('#5b21b6')
    else:  # default to modern
        primary_color = colors.HexColor('#2563eb')
        heading_color = colors.HexColor('#1e40af')

    # Create custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=1,  # Center alignment
        textColor=primary_color
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16 if template in ['modern', 'professional'] else 15,
        spaceAfter=12,
        spaceBefore=20,
        textColor=heading_color,
        fontName='Helvetica-Bold',
        underlineWidth=0,
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=11 if template == 'modern' else 10.5,
        spaceAfter=6,
        leading=14
    )
    
    # Build content
    story = []
    
    # Personal Information
    personal_info = resume_data.get('personalInfo', {})
    if personal_info.get('fullName'):
        story.append(Paragraph(personal_info['fullName'], title_style))
        story.append(Spacer(1, 12))
    
    # Contact Information
    contact_info = []
    if personal_info.get('email'):
        contact_info.append(personal_info['email'])
    if personal_info.get('phone'):
        contact_info.append(personal_info['phone'])
    if personal_info.get('location'):
        contact_info.append(personal_info['location'])
    if personal_info.get('linkedin'):
        contact_info.append(personal_info['linkedin'])
    if personal_info.get('github'):
        contact_info.append(personal_info['github'])
    
    if contact_info:
        story.append(Paragraph(' | '.join(contact_info), normal_style))
        story.append(Spacer(1, 20))
    
    # Professional Summary
    if personal_info.get('summary'):
        summary_title = 'PROFESSIONAL SUMMARY' if template == 'modern' else 'Professional Summary'
        story.append(Paragraph(summary_title, heading_style))
        story.append(Paragraph(personal_info['summary'], normal_style))
        story.append(Spacer(1, 12))
    
    # Work Experience
    experience = resume_data.get('experience', [])
    if experience:
        exp_title = 'WORK EXPERIENCE' if template == 'modern' else 'Professional Experience'
        story.append(Paragraph(exp_title, heading_style))
        for exp in experience:
            # Job title and company
            job_info = f"<b>{exp.get('title', '')}</b>"
            if exp.get('company'):
                job_info += f" - {exp.get('company', '')}"
            story.append(Paragraph(job_info, normal_style))
            
            # Dates
            start_date = exp.get('startDate', '')
            end_date = exp.get('endDate', '') if not exp.get('isCurrentJob', False) else 'Present'
            if start_date or end_date:
                date_str = f"{start_date} - {end_date}" if start_date and end_date else start_date or end_date
                story.append(Paragraph(f"<i>{date_str}</i>", normal_style))
            
            # Description
            if exp.get('description'):
                story.append(Paragraph(exp['description'], normal_style))
            
            story.append(Spacer(1, 12))
    
    # Education
    education = resume_data.get('education', [])
    if education:
        edu_title = 'EDUCATION' if template == 'modern' else 'Education'
        story.append(Paragraph(edu_title, heading_style))
        for edu in education:
            # Degree and school
            edu_info = f"<b>{edu.get('degree', '')}</b>"
            if edu.get('school'):
                edu_info += f" - {edu.get('school', '')}"
            story.append(Paragraph(edu_info, normal_style))
            
            # Graduation date and GPA
            grad_date = edu.get('graduationDate', '')
            gpa = edu.get('gpa', '')
            if grad_date or gpa:
                details = []
                if grad_date:
                    details.append(grad_date)
                if gpa:
                    details.append(f"GPA: {gpa}")
                story.append(Paragraph(f"<i>{' | '.join(details)}</i>", normal_style))
            
            story.append(Spacer(1, 8))
    
    # Skills
    skills = resume_data.get('skills', '')
    if skills.strip():
        skills_title = 'SKILLS' if template == 'modern' else 'Core Competencies'
        story.append(Paragraph(skills_title, heading_style))
        story.append(Paragraph(skills, normal_style))
        story.append(Spacer(1, 12))
    
    # Projects
    projects = resume_data.get('projects', '')
    if projects.strip():
        projects_title = 'PROJECTS' if template == 'modern' else 'Key Projects'
        story.append(Paragraph(projects_title, heading_style))
        # Split into separate project entries on blank lines
        project_entries = [p.strip() for p in re.split(r"\n\s*\n+", projects) if p.strip()]
        if len(project_entries) <= 1:
            # Fallback: try splitting by single newlines used as bullets
            project_entries = [p.strip() for p in re.split(r"\n[-•*]?\s*", projects) if p.strip()]
        # Build a bulleted list with proper spacing
        bullet_items = []
        for entry in project_entries:
            # Create a paragraph with proper left margin
            para_style = ParagraphStyle(
                'ProjectBullet',
                parent=normal_style,
                leftIndent=25,
                spaceAfter=8
            )
            bullet_items.append(ListItem(Paragraph(entry, para_style), leftIndent=0, bulletIndent=15))
        
        story.append(ListFlowable(bullet_items, bulletType='bullet', start='bulletchar', leftIndent=0, spaceAfter=12))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer

async def _render_pdf_via_playwright(base_url: str, resume_data: dict, template_key: str) -> bytes:
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()
        # Seed localStorage for the React app (safe injection with structured arg)
        await page.add_init_script(
            script="(data) => { try { localStorage.setItem('resumeData', JSON.stringify(data)); } catch (e) {} }",
            arg=resume_data,
        )
        url = f"{base_url.rstrip('/')}/app/print?template={template_key}"
        await page.goto(url, wait_until='networkidle')
        try:
            await page.wait_for_function("window.__previewReady === true", timeout=10000)
        except Exception:
            pass
        pdf = await page.pdf(format='A4', print_background=True, margin={ 'top': '12mm', 'bottom': '12mm', 'left': '12mm', 'right': '12mm' })
        await context.close()
        await browser.close()
        return pdf

@app.route("/api/generate-pdf", methods=["POST"])
def api_generate_pdf():
    """Generate a PDF from provided resume data."""
    try:
        data = request.get_json(force=True, silent=True) or {}

        # Try headless browser (pixel-perfect) first
        if PLAYWRIGHT_AVAILABLE:
            try:
                template_key = (data.get('template') or 'modern').lower()
                base_url = request.host_url
                pdf_bytes = asyncio.run(_render_pdf_via_playwright(base_url, data, template_key))
                return send_file(BytesIO(pdf_bytes), as_attachment=True, download_name=f"{data.get('personalInfo', {}).get('fullName', 'Resume')}.pdf", mimetype='application/pdf')
            except Exception:
                # Fall back to ReportLab if Playwright errors
                pass

        # Fallback: ReportLab
        pdf_buffer = generate_pdf(data)
        return send_file(pdf_buffer, as_attachment=True, download_name=f"{data.get('personalInfo', {}).get('fullName', 'Resume')}.pdf", mimetype='application/pdf')
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# -------------------------------
# Main
# -------------------------------
if __name__ == "__main__":
    print("Backend ee server lo run avuthundi le po http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
