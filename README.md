# Advait Chandorkar - Portfolio

## Run locally
The site loads its content from JSON files, so double-clicking `index.html` will not work.
From this folder run:

    python3 -m http.server 8000

then open http://localhost:8000 (on Windows: `python -m http.server 8000`).
VS Code alternative: install "Live Server", right-click `index.html`, Open with Live Server.

## Pages
    index.html          home: hero, about, experience, research, project slides, contact
    projects.html       all projects as cards with filters and the same popup
    publications.html   papers
    data/projects.json  every project (home slides and projects page both read this)
    data/site-data.json typed hero words, education, experience, research, publications,
                        skills, highlights, gallery photos, contact icons

## Images (put in images/)
Required, same names as before:
    home.png  advait.jpg  Project1.png ... Project6.png (Project4 is .jpeg)
New:
    Project7.png  Project8.png    the two projects added from your resume
Optional:
    gallery-1.jpg ... gallery-4.jpg   photos of you (FPV, club, lab, outdoors). A missing one is hidden.
Tips: crop project images to about 16:10 (1200x750), keep each under 300 KB.
Best project images are your own: an FEM stress plot, a CFD streamline render, a CAD screenshot.

## Add a project
Append an object to `data/projects.json` (comma between entries). It appears in the home slides,
on the projects page and in the popup. New categories get their own filter button.

    {
      "id": "my-new-project",
      "title": "Project name",
      "short": "One line for the card.",
      "description": "Longer text for the popup.",
      "highlights": ["Bullet 1", "Bullet 2"],
      "image": "images/Project9.png",
      "tags": ["Python", "CFD"],
      "category": "Research",
      "date": "2026",
      "links": [{ "label": "GitHub", "url": "https://github.com/..." }]
    }

Links whose url is "#" are hidden in the popup until you fill them in.

## Other edits
- Hero words: `typedWords` in `data/site-data.json`.
- Experience = paid roles (`experience`). Research = work with professors (`research`).
- Contact icons: `contact.links` (icon names are Font Awesome 6). Set your real LinkedIn URL there.
- Loader: shows on a fresh load or refresh of the home page, not when you come back from another page.
  To tweak the length, change `MIN` in `runLoader()` in `script.js`.
- Colours: the variables at the top of `style.css`.
