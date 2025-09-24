from flask import Flask, render_template, request, send_file, jsonify, redirect, url_for, session
import re
import subprocess
from docx import Document
import os

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret-change-me")

# -------------------------------
# Configurable Ollama model
# -------------------------------
OLLAMA_MODEL = "gemma3:270m"

# -------------------------------
# Resume Enhancement Prompts (CAG-style)
# -------------------------------

resume_prompts = {
    "summary": (
        "You are an expert resume consultant and professional proofreader. "
        "Rewrite the Professional Summary in a polished, employer-focused manner. "
        "Strictly avoid first-person pronouns (I, me, my, we, our). "
        "Correct spelling and grammar errors while improving clarity, conciseness, and impact. "
        "Do NOT add any experience or skills not provided by the user. "
        "If the text is empty, provide a neutral, professional resume summary template. "
        "Highlight measurable strengths, results, or scope of expertise where possible. "
        "Limit to 50–70 words, adjusting naturally to input length. "
        "Use a confident, professional tone suitable for resumes. "
        "Return only the improved summary with no prefixes, explanations, or extra text."
    ),

    "experience": (
        "You are an expert resume consultant and professional proofreader. "
        "Rewrite the Work Experience section in a strong, professional style. "
        "Strictly avoid first-person pronouns. "
        "Highlight achievements, responsibilities, and quantifiable results using action verbs. "
        "Emphasize metrics, percentages, timelines, cost savings, or measurable outcomes where available. "
        "Do NOT add roles or responsibilities the user did not provide. "
        "Limit to 70–120 words, adjusting naturally to input length. "
        "Return only the improved version with no prefixes, explanations, or extra text."
    ),

    "skills": (
        "You are an expert resume consultant and professional proofreader. "
        "Rewrite the Skills section to be concise, organized, and professional. "
        "Strictly avoid first-person pronouns. "
        "Group related skills, include both technical and soft skills, and remove redundancy. "
        "When possible, emphasize proficiency levels or measurable expertise. "
        "Do NOT add skills the user does not have. "
        "Return only a clean, comma-separated list with no prefixes, headings, or extra text."
    ),

    "education": (
        "You are an expert resume consultant and professional proofreader. "
        "Rewrite the Education section to clearly and professionally present degrees, certifications, and coursework. "
        "Strictly avoid first-person pronouns. "
        "Correct spelling and grammar while keeping information concise and relevant to career goals. "
        "Where appropriate, highlight distinctions, GPAs, honors, or quantifiable outcomes. "
        "Do NOT add degrees, certifications, or coursework the user did not provide. "
        "Limit to 50–100 words, adjusting naturally to input length. "
        "Return only the improved version with no prefixes, explanations, or extra text."
    ),

    "projects": (
        "You are an expert resume consultant and professional proofreader. "
        "Rewrite the Projects section to highlight scope, technologies, contributions, and measurable results. "
        "Strictly avoid first-person pronouns. "
        "Include tangible outcomes, metrics, efficiency gains, or improvements achieved where possible. "
        "Do NOT add any projects or details not provided by the user. "
        "Correct spelling and grammar while keeping it professional. "
        "Limit to 50–100 words, adjusting naturally to input length. "
        "Return only the improved version with no prefixes, explanations, or extra text."
    ),

    "certifications": (
        "You are an expert resume consultant and professional proofreader. "
        "Rewrite the Certifications section to highlight relevant certifications in a professional manner. "
        "Strictly avoid first-person pronouns. "
        "Emphasize tangible career benefits, skills validated, or industry recognition when possible. "
        "Do NOT add certifications not provided by the user. "
        "Correct spelling and grammar. "
        "Limit to 30–60 words, adjusting naturally to input length. "
        "Return only the improved version with no prefixes, explanations, or extra text."
    ),

    "achievements": (
        "You are an expert resume consultant and professional proofreader. "
        "Rewrite the Achievements section to highlight awards, recognitions, and accomplishments. "
        "Strictly avoid first-person pronouns. "
        "Use a results-oriented style with quantifiable outcomes, measurable impact, or competitive distinctions. "
        "Do NOT add achievements not provided by the user. "
        "Correct spelling and grammar. "
        "Limit to 40–80 words, adjusting naturally to input length. "
        "Return only the improved version with no prefixes, explanations, or extra text."
    )
}
# -------------------------------
# Helper Functions
# -------------------------------
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
        f"{global_rules}\n{resume_prompts[section_key]}\n\n"
        f"User Input:\n{user_input}\n\nImproved Content:"
    )

    try:
        result = subprocess.run(
            ["ollama", "run", OLLAMA_MODEL, combined_prompt],
            capture_output=True,
            text=True,
            check=True,
            timeout=90
        )
        enhanced_text = result.stdout.strip()

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

        # 1) Keep only content after the last 'Improved Content:' marker (case-insensitive)
        if re.search(r"improved\s*content\s*:", enhanced_text, flags=re.IGNORECASE):
            parts = re.split(r"improved\s*content\s*:", enhanced_text, flags=re.IGNORECASE)
            enhanced_text = parts[-1].strip()

        # 2) Remove any echoed 'Global Editing Rules' block anywhere
        enhanced_text = re.sub(r"^\s*global\s+editing\s+rules:?[\s\S]*?(?:\n\s*user\s+input\s*:\s*|$)", "", enhanced_text, flags=re.IGNORECASE)

        # 3) Remove any echoed 'User Input:' header if present
        enhanced_text = re.sub(r"^\s*user\s+input\s*:\s*", "", enhanced_text, flags=re.IGNORECASE)

        # Remove any explanation lines the model may add
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
            ))
        ]
        enhanced_text = "\n".join(filtered_lines).strip()

        # Preserve bullets/asterisks; trim whitespace only
        enhanced_text = enhanced_text.strip()

        # Normalize skills output to comma-separated list without labels
        if section_key == "skills":
            lines = [ln.strip().lstrip("-•*") for ln in enhanced_text.splitlines() if ln.strip()]
            filtered = [ln for ln in lines if not ln.lower().startswith(("explanation", "note", "reason", "changes"))]
            text = ", ".join(filtered)
            if text.lower().startswith("skills:"):
                text = text[7:].strip()
            enhanced_text = text

        return enhanced_text if enhanced_text else user_input

    except subprocess.TimeoutExpired:
        print(f" Timeout enhancing {section_name}")
        return user_input
    except subprocess.CalledProcessError as e:
        print(f"Ollama error for {section_name}: {e.stderr}")
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
    enhanced_resume = {}
    download_file = None

    if request.method == "POST":
        for section in resume_prompts.keys():
            user_input = request.form.get(section, "")
            if user_input.strip():
                enhanced_text = enhance_section(section, user_input)
                if enhanced_text:
                    enhanced_resume[section] = enhanced_text

        if enhanced_resume:
            download_file = save_resume_docx(enhanced_resume)

    return render_template("index.html", enhanced_resume=enhanced_resume, download_file=download_file)

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

@app.route("/health")
def health_check():
    """Check Ollama and model availability"""
    try:
        result = subprocess.run(["ollama", "list"], capture_output=True, text=True, check=True)
        model_available = OLLAMA_MODEL in result.stdout
        return jsonify({'status': 'healthy', 'ollama_running': True, 'model_available': model_available})
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'ollama_running': False, 'error': str(e)}), 500

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
# Main
# -------------------------------
if __name__ == "__main__":
    print("Starting Flask app on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
