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

// --- Favorites and Local Storage State ---
let favorites = [];

function loadFavorites() {
    try {
        const stored = localStorage.getItem('netflix_favorites');
        favorites = stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to load favorites from localStorage", e);
        favorites = [];
    }
}

function saveFavorites() {
    try {
        localStorage.setItem('netflix_favorites', JSON.stringify(favorites));
    } catch (e) {
        console.error("Failed to save favorites to localStorage", e);
    }
}

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

function updateFavoritesUI() {
    const favSection = document.getElementById('favoritesSection');
    const favRow = document.getElementById('favoritesRow');
    const favCount = document.getElementById('favoritesCount');
    
    favRow.innerHTML = '';
    
    if (favorites.length === 0) {
        favSection.classList.add('hidden');
    } else {
        favSection.classList.remove('hidden');
        favCount.textContent = `${favorites.length} title${favorites.length !== 1 ? 's' : ''}`;
        
        const favMovies = MOVIES.filter(m => favorites.includes(m.id));
        favMovies.forEach(m => favRow.appendChild(movieCard(m)));
    }

    // Synchronize heart button icons across all active cards
    document.querySelectorAll('.card-fav-btn').forEach(btn => {
        const id = parseInt(btn.dataset.id);
        const isActive = favorites.includes(id);
        btn.classList.toggle('active', isActive);
        btn.innerHTML = isActive ? '❤️' : '🖤';
    });
}

function updateFeaturedBtn(id) {
    const featured = MOVIES.find(m => m.id === 18);
    if (id === featured.id) {
        const btn = document.getElementById('heroFavBtn');
        if (btn) {
            const isFav = favorites.includes(featured.id);
            btn.innerHTML = isFav ? '❤️ &nbsp;In My List' : '＋ &nbsp;My List';
        }
    }
}

// --- Poster and Card Renderers ---
function posterStyle(genre) {
    return GENRE_STYLES[genre] || { icon: "🎬", grad: "linear-gradient(135deg,#222,#444)" };
}

function movieCard(m) {
    const g = posterStyle(m.genre);
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View details for ${m.title}`);
    
    const isFav = favorites.includes(m.id);
    card.innerHTML = `
    <button class="card-fav-btn ${isFav ? 'active' : ''}" data-id="${m.id}" aria-label="Toggle Favorite">
      ${isFav ? '❤️' : '🖤'}
    </button>
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
  
    // Bind favorite heart click to state logic
    card.querySelector('.card-fav-btn').addEventListener('click', (e) => {
        e.stopPropagation(); // prevent opening details modal
        toggleFavorite(m.id);
    });

    // Bind card click to details modal open logic
    card.addEventListener('click', () => {
        openModal(m.id);
    });

    return card;
}

// --- Navigation Renderers ---
let activeGenreFilter = null;

function renderCategoryNav() {
    const nav = document.getElementById('categoryNav');
    nav.innerHTML = '';
    
    // Home button to clear filters
    const homeLink = document.createElement('a');
    homeLink.className = 'nav-link active';
    homeLink.href = '#';
    homeLink.textContent = 'Home';
    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        showHome();
    });
    nav.appendChild(homeLink);

    GENRES.forEach(genre => {
        const link = document.createElement('a');
        link.className = 'nav-link';
        link.href = '#';
        link.textContent = genre;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            filterCategory(genre);
        });
        nav.appendChild(link);
    });
}

function renderHero() {
    const featured = MOVIES.find(m => m.id === 18);
    const g = posterStyle(featured.genre);
    const hero = document.getElementById('heroSection');
    const isFav = favorites.includes(featured.id);
    
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
        <button class="btn btn-primary" onclick="openModal(${featured.id})">▶ &nbsp;Watch Now</button>
        <button class="btn btn-ghost" id="heroFavBtn" onclick="event.stopPropagation(); toggleFavorite(${featured.id})">
          ${isFav ? '❤️ &nbsp;In My List' : '＋ &nbsp;My List'}
        </button>
      </div>
    </div>
  `;
}

function renderRows() {
    const trendingRow = document.getElementById('trendingRow');
    trendingRow.innerHTML = '';
    const trending = MOVIES.filter(m => m.trending);
    document.getElementById('trendingCount').textContent = `${trending.length} titles`;
    trending.forEach(m => trendingRow.appendChild(movieCard(m)));

    const genreRowsWrap = document.getElementById('genreRows');
    genreRowsWrap.innerHTML = '';
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

// --- Navigation Actions ---
function showHome() {
    activeGenreFilter = null;
    
    const navLinks = document.querySelectorAll('#categoryNav .nav-link');
    navLinks.forEach((link, idx) => {
        if (idx === 0) {
            link.classList.add('active');
            link.classList.remove('brand-cta');
        } else {
            link.classList.remove('active');
            link.classList.remove('brand-cta');
        }
    });

    document.getElementById('searchInput').value = '';
    document.getElementById('searchClear').classList.add('hidden');
    
    document.getElementById('genreFilterSection').classList.add('hidden');
    document.getElementById('searchSection').classList.add('hidden');
    
    document.getElementById('heroSection').classList.remove('hidden');
    document.getElementById('homepageContent').classList.remove('hidden');
    
    updateFavoritesUI();
}

function filterCategory(genre) {
    activeGenreFilter = genre;
    
    const navLinks = document.querySelectorAll('#categoryNav .nav-link');
    navLinks.forEach(link => {
        if (link.textContent === genre) {
            link.classList.add('brand-cta');
            link.classList.remove('active');
        } else {
            link.classList.remove('brand-cta');
            link.classList.remove('active');
        }
    });

    // Clear search
    document.getElementById('searchInput').value = '';
    document.getElementById('searchClear').classList.add('hidden');
    document.getElementById('searchSection').classList.add('hidden');
    
    // Adjust sections visibility
    document.getElementById('homepageContent').classList.add('hidden');
    document.getElementById('favoritesSection').classList.add('hidden');
    document.getElementById('heroSection').classList.add('hidden');
    
    const filterSection = document.getElementById('genreFilterSection');
    const filterGrid = document.getElementById('genreFilterGrid');
    const filterTitle = document.getElementById('filterGenreTitle');
    const filterCount = document.getElementById('filterGenreCount');
    
    filterTitle.innerHTML = `${genre} Movies <span class="tag">GENRE</span>`;
    filterGrid.innerHTML = '';
    
    const list = MOVIES.filter(m => m.genre === genre);
    filterCount.textContent = `${list.length} titles`;
    
    list.forEach(m => filterGrid.appendChild(movieCard(m)));
    filterSection.classList.remove('hidden');
}

function showFavoritesSection() {
    showHome();
    const favSection = document.getElementById('favoritesSection');
    if (favSection.classList.contains('hidden') && favorites.length > 0) {
        favSection.classList.remove('hidden');
    }
    favSection.scrollIntoView({ behavior: 'smooth' });
}

// --- Search Implementation ---
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    if (query.length > 0) {
        searchClear.classList.remove('hidden');
        performSearch(query);
    } else {
        searchClear.classList.add('hidden');
        document.getElementById('searchSection').classList.add('hidden');
        
        if (activeGenreFilter) {
            filterCategory(activeGenreFilter);
        } else {
            showHome();
        }
    }
});

searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.focus();
    searchClear.classList.add('hidden');
    document.getElementById('searchSection').classList.add('hidden');
    if (activeGenreFilter) {
        filterCategory(activeGenreFilter);
    } else {
        showHome();
    }
});

function performSearch(query) {
    document.getElementById('homepageContent').classList.add('hidden');
    document.getElementById('favoritesSection').classList.add('hidden');
    document.getElementById('heroSection').classList.add('hidden');
    document.getElementById('genreFilterSection').classList.add('hidden');
    
    document.querySelectorAll('#categoryNav .nav-link').forEach(link => {
        link.classList.remove('brand-cta');
        link.classList.remove('active');
    });
    
    const searchSection = document.getElementById('searchSection');
    const searchGrid = document.getElementById('searchGrid');
    const searchCount = document.getElementById('searchCount');
    
    searchGrid.innerHTML = '';
    
    const matches = MOVIES.filter(m => 
        m.title.toLowerCase().includes(query) || 
        m.genre.toLowerCase().includes(query) ||
        m.year.toString().includes(query)
    );
    
    searchCount.textContent = `${matches.length} result${matches.length !== 1 ? 's' : ''}`;
    
    if (matches.length > 0) {
        matches.forEach(m => searchGrid.appendChild(movieCard(m)));
    } else {
        searchGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: var(--muted); padding: 60px 0; font-size: 15px;">
                No matches found for "${query}". Try searching other titles or categories.
            </div>`;
    }
    
    searchSection.classList.remove('hidden');
}

// --- Details Modal Popup Logic ---
const descriptions = {
    1: "An elite defender is tasked with protecting a futuristic city from alien invaders.",
    2: "A secret operative uncovers a conspiracy within the high-security computer database network.",
    3: "When the city loses electricity, a detective must solve a series of mysterious robberies.",
    4: "A crew travels to the edge of the universe to capture a beacon signal from a missing shuttle.",
    5: "The final message from a deep-space probe reveals an unexpected habitable world.",
    6: "A group of scientists discover a portal to alternate dimensions inside their lab basement.",
    7: "In a quiet village, an artist builds paper lanterns that hold messages to long-lost family members.",
    8: "Two siblings embark on a dangerous road trip across frozen plains to find their father.",
    9: "A family lives in a fully glass structure where they must hide from a mysterious external threat.",
    10: "A fast-paced kitchen crew tries to keep order during the busiest dinner service of the year.",
    11: "A group of mismatched friends try to steal back an expensive gift from a wedding reception.",
    12: "The hilarious everyday antics of employees working at a generic tech corporation office.",
    13: "An investigator spends a night inside an abandoned manor that is rumored to be haunted.",
    14: "A late-night radio host receives creepy calls from an anonymous listener claiming to be nearby.",
    15: "A photographer notices strange phantom figures appearing in white noise television static.",
    16: "A team of hotshot pilot foxes defend their sky base from mechanical hawk invaders.",
    17: "A discarded toy robot sets out on a cross-country journey to locate its original owner.",
    18: "A lighthouse keeper's daughter befriends a constellation that has fallen out of the sky and must return it before the stars notice.",
    19: "An accountant uncovers a set of secret files detailing high-level government conspiracies.",
    20: "A forensic analyst becomes the fourth witness to a crime they were assigned to investigate.",
    21: "Two rival smugglers attempt to complete a swap at midnight under the city bridge.",
    22: "Two strangers meet on a cross-country train and discover they share a strange connection.",
    23: "A collection of handwritten letters sent to Lisbon reveals a multi-generational romance.",
    24: "A nostalgic meeting between high school sweethearts in their hometown library."
};

function openModal(movieId) {
    const m = MOVIES.find(movie => movie.id === movieId);
    if (!m) return;
    
    const g = posterStyle(m.genre);
    document.getElementById('modalHeroBg').style.background = g.grad;
    document.getElementById('modalTitle').textContent = m.title;
    document.getElementById('modalRating').textContent = `★ ${m.rating}`;
    document.getElementById('modalYear').textContent = m.year;
    document.getElementById('modalGenre').textContent = m.genre;
    document.getElementById('modalDuration').textContent = m.duration;
    
    document.getElementById('modalDesc').textContent = descriptions[m.id] || "No description available.";
    
    // Set dynamic cast & director names based on ID
    document.getElementById('modalCast').textContent = `Actor ${m.id}A, Actor ${m.id}B, Actor ${m.id}C`;
    document.getElementById('modalDirector').textContent = `Director ${m.id}`;
    
    const favBtn = document.getElementById('modalFavBtn');
    const updateModalFavBtn = () => {
        const isFav = favorites.includes(m.id);
        favBtn.innerHTML = isFav ? '❤️ &nbsp;In My List' : '＋ &nbsp;My List';
        if (isFav) {
            favBtn.classList.remove('btn-ghost');
            favBtn.classList.add('btn-primary');
        } else {
            favBtn.classList.add('btn-ghost');
            favBtn.classList.remove('btn-primary');
        }
    };
    updateModalFavBtn();
    
    favBtn.onclick = () => {
        toggleFavorite(m.id);
        updateModalFavBtn();
    };
    
    document.getElementById('modalPlayBtn').onclick = () => {
        alert(`Playing: "${m.title}"`);
    };
    
    const modal = document.getElementById('movieModal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    document.addEventListener('keydown', handleEscapeKey);
}

function closeModal() {
    const modal = document.getElementById('movieModal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    
    document.removeEventListener('keydown', handleEscapeKey);
}

function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
}

// --- Initialization ---
loadFavorites();
renderCategoryNav();
renderHero();
renderRows();
updateFavoritesUI();
