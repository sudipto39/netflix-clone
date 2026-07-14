# Netflix Clone Project Submission
## Member 1 and Member 2 Core Features

This document details the implementation of features assigned to **Member 1** (Homepage, Banner, Navbar, Footer) and **Member 2** (Movie Cards, Categories) for the Netflix Clone project.

---

## 👥 Roles & Feature Mapping

| Role | Responsibility | Implemented Features | Associated Code / Symbols |
| :--- | :--- | :--- | :--- |
| **Member 1** | **Homepage, Banner, Navbar, Footer** | - HTML Document structure and modern reset configuration.<br>- Dynamic header navigation menu showing list of categories.<br>- Large tonight featured banner showcase with CTA controls.<br>- Standard footer navigation link mapping. | - `renderCategoryNav()` in `script.js`<br>- `renderHero()` in `script.js`<br>- `header`, `footer`, `.hero` in `style.css`<br>- `index.html` structure (Header, Main, Footer scaffolding) |
| **Member 2** | **Movie Cards, Categories** | - Ticket-styled movie details card layouts.<br>- Floating rating badges and perforated separator styles.<br>- Auto-grouped movie horizontal scrolling rows. | - `movieCard()` in `script.js`<br>- `renderRows()` in `script.js`<br>- `.card`, `.card-poster`, `.card-rating-badge`, `.ticket-perf` in `style.css` |

---

## 🚀 Key Implementation Details

### 1. Application Layout Shell & Navbar (Member 1)
* **HTML Reset System**: Configured clean HTML5 semantic structure in [index.html](file:///d:/AiLabs/git/netflix-clone/index.html) using a custom typography reset (`Bebas Neue` display text and `Inter` body text) and root design variables.
* **Sticky Navbar Backdrop**: The `<header>` element is sticky-pinned to the top of the browser view, implementing a dark linear-gradient overlay with a dynamic CSS blur (`backdrop-filter: blur(6px)`) to keep navigation legible.
* **Dynamic Nav Mapping**: The function `renderCategoryNav()` queries the list of distinct genres present in the database and renders links dynamically in the main navigation wrapper (`#categoryNav`).

### 2. Featured Movie Banner / Hero Section (Member 1)
* **High-Impact Showcase**: Built the `.hero` display block positioned at the top of the viewport. It dynamically draws details from the featured movie in [script.js](file:///d:/AiLabs/git/netflix-clone/script.js) (Movie ID 18, *Wanderlight*).
* **Cinematic Styling**: Styled with a dark linear-gradient vignette overlay (`.hero-scrim`) and interactive button actions ("Watch Now" and "My List" triggers) to mirror streaming platforms.

### 3. Ticket-Styled Movie Cards (Member 2)
* **Unique Card Scaffolding**: Rather than simple box layouts, cards employ a movie-ticket motif. The layout features:
  - `.card-poster` (gradient-filled poster art colored by genre containing the emoji symbol).
  - `.ticket-perf` (a dashed perforation line with left and right semicircular cutouts that blend into the body background).
  - `.card-stub` (displays metadata like year, genre, and duration).
* **Hover Interaction**: Hovering on cards triggers a smooth vertical translation (`translateY(-6px)`), a dark drop shadow (`box-shadow`), and a highlight border outline.

### 4. Grouped Horizontal Category Rows (Member 2)
* **Automatic Row Generation**: The function `renderRows()` scans the complete list of unique movies, isolates trending items, and splits the remaining array items into row shelves based on their respective genres.
* **Horizontal Scrollability**: Rows use an overflow layout (`overflow-x: auto`) that hides standard scrollbars in Webkit browsers to provide a clean scroll shelf.

---

## 🛠️ Code Structure Highlights

### 📁 Navbar & Hero Structure ([index.html](file:///d:/AiLabs/git/netflix-clone/index.html))
The core skeleton of the application layout:
```html
<header>
    <div class="logo"><span>NETFLIX CLONE</span><span class="dot">.</span></div>
    <nav class="main-nav" id="categoryNav"></nav>
</header>

<main>
    <section class="hero" id="heroSection"></section>
    <!-- Dynamic horizontal lists loaded here -->
</main>
```

### 📁 Movie Card Generator ([script.js](file:///d:/AiLabs/git/netflix-clone/script.js))
Javascript builder pattern for creating individual movie items:
```javascript
function movieCard(m) {
    const g = posterStyle(m.genre);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
    <div class="card-poster" style="background:${g.grad}">
      <div class="card-rating-badge">★ ${m.rating}</div>
      <span>${g.icon}</span>
    </div>
    <div class="ticket-perf"></div>
    <div class="card-stub">
      <div class="card-title">${m.title}</div>
      <div class="card-sub"><span>${m.year}</span><span class="sep">·</span><span>${m.genre}</span></div>
    </div>
  `;
    return card;
}
```

### 📁 Ticket Styles & Variables ([style.css](file:///d:/AiLabs/git/netflix-clone/style.css))
Root variables and the ticket shape simulation:
```css
:root {
    --bg: #0B0B0D;
    --card: #1B1920;
    --gold: #E8B84B;
    --border: rgba(245, 241, 232, 0.09);
}

.ticket-perf {
    position: relative;
    height: 0;
    border-top: 2px dashed rgba(245, 241, 232, 0.18);
}
.ticket-perf::before, .ticket-perf::after {
    content: '';
    position: absolute;
    top: -7px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--bg);
}
.ticket-perf::before { left: -7px; }
.ticket-perf::after { right: -7px; }
```

---

## 📋 How to Verify the Submission

1. **Verify Navbar Layout**: Load the site. Verify that the navbar floats above content, displays distinct category links dynamically, and turns opaque as the page scrolls.
2. **Verify Hero Banner**: Confirm that the hero displays movie metadata (*Wanderlight*, Rating: ★ 8.8, Year: 2024, Genre: Animation, Duration: 1h 52m) and has functional hover actions.
3. **Verify Movie Cards**: Scroll down to see movie shelves. Ensure that each card fits the ticket structure (perforated cuts, rating badge, and sub-details) and elevates smoothly on hover.
4. **Verify Category Sorting**: Verify that movies are grouped inside their respective categories (e.g. Action, Sci-Fi, Drama) and scroll horizontally.
