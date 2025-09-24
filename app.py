from flask import Flask, render_template, request, send_file, jsonify, redirect, url_for, session
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
        "Enhance the Professional Summary/Objective. "
        "Correct spelling and improve clarity, but do NOT invent experience. "
        "Use a confident, employer-focused tone. "
        "Output 3-5 sentences, each on a new line (min 3 lines). "
        "If input is empty, produce a neutral professional template (3 lines). "
        "Return only the improved text with no prefixes or headings."
    ),

    "experience": (
        "You are an expert resume consultant and professional proofreader. "
        "Enhance the Work Experience section to highlight achievements, responsibilities, and measurable impact. "
        "Correct any spelling mistakes. "
        "Use action verbs and quantify results where possible. "
        "Do NOT add any experience the user does not have. "
        "Limit the section to approximately 70-120 words, adjusting naturally to the input length. "
        "Always produce a polished, professional version. "
        "Return only one improved version with no prefixes, headings, or commentary."
    ),

    "skills": (
        "You are an expert resume consultant and professional proofreader. "
        "Improve the Skills section to be concise, organized, and impressive. "
        "Correct any spelling mistakes. "
        "Group skills logically, include technical and soft skills, and remove redundancy. "
        "Do NOT add any skills the user does not have. "
        "Return one comma-separated list with no prefixes or headings."
    ),

    "education": (
        "You are an expert resume consultant and professional proofreader. "
        "Rewrite Education clearly and concisely. "
        "Correct spelling. Do NOT add details (e.g., GPA, honors, coursework) unless explicitly present. "
        "Preserve exact degree titles and institution names; do not infer. "
        "Limit to 2-3 compact sentences total. "
        "Return only the improved text with no prefixes or headings."
    ),

    "projects": (
        "You are an expert resume consultant and professional proofreader. "
        "Enhance each project while preserving the number of projects and their order. "
        "Input format: one project per line. Output format: one improved project per line (same count). "
        "Do NOT add or remove projects. Correct spelling, highlight scope, tech, contributions, and impact. "
        "Return only the improved lines with no prefixes or headings."
    ),

    "certifications": (
        "You are an expert resume consultant and professional proofreader. "
        "Improve the Certifications section to highlight relevant certifications and their impact. "
        "Correct any spelling mistakes. "
        "Do NOT add any certifications the user does not have. "
        "Limit the section to approximately 30-60 words, adjusting naturally to input length. "
        "Return only one improved version with no prefixes or headings."
    ),

    "achievements": (
        "You are an expert resume consultant and professional proofreader. "
        "Enhance the Achievements section to highlight awards, recognitions, or accomplishments. "
        "Correct any spelling mistakes. "
        "Do NOT add any achievements the user does not have. "
        "Limit the section to approximately 40-80 words, adjusting naturally to input length. "
        "Return one concise, quantifiable, professional version with no prefixes or headings."
    ),

    "hobbies": (
        "You are an expert resume consultant and professional proofreader. "
        "Improve the Hobbies/Interests section to be professional, relevant, and reflective of skills. "
        "Correct any spelling mistakes. "
        "Do NOT add hobbies the user does not have. "
        "Limit the section to approximately 20-50 words, adjusting naturally to input length. "
        "Return only one improved version with no prefixes or headings."
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
