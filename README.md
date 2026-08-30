# Java Before DSA — Complete Prerequisites Guide

A personal, interactive revision site covering every Java concept you should be
comfortable with **before** starting serious Data Structures & Algorithms
practice. Built as a long-term reference you can keep coming back to — before
a coding interview, before restarting DSA after a break, or just to check what
you actually remember.

Pure HTML, CSS, and vanilla JavaScript. No frameworks, no build step, no
backend — open `index.html` and it works.

## What's covered

- **Java Basics** — variables, data types, casting, operators, Scanner & BufferedReader input
- **Conditions & Loops** — if/else, switch, for/while/do-while, break/continue, loop complexity
- **Methods** — declaration, static methods, overloading, passing arrays
- **Arrays** ⭐ — creation, traversal, search, reverse/copy, 2D arrays, the `Arrays` utility class
- **Strings** ⭐ — core methods, comparison, traversal, `StringBuilder`
- **Basic OOP** — class/object, constructors & `this`, a `Node` class, basic inheritance
- **Recursion** ⭐⭐ — base/recursive case, the call stack, recursion with arrays/strings
- **Collections** ⭐⭐ — `ArrayList`, `HashMap`, `HashSet`
- **Stack** and **Queue** — LIFO/FIFO via `Deque`
- **PriorityQueue** ⭐ — Java's built-in heap
- **Time & Space Complexity** ⭐⭐ — Big-O, simplification rules
- Reference tables: a **DSA cheat sheet** and a **complexity cheat sheet**
- **Common Java mistakes in DSA**, bad-vs-good, side by side
- An **"Am I ready for DSA?" checklist**
- A **preview** of what comes next in the DSA track itself (no detailed content yet — that's a future project)

## Features

- Search across every topic (press `/` to focus the search box, `Esc` to clear it)
- Per-topic "I understand this" checkboxes with progress saved in `localStorage`
- Overall progress shown in the hero, the sidebar, and as a fill along the roadmap
- Dark mode by default, with a light mode toggle (also saved locally)
- Sticky, scrollspy-highlighted sidebar navigation; collapsible mobile drawer
- Expand-all / collapse-all controls per section
- A separate, self-contained readiness checklist with its own progress ring
- "Reset progress" button (with a confirmation prompt)
- Back-to-top button, smooth scrolling, keyboard-friendly controls throughout

All progress lives only in your browser's `localStorage` — nothing is sent
anywhere, and clearing your browser data will reset it.

## File structure

```
java-dsa-prerequisites/
│
├── index.html   — all page content and structure
├── style.css    — design tokens, layout, and every component style
├── script.js    — theme, search, progress tracking, checklist, syntax highlighting
└── README.md    — this file
```

## Running locally

No build step needed. Either:

1. Open `index.html` directly in a browser, or
2. Serve the folder locally (recommended, avoids any `file://` quirks):

   ```bash
   cd java-dsa-prerequisites
   python3 -m http.server 8000
   ```

   Then visit `http://localhost:8000`.

## Deploying to GitHub Pages

1. Create a new GitHub repository and push this folder's contents to it:

   ```bash
   cd java-dsa-prerequisites
   git init
   git add .
   git commit -m "Initial commit: Java before DSA revision guide"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

2. On GitHub, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`,
   branch `main`, folder `/ (root)`.
4. Save. Your site will be live at
   `https://<your-username>.github.io/<your-repo>/` within a minute or two.

## Future improvements

- [ ] Add the actual DSA track content (Arrays → DP) as a second page/site, using the same design system
- [ ] Add a "revise mode" that only shows unchecked topics
- [ ] Add code-runnable snippets (e.g. via an embedded Java playground) for the trickier examples
- [ ] Export/import progress as a JSON file, for use across browsers/devices
- [ ] Add a print stylesheet for a compact, paper-friendly cheat sheet

## Notes

This is a personal study resource, not a general Java tutorial — it
deliberately skips anything not directly useful for starting DSA (advanced
OOP, generics internals, multithreading, I/O beyond basic input, etc.). If a
topic isn't here, it's because it wasn't judged necessary for this specific
on-ramp — feel free to fork and add to it.
