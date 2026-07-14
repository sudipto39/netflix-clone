# Netflix Clone Project Submission
## Member 3 and Member 4 Core Features

This document details the implementation of features assigned to **Member 3** (Search, Favorites, Genre Filtering) and **Member 4** (Movie Details Popup, Local Storage Persistence, Mobile Responsiveness) for the Netflix Clone project.

---

## 👥 Roles & Feature Mapping

| Role | Responsibility | Implemented Features | Associated Code / Symbols |
| :--- | :--- | :--- | :--- |
| **Member 3** | **Search, Favorites, Filtering** | - Live dynamic search matching title, genre, and year.<br>- Interactive favorite triggers (add/remove lists).<br>- Genre-specific grid view page transitions. | - `performSearch()` in `script.js`<br>- `toggleFavorite()` in `script.js`<br>- `filterCategory()` in `script.js`<br>- `#favoritesSection`, `#searchSection`, `#genreFilterSection` in `index.html` |
| **Member 4** | **Popup, Storage, Responsiveness** | - Dynamic glassmorphic movie details modal.<br>- Offline persistence using browser Local Storage API.<br>- High-end mobile/tablet CSS adaptations. | - `openModal()`, `closeModal()` in `script.js`<br>- `loadFavorites()`, `saveFavorites()` in `script.js`<br>- `.modal`, `.modal-overlay`, `.modal-content` in `style.css`<br>- `@media (max-width: 720px)` rules in `style.css` |

---

## 🚀 Key Implementation Details

### 1. Dynamic Search & Clear System (Member 3)
* **Real-time Querying**: Listening to the `#searchInput` element, the code filters the primary movies array against the user's input string, matching partially by title, genre, or release year.
* **Layout Switcher**: The function `performSearch()` dynamically hides the default horizontal movie rows and displays search results in an adaptive grid layout (`#searchSection`). If no matches occur, a user-friendly notice is shown.
* **Dismiss Controls**: Clicking the clear `x` icon reverts the main viewport to show the default homepage sections.

### 2. Favorites List & Persistence (Member 3 & 4)
* **Local Storage Syncing**: The `loadFavorites()` helper retrieves the list of favorited movie IDs from the browser's local storage database on startup. All addition/deletion operations update this store via `saveFavorites()`.
* **State Synchronization**: When a movie is favorited/unfavorited, the UI automatically updates:
  1. The heart icon state (`❤️` vs `🖤`) on all movie cards containing that ID.
  2. The action button within the hero details banner (`My List` state text).
  3. The dedicated "My List (Favorites)" horizontal shelf, which displays dynamically at the top of the homepage only when the list contains titles.

### 3. Movie Details Popup Modal (Member 4)
* **Dynamic Rendering**: Clicking on any movie card or the Hero Banner's buttons triggers the `openModal()` function, which populates the popup with the target movie's details (release year, rating, genre, duration, and custom actor/director metadata).
* **Premium UX/UI**: Styled using custom CSS variables, the modal has a dark backdrop blur overlay (`backdrop-filter: blur(8px)`) and a slide-up transition animation. 
* **Accessibility**: Users can close the modal by clicking the circular exit button, clicking outside the card on the backdrop, or pressing the `Escape` key.

### 4. Responsiveness and Mobile Adaptations (Member 4)
* **Elastic Spacing**: Spacing and sizes use relative view units (`vw`, `vh`) and CSS variables.
* **Grid Layout Adaptations**: Horizontal scroll rows wrap cleanly into flexible CSS grid rows on mobile screens, resizing card poster heights to `170px` for optimal viewing.
* **Collapsible Header Actions**: On smaller devices, header elements shift from a single line, wrapping the search input container underneath the navigation bar to maximize input area.

---

## 🛠️ Code Structure Highlights

### 📁 HTML Templates ([index.html](file:///d:/AiLabs/git/netflix-clone/index.html))
Added container structures for dynamic views:
```html
<!-- Search results grid -->
<section class="row-section hidden" id="searchSection">
    <div class="row-head">
        <div class="row-title">Search Results</div>
        <div class="row-count" id="searchCount">0 results</div>
    </div>
    <div class="grid-layout" id="searchGrid"></div>
</section>

<!-- Details modal wrapper -->
<div id="movieModal" class="modal hidden">
    <div class="modal-overlay" onclick="closeModal()"></div>
    <div class="modal-content">
        <!-- populated dynamically on click -->
    </div>
</div>
```

### 📁 Stylesheets ([style.css](file:///d:/AiLabs/git/netflix-clone/style.css))
Clean transitions, glassmorphism filters, and flex properties:
```css
.modal-overlay {
    position: absolute;
    inset: 0;
    background: rgba(6, 6, 8, 0.88);
    backdrop-filter: blur(8px);
}
.modal-content {
    animation: modalSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes modalSlideIn {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}
```

### 📁 Logic Script ([script.js](file:///d:/AiLabs/git/netflix-clone/script.js))
Clean dynamic updates binding elements:
```javascript
function toggleFavorite(id) {
    const index = favorites.indexOf(id);
    if (index === -1) {
        favorites.push(id);
    } else {
        favorites.splice(index, 1);
    }
    saveFavorites();
    updateFavoritesUI();
    updateFeaturedBtn(id);
}
```

---

## 📋 How to Verify the Submission

1. **Verify Search**: Type keywords into the search box in the header. Check that results update dynamically and other home content hides.
2. **Verify Details Popup**: Click any movie card or the "Watch Now" banner button. Ensure the movie modal renders content correctly and closes upon clicking "x", clicking the overlay, or pressing `Escape`.
3. **Verify Favorites & Storage**: Add a movie to "My List" from either a card or within the modal. Ensure the movie displays in the "My List" row. Reload the page and check that the movie remains inside the favorites list.
4. **Verify Mobile Display**: Resize the browser window to mobile widths. Verify the search bar, cards, and popup modal scale and wrap cleanly.
