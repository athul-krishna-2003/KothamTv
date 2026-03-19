let currentType = null;

/* ============================= */
/* ===== ERROR TOAST ========== */
/* ============================= */

function showError(msg) {
  const toast = document.getElementById("errorToast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3500);
}

/* ============================= */
/* ===== DID YOU MEAN? ======== */
/* ============================= */

function showDidYouMean(suggestions, type) {
  const preview = document.getElementById("posterPreview");
  if (!preview) return;

  preview.style.display = "block";
  preview.innerHTML = `
    <p class="did-you-mean-label">🔍 Did you mean?</p>
    <div class="did-you-mean-row">
      ${suggestions.map(item => `
        <div class="dym-card" onclick="selectDidYouMean('${item.title.replace(/'/g, "\\'")}', '${item.imdbID}', '${item.poster || ""}', '${type}')">
          ${item.poster
            ? `<img src="${item.poster}" class="dym-poster">`
            : `<div class="dym-poster-placeholder">🎬</div>`
          }
          <span class="dym-title">${item.title}</span>
          <span class="dym-year">${item.year}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function selectDidYouMean(title, imdbID, poster, type) {
  const input = document.getElementById("title");
  if (input) {
    input.value = title;
    input.dataset.imdbId = imdbID;
  }

  const preview = document.getElementById("posterPreview");
  if (preview) {
    preview.innerHTML = "";
    preview.style.display = "none";
  }

  showPosterPreview(poster, title);

  // Auto submit with the correct imdbID directly
  if (type === "movie") {
    submitMovieWithId(imdbID, title, poster);
  } else {
    submitSeriesWithId(imdbID, title, poster);
  }
}

async function submitMovieWithId(imdbID, title, poster) {
  setLoading(true);
  document.body.classList.add("page-slide");
  setTimeout(() => {
    window.location.href = `/watch/?type=movie&imdb=${imdbID}&title=${encodeURIComponent(title)}&poster=${encodeURIComponent(poster || "")}`;
  }, 500);
}

async function submitSeriesWithId(imdbID, title, poster) {
  const season = document.getElementById("season")?.value.trim();
  const episode = document.getElementById("episode")?.value.trim();

  if (!season || !episode) {
    showError("Please enter season and episode number.");
    return;
  }

  setLoading(true);
  document.body.classList.add("page-slide");
  setTimeout(() => {
    window.location.href = `/watch/?type=series&imdb=${imdbID}&season=${season}&episode=${episode}&title=${encodeURIComponent(title)}&poster=${encodeURIComponent(poster || "")}`;
  }, 500);
}

/* ============================= */
/* ===== MOVIE / SERIES UI ===== */
/* ============================= */

function showMovie() {
  currentType = "movie";

  // Highlight active button
  document.getElementById("movieBtn").classList.add("active-btn");
  document.getElementById("seriesBtn").classList.remove("active-btn");

  const formArea = document.getElementById("formArea");

  // Animate out old content
  formArea.classList.remove("form-visible");

  setTimeout(() => {
    formArea.innerHTML = `
      <div class="input-wrapper">
        <input id="title" placeholder="Enter movie name" autocomplete="off">
        <div id="suggestions" class="suggestions-box"></div>
      </div>
      <div id="posterPreview" class="poster-preview"></div>
      <button class="submit-btn" id="submitBtn" onclick="submitMovie()">
        <span id="btnText">Search</span>
        <span id="btnSpinner" class="spinner" style="display:none;"></span>
      </button>
    `;

    formArea.classList.add("form-visible");

    const input = document.getElementById("title");
    input.focus();

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") submitMovie();
    });

    input.addEventListener("input", function () {
      handleSuggestions(this.value, "movie");
    });
  }, 200);
}

function showSeries() {
  currentType = "series";

  document.getElementById("seriesBtn").classList.add("active-btn");
  document.getElementById("movieBtn").classList.remove("active-btn");

  const formArea = document.getElementById("formArea");
  formArea.classList.remove("form-visible");

  setTimeout(() => {
    formArea.innerHTML = `
      <div class="input-wrapper">
        <input id="title" placeholder="Series name" autocomplete="off">
        <div id="suggestions" class="suggestions-box"></div>
      </div>
      <div class="series-fields">
        <input id="season" placeholder="Season" inputmode="numeric">
        <input id="episode" placeholder="Episode" inputmode="numeric">
      </div>
      <div id="posterPreview" class="poster-preview"></div>
      <button class="submit-btn" id="submitBtn" onclick="submitSeries()">
        <span id="btnText">Search</span>
        <span id="btnSpinner" class="spinner" style="display:none;"></span>
      </button>
    `;

    formArea.classList.add("form-visible");

    const inputs = document.querySelectorAll("#formArea input");
    inputs[0].focus();

    inputs.forEach(input => {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") submitSeries();
      });
    });

    document.getElementById("title").addEventListener("input", function () {
      handleSuggestions(this.value, "series");
    });
  }, 200);
}

/* ============================= */
/* ===== SEARCH SUGGESTIONS ==== */
/* ============================= */

let suggestionTimeout = null;

async function handleSuggestions(query, type) {
  const box = document.getElementById("suggestions");
  if (!box) return;

  if (query.length < 2) {
    box.innerHTML = "";
    box.style.display = "none";
    return;
  }

  clearTimeout(suggestionTimeout);

  suggestionTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`/api/search/?q=${encodeURIComponent(query)}&type=${type}`);
      const data = await res.json();

      if (data.results && data.results.length > 0) {
        box.innerHTML = data.results.map(item => `
          <div class="suggestion-item" onclick="selectSuggestion('${item.title.replace(/'/g, "\\'")}', '${item.imdbID}', '${item.poster || ""}')">
            ${item.poster
              ? `<img src="${item.poster}" class="suggestion-poster">`
              : `<div class="suggestion-poster-placeholder">🎬</div>`
            }
            <div class="suggestion-info">
              <span class="suggestion-title">${item.title}</span>
              <span class="suggestion-year">${item.year}</span>
            </div>
          </div>
        `).join("");
        box.style.display = "block";
      } else {
        box.innerHTML = "";
        box.style.display = "none";
      }
    } catch (e) {
      box.style.display = "none";
    }
  }, 300);
}

function selectSuggestion(title, imdbID, poster) {
  const input = document.getElementById("title");
  if (input) input.value = title;

  const box = document.getElementById("suggestions");
  if (box) {
    box.innerHTML = "";
    box.style.display = "none";
  }

  // Show poster preview
  showPosterPreview(poster, title);

  // Store selected imdbID
  input.dataset.imdbId = imdbID;
}

function showPosterPreview(poster, title) {
  const preview = document.getElementById("posterPreview");
  if (!preview) return;

  if (poster) {
    preview.innerHTML = `
      <img src="${poster}" class="preview-poster" alt="${title}">
      <p class="preview-title">${title}</p>
    `;
    preview.style.display = "block";
  } else {
    preview.innerHTML = "";
    preview.style.display = "none";
  }
}

/* ============================= */
/* ===== LOADING STATE ========= */
/* ============================= */

function setLoading(isLoading) {
  const btn = document.getElementById("submitBtn");
  const text = document.getElementById("btnText");
  const spinner = document.getElementById("btnSpinner");

  if (!btn) return;

  if (isLoading) {
    btn.disabled = true;
    text.style.display = "none";
    spinner.style.display = "inline-block";
  } else {
    btn.disabled = false;
    text.style.display = "inline";
    spinner.style.display = "none";
  }
}

/* ============================= */
/* ===== SUBMIT HANDLERS ======= */
/* ============================= */

async function submitMovie() {
  const input = document.getElementById("title");
  const title = input?.value.trim();

  if (!title) {
    showError("Please enter a movie name.");
    return;
  }

  // Close suggestions
  const box = document.getElementById("suggestions");
  if (box) box.style.display = "none";

  setLoading(true);

  try {
    const res = await fetch(`/api/fetch/?title=${encodeURIComponent(title)}&type=movie`);
    const data = await res.json();

    if (!res.ok || data.error) {
      // Did you mean?
      if (data.suggestions && data.suggestions.length > 0) {
        showDidYouMean(data.suggestions, "movie");
      } else {
        showError(data.error || "Movie not found.");
      }
      setLoading(false);
      return;
    }

    // Show poster before redirecting
    showPosterPreview(data.poster, data.title);

    document.body.classList.add("page-slide");

    setTimeout(() => {
      window.location.href = `/watch/?type=movie&imdb=${data.imdbID}&title=${encodeURIComponent(data.title)}&poster=${encodeURIComponent(data.poster || "")}`;
    }, 500);

  } catch (error) {
    showError("Something went wrong. Try again.");
    setLoading(false);
  }
}

async function submitSeries() {
  const input = document.getElementById("title");
  const title = input?.value.trim();
  const season = document.getElementById("season")?.value.trim();
  const episode = document.getElementById("episode")?.value.trim();

  if (!title) {
    showError("Please enter a series name.");
    return;
  }
  if (!season || !episode) {
    showError("Please enter season and episode number.");
    return;
  }

  const box = document.getElementById("suggestions");
  if (box) box.style.display = "none";

  setLoading(true);

  try {
    const res = await fetch(`/api/fetch/?title=${encodeURIComponent(title)}&type=series`);
    const data = await res.json();

    if (!res.ok || data.error) {
      // Did you mean?
      if (data.suggestions && data.suggestions.length > 0) {
        showDidYouMean(data.suggestions, "series");
      } else {
        showError(data.error || "Series not found.");
      }
      setLoading(false);
      return;
    }

    showPosterPreview(data.poster, data.title);

    document.body.classList.add("page-slide");

    setTimeout(() => {
      window.location.href = `/watch/?type=series&imdb=${data.imdbID}&season=${season}&episode=${episode}&title=${encodeURIComponent(data.title)}&poster=${encodeURIComponent(data.poster || "")}`;
    }, 500);

  } catch (error) {
    showError("Something went wrong. Try again.");
    setLoading(false);
  }
}

/* ============================= */
/* ===== TYPING ANIMATION ===== */
/* ============================= */

const typedElement = document.getElementById("typed-text");

if (typedElement) {
  const text = "Watch your favorite movies & series instantly.";
  let index = 0;

  function typeEffect() {
    if (index < text.length) {
      typedElement.innerHTML += text.charAt(index);
      index++;
      setTimeout(typeEffect, 40);
    }
  }

  setTimeout(typeEffect, 1500);
}

/* ============================= */
/* ===== PARTICLE SYSTEM ===== */
/* ============================= */

const canvas = document.getElementById("particles");

if (canvas) {
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let particlesArray = [];

  for (let i = 0; i < 80; i++) {
    particlesArray.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2,
      speedX: Math.random() * 0.5 - 0.25,
      speedY: Math.random() * 0.5 - 0.25
    });
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    particlesArray.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(animateParticles);
  }

  animateParticles();
}

/* ============================= */
/* ===== RECENTLY WATCHED ====== */
/* ============================= */

function loadRecentlyWatched() {
  const history = JSON.parse(localStorage.getItem("kotham_history") || "[]");
  const section = document.getElementById("recentSection");
  const row = document.getElementById("recentRow");

  if (!section || !row || history.length === 0) return;

  section.style.display = "block";

  row.innerHTML = history.map(item => `
    <div class="history-card" onclick="playFromHistory('${item.type}', '${item.imdb}', '${item.season || ""}', '${item.episode || ""}', '${encodeURIComponent(item.title || "")}', '${encodeURIComponent(item.poster || "")}')">
      ${item.poster
        ? `<img src="${decodeURIComponent(item.poster)}" class="history-poster">`
        : `<div class="history-poster-placeholder">🎬</div>`
      }
      <div class="history-info">
        <span class="history-title">${item.title || item.imdb}</span>
        ${item.type === "series"
          ? `<span class="history-meta">S${item.season} E${item.episode}</span>`
          : `<span class="history-meta">Movie</span>`
        }
      </div>
    </div>
  `).join("");
}

/* ============================= */
/* ===== CONTINUE WATCHING ===== */
/* ============================= */

function loadContinueWatching() {
  const continueData = JSON.parse(localStorage.getItem("kotham_continue") || "{}");
  const section = document.getElementById("continueSection");
  const row = document.getElementById("continueRow");

  if (!section || !row) return;

  const items = Object.values(continueData).sort((a, b) => b.savedAt - a.savedAt);

  if (items.length === 0) return;

  section.style.display = "block";

  row.innerHTML = items.map(item => `
    <div class="history-card continue-card" onclick="playFromHistory('series', '${item.imdb}', '${item.season}', '${item.episode}', '${encodeURIComponent(item.title || "")}', '${encodeURIComponent(item.poster || "")}')">
      ${item.poster
        ? `<img src="${decodeURIComponent(item.poster)}" class="history-poster">`
        : `<div class="history-poster-placeholder">📺</div>`
      }
      <div class="history-info">
        <span class="history-title">${item.title || item.imdb}</span>
        <span class="history-meta">S${item.season} E${item.episode}</span>
        <span class="continue-badge">▶ Continue</span>
      </div>
    </div>
  `).join("");
}

function playFromHistory(type, imdb, season, episode, title, poster) {
  document.body.classList.add("page-slide");
  setTimeout(() => {
    if (type === "movie") {
      window.location.href = `/watch/?type=movie&imdb=${imdb}&title=${title}&poster=${poster}`;
    } else {
      window.location.href = `/watch/?type=series&imdb=${imdb}&season=${season}&episode=${episode}&title=${title}&poster=${poster}`;
    }
  }, 500);
}

loadContinueWatching();
loadRecentlyWatched();

/* ============================= */
/* ===== CLOSE SUGGESTIONS ===== */
/* ============================= */

document.addEventListener("click", function (e) {
  const box = document.getElementById("suggestions");
  if (box && !e.target.closest(".input-wrapper")) {
    box.style.display = "none";
  }
});