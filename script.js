const GENRE_STYLES = {
    "Action": { icon: "🔥", grad: "linear-gradient(135deg,#3a1414,#7a1f1f)" },
    "Sci-Fi": { icon: "🛸", grad: "linear-gradient(135deg,#12222b,#1f4d5c)" },
    "Drama": { icon: "🎭", grad: "linear-gradient(135deg,#241a2e,#4a2f5c)" },
    "Comedy": { icon: "😂", grad: "linear-gradient(135deg,#2e2410,#6b4f14)" },
    "Horror": { icon: "🕯️", grad: "linear-gradient(135deg,#150c12,#3a1220)" },
    "Animation": { icon: "🦊", grad: "linear-gradient(135deg,#0f2a24,#1f5c4a)" },
    "Thriller": { icon: "🗝️", grad: "linear-gradient(135deg,#181820,#333a4d)" },
    "Romance": { icon: "🌹", grad: "linear-gradient(135deg,#2b131c,#6b2438)" }
};

const MOVIES = [
    { id: 1, title: "Iron Vanguard", year: 2024, genre: "Action", rating: 8.2, duration: "2h 8m", trending: true },
    { id: 2, title: "Crimson Protocol", year: 2023, genre: "Action", rating: 7.6, duration: "1h 54m", trending: false },
    { id: 3, title: "Blackout City", year: 2025, genre: "Action", rating: 8.0, duration: "2h 2m", trending: false },

    { id: 4, title: "Echo Horizon", year: 2024, genre: "Sci-Fi", rating: 8.7, duration: "2h 16m", trending: true },
    { id: 5, title: "The Last Signal", year: 2022, genre: "Sci-Fi", rating: 7.9, duration: "1h 58m", trending: false },
    { id: 6, title: "Quantum Drift", year: 2025, genre: "Sci-Fi", rating: 8.4, duration: "2h 11m", trending: true },

    { id: 7, title: "Paper Lanterns", year: 2023, genre: "Drama", rating: 8.5, duration: "2h 4m", trending: true },
    { id: 8, title: "The Long Winter Road", year: 2021, genre: "Drama", rating: 7.8, duration: "1h 49m", trending: false },
    { id: 9, title: "Glasshouse", year: 2024, genre: "Drama", rating: 8.1, duration: "2h 6m", trending: false },

    { id: 10, title: "Kitchen Chaos", year: 2023, genre: "Comedy", rating: 7.3, duration: "1h 42m", trending: false },
    { id: 11, title: "The Wedding Heist", year: 2024, genre: "Comedy", rating: 7.5, duration: "1h 47m", trending: false },
    { id: 12, title: "Office Hours", year: 2022, genre: "Comedy", rating: 6.9, duration: "1h 36m", trending: false },

    { id: 13, title: "Hollow House", year: 2024, genre: "Horror", rating: 7.7, duration: "1h 51m", trending: false },
    { id: 14, title: "The Night Caller", year: 2023, genre: "Horror", rating: 7.2, duration: "1h 39m", trending: false },
    { id: 15, title: "Static", year: 2025, genre: "Horror", rating: 8.0, duration: "1h 57m", trending: true },

    { id: 16, title: "Sky Foxes", year: 2023, genre: "Animation", rating: 8.6, duration: "1h 44m", trending: true },
    { id: 17, title: "The Tin Robot's Journey", year: 2022, genre: "Animation", rating: 8.3, duration: "1h 38m", trending: false },
    { id: 18, title: "Wanderlight", year: 2024, genre: "Animation", rating: 8.8, duration: "1h 52m", trending: true },

    { id: 19, title: "Silent Ledger", year: 2024, genre: "Thriller", rating: 8.0, duration: "2h 3m", trending: false },
    { id: 20, title: "The Fourth Witness", year: 2023, genre: "Thriller", rating: 7.6, duration: "1h 55m", trending: false },
    { id: 21, title: "Midnight Exchange", year: 2025, genre: "Thriller", rating: 7.9, duration: "2h 0m", trending: false },

    { id: 22, title: "Two Train Tickets", year: 2022, genre: "Romance", rating: 7.4, duration: "1h 46m", trending: false },
    { id: 23, title: "Letters from Lisbon", year: 2024, genre: "Romance", rating: 7.8, duration: "1h 58m", trending: false },
    { id: 24, title: "The Way We Met Again", year: 2023, genre: "Romance", rating: 7.1, duration: "1h 41m", trending: false }
];

const GENRES = [...new Set(MOVIES.map(m => m.genre))];

function posterStyle(genre) {
    return GENRE_STYLES[genre] || { icon: "🎬", grad: "linear-gradient(135deg,#222,#444)" };
}

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
      <div class="card-sub"><span>${m.year}</span><span class="sep">·</span><span>${m.genre}</span><span class="sep">·</span><span>${m.duration}</span></div>
    </div>
  `;
    return card;
}

function renderCategoryNav() {
    const nav = document.getElementById('categoryNav');
    nav.innerHTML = '';
    GENRES.forEach(genre => {
        const link = document.createElement('a');
        link.className = 'nav-link';
        link.href = `#genre-${genre.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        link.textContent = genre;
        nav.appendChild(link);
    });
}

function renderHero() {
    const featured = MOVIES.find(m => m.id === 18);
    const g = posterStyle(featured.genre);
    const hero = document.getElementById('heroSection');
    hero.innerHTML = `
    <div class="hero-bg" style="background:${g.grad}"></div>
    <div class="hero-scanlines"></div>
    <div class="hero-scrim"></div>
    <div class="hero-content">
      <div class="hero-eyebrow">Featured Tonight</div>
      <h1 class="hero-title display">${featured.title}</h1>
      <div class="hero-meta">
        <span class="rating">★ ${featured.rating}</span>
        <span>${featured.year}</span>
        <span>·</span>
        <span>${featured.genre}</span>
        <span>·</span>
        <span>${featured.duration}</span>
      </div>
      <p class="hero-desc">A lighthouse keeper's daughter befriends a constellation that has fallen out of the sky and must return it before the stars notice.</p>
      <div class="hero-actions">
        <button class="btn btn-primary">▶ &nbsp;Watch Now</button>
        <button class="btn btn-ghost">＋ &nbsp;My List</button>
      </div>
    </div>
  `;
}

function renderRows() {
    const trendingRow = document.getElementById('trendingRow');
    const trending = MOVIES.filter(m => m.trending);
    document.getElementById('trendingCount').textContent = `${trending.length} titles`;
    trending.forEach(m => trendingRow.appendChild(movieCard(m)));

    const genreRowsWrap = document.getElementById('genreRows');
    GENRES.forEach(genre => {
        const list = MOVIES.filter(m => m.genre === genre);
        const section = document.createElement('section');
        section.className = 'row-section';
        section.id = `genre-${genre.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        section.innerHTML = `
      <div class="row-head">
        <div class="row-title">${genre}</div>
        <div class="row-count">${list.length} titles</div>
      </div>
      <div class="row-scroll"></div>
    `;
        const scrollEl = section.querySelector('.row-scroll');
        list.forEach(m => scrollEl.appendChild(movieCard(m)));
        genreRowsWrap.appendChild(section);
    });
}

renderCategoryNav();
renderHero();
renderRows();
