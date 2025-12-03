// script.js
// Vintage Cinema Theme - Color palette updated for fall/café aesthetic
// D3.js v7

// Vintage color palette
const vintageColors = {
  critic: '#8B4513',
  audience: '#D2691E',
  overlap: '#6F4E37',
  positive: '#D4AF37',
  negative: '#B7410E',
  neutral: '#C19A6B',
  accent: '#CD853F'
};

//--------------------------------------------------
// Page loading logic (auto show up to page 2)
//--------------------------------------------------
window.addEventListener("load", () => {
  if (!sessionStorage.getItem("visited")) {
    localStorage.removeItem("lastPage");
    sessionStorage.setItem("visited", "true");
  }

  let lastPage = parseInt(localStorage.getItem("lastPage"));
  if (isNaN(lastPage)) lastPage = 1;

  const maxVisiblePage = lastPage;

  document.querySelectorAll(".page").forEach(p => {
    p.classList.add("hidden");
    p.style.display = "none";
  });

  for (let i = 1; i <= maxVisiblePage; i++) {
    const section = document.getElementById(`page${i}`);
    if (section) {
      section.classList.remove("hidden");
      section.style.display = "block";
    }
  }

  const target = document.getElementById(`page${maxVisiblePage}`);
  if (target) {
    target.scrollIntoView({ behavior: "instant" });
  }
});

//--------------------------------------------------
// Show next page and store progress
//--------------------------------------------------
function showNextPage(next, btn) {
  const nextPage = document.getElementById(`page${next}`);
  if (nextPage) {
    nextPage.classList.remove("hidden");
    nextPage.style.display = "block";
    
    // Force scroll to top of the page before smooth scroll
    requestAnimationFrame(() => {
      const pageTop = nextPage.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ 
        top: pageTop, 
        behavior: "smooth", 
        block: "start" 
      });
    });
    
    localStorage.setItem("lastPage", String(next));
  }
  if (btn) btn.style.display = "none";
}

//--------------------------------------------------
// Shared tooltip (if used elsewhere)
//--------------------------------------------------
const tooltip = d3.select("#tooltip");

//--------------------------------------------------
// Guessing Game Carousel
//--------------------------------------------------

const movieRounds = [
  {
    title: "Barbie",
    poster: "image/Barbie.png",
    mode: "audience",
    year: 2023,
    description: "A doll living in Barbieland is expelled for not being perfect enough and sets off on an adventure in the real world."
  },
  {
    title: "Top Gun: Maverick",
    poster: "image/Top Gun.png",
    mode: "audience",
    year: 2022,
    description: "After thirty years of service, Pete \"Maverick\" Mitchell must confront the ghosts of his past while training a new detachment of graduates for a specialized mission."
  },
  {
    title: "Captain America: The First Avenger",
    poster: "image/Captain America.png",
    mode: "audience",
    year: 2011,
    description: "A frail but determined young man, Steve Rogers, is transformed into the super-soldier Captain America to help the U.S. fight against the Nazi-aligned Hydra organization during World War II."
  },
  {
    title: "The Greatest Showman",
    poster: "image/The Greatest Showman.png",
    mode: "audience",
    year: 2017,
    description: "Inspired by the story of P.T. Barnum, this musical celebrates the birth of show business and tells of a visionary who rose from nothing to create a spectacle that became a worldwide sensation."
  },
  {
    title: "Star Wars: The Last Jedi",
    poster: "image/Star Wars.png",
    mode: "audience",
    year: 2017,
    description: "Rey continues her epic journey with Finn and Poe while seeking out Luke Skywalker, who is living in self-imposed exile, as the Resistance fights against the First Order."
  }
];

const totalMovies = movieRounds.length;

const carouselContainer = document.getElementById("guessing-carousel");

carouselContainer.innerHTML = `
  <div class="carousel-content">
    <div class="movie-card" id="active-card">
      <div class="card-loading">Loading...</div>
    </div>
  </div>
  <div class="carousel-bottom-bar" style="margin-top:5px; text-align:center;">
    <div class="carousel-dots" style="margin-bottom:5px;"></div>
    <div class="score-tracker" id="score-tracker"
      style="font-size:15px; color:#666; font-family: 'Playfair Display', serif;">
      Score: 0 / ${totalMovies}
    </div>
  </div>
  <button class="carousel-btn left" id="carousel-prev" style="display:none;">❮</button>
  <button class="carousel-btn right" id="carousel-next" style="display:none;">❯</button>
`;

const cardContainer = carouselContainer.querySelector("#active-card");
const dotsContainer = carouselContainer.querySelector(".carousel-dots");
const prevBtn = carouselContainer.querySelector("#carousel-prev");
const nextBtn = carouselContainer.querySelector("#carousel-next");

let currentIndex = 0;
let revealedCards = [false, false, false, false, false];
let cardData = [];

// scoring
let answeredCount = 0;
let correctCount = 0;

function updateScoreDisplay() {
  const scoreEl = document.getElementById("score-tracker");
  if (!scoreEl) return;
  scoreEl.textContent = `Score: ${correctCount} / ${totalMovies}`;
}

// scroll helper
function scrollToCardTop() {
  if (!cardContainer) return;
  const rect = cardContainer.getBoundingClientRect();
  const absoluteTop = window.scrollY + rect.top;
  window.scrollTo({ top: absoluteTop - 10, behavior: "smooth" });
}

// index helpers
function isTransitionIndex(ci) {
  return cardData[ci] && cardData[ci].transition === true;
}
function isSummaryIndex(ci) {
  return cardData[ci] && cardData[ci].summary === true;
}
function carouselIndexToMovieIndex(ci) {
  if (isTransitionIndex(ci) || isSummaryIndex(ci)) return null;
  if (ci <= 2) return ci;
  if (ci >= 4) return ci - 1;
  return null;
}
function movieIndexToCarouselIndex(mi) {
  if (mi <= 2) return mi;
  return mi + 1;
}

// load CSV
d3.csv("data/rotten_tomatoes.csv").then(data => {
  movieRounds.forEach((movie, i) => {
    const match = data.find(
      d => d.title && d.title.trim().toLowerCase() === movie.title.toLowerCase()
    );
    if (!match) return;

    const critic = +match.critic_score;
    const audience = +match.audience_score;

    const shownLabel = movie.mode === "critic" ? "Audience" : "Critics";
    const guessedLabel = movie.mode === "critic" ? "Critics" : "Audience";
    const shownScore = movie.mode === "critic" ? audience : critic;
    const actualScore = movie.mode === "critic" ? critic : audience;

    cardData.push({
      title: movie.title,
      poster: movie.poster,
      shownLabel,
      guessedLabel,
      shownScore,
      actualScore
    });

    const dot = document.createElement("span");
    dot.className = "dot";
    dot.dataset.index = i;
    dotsContainer.appendChild(dot);
  });

  // insert transition card at index 3
  cardData.splice(3, 0, { transition: true });

  // append summary card
  cardData.push({ summary: true });

  renderCard(0);
  updateNavigation();
  updateScoreDisplay();

  // dot click
  Array.from(dotsContainer.children).forEach(dot => {
    dot.addEventListener("click", () => {
      const mi = parseInt(dot.dataset.index);
      const targetCi = movieIndexToCarouselIndex(mi);
      if (targetCi <= currentIndex) {
        currentIndex = targetCi;
        renderCard(currentIndex);
        updateNavigation();
        scrollToCardTop();
      }
    });
  });

  // prev
  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderCard(currentIndex);
      updateNavigation();
      scrollToCardTop();
    }
  });

  // next
  nextBtn.addEventListener("click", () => {
    const lastIndex = cardData.length - 1;
    if (currentIndex < lastIndex) {

      if (isTransitionIndex(currentIndex)) {
        currentIndex++;
        renderCard(currentIndex);
        updateNavigation();
        scrollToCardTop();
        return;
      }

      const mi = carouselIndexToMovieIndex(currentIndex);
      if (mi !== null && revealedCards[mi]) {
        currentIndex++;
        renderCard(currentIndex);
        updateNavigation();
        scrollToCardTop();
      }
    }
  });
});

// render card
function renderCard(index) {
  const card = cardData[index];

  // summary  **← THIS PART IS MODIFIED**
  if (isSummaryIndex(index)) {
    const percent = Math.round((correctCount / totalMovies) * 100);
    let titleText, bodyText;

    if (correctCount <= 1) {
      titleText = `You scored ${correctCount} / ${totalMovies} (${percent}%)`;
      bodyText = `
        This round was a bit rough — you only picked up ${percent}%.<br>
        It looks like the relationship between critic and audience scores
        feels a little unpredictable for you.<br>
        In the next sections, we’ll walk through more concrete examples
        so these patterns start to feel much more intuitive.
      `;
    } else if (correctCount <= 3) {
      titleText = `Nice start! ${correctCount} / ${totalMovies} (${percent}%)`;
      bodyText = `
        You already have a decent sense of how critics and audiences line up on some films.<br>
        Up next, we’ll look at clearer comparisons,
        so you can sharpen that intuition into a more structured understanding.
      `;
    } else {
      titleText = `Great job! ${correctCount} / ${totalMovies} (${percent}%)`;
      bodyText = `
        You’re clearly very tuned in to how critics and audiences react to these movies.<br>
        In the next part, we’ll dive deeper into the data and stories behind these differences,
        and see what might be driving those gaps or agreements.
      `;
    }

    cardContainer.className = "summary-card";
    cardContainer.innerHTML = `
      <p style="font-size:20px;line-height:1.6;color:var(--vintage-dark);font-weight:600;">
        ${titleText}
      </p>
      <p style="font-size:16px;color:var(--vintage-coffee);margin-top:20px;line-height:1.8;">
        ${bodyText}
      </p>
    `;
    return;
  }

  // transition
  if (isTransitionIndex(index)) {
    cardContainer.className = "transition-message";
    cardContainer.innerHTML = `
      <p style="font-size:18px;line-height:1.6;color:var(--vintage-dark)">
        It seems that critics and audiences often agree!
      </p>
      <p style="font-size:16px;color:var(--vintage-coffee);margin-top:30px;font-style:italic;">
        Or do they?
      </p>
    `;
    return;
  }

  // movie card
  const mi = carouselIndexToMovieIndex(index);
  cardContainer.className = "movie-card";

  cardContainer.innerHTML = cardContainer.innerHTML = `
    <h2 style="margin-top:5px;margin-bottom:8px;">${card.title} (${movieRounds[mi].year})</h2>

    <p style="font-size:15px;color:#4A2C2A;margin-bottom:10px;margin-top:5px;">
      ${movieRounds[mi].description}
    </p>

    <img src="${card.poster}" alt="${card.title} Poster" style="margin:8px 0;">

    <p style="margin:5px 0;"><strong>${card.shownLabel} Score:</strong> ${(card.shownScore * 100).toFixed(0)}%</p>

    <p id="guess-label-${mi}"
      style="margin:5px 0;font-family:Playfair Display, serif;font-weight:600;color:var(--vintage-brown)">
      Guess the ${card.guessedLabel}' Score: <span class="guess-num">${50}%</span>
    </p>

    <input type="range" min="0" max="100" value="50"
      class="score-slider" id="slider-${mi}" style="margin-top:5px;">

    <button class="reveal-btn" id="reveal-${mi}" style="margin-top:5px;">Reveal Score</button>

    <div class="guess-result" id="result-${mi}" style="margin-top:5px;"></div>
  `;

  const slider = document.getElementById(`slider-${mi}`);
  const label = document.querySelector(`#guess-label-${mi} .guess-num`);
  const revealBtn = document.getElementById(`reveal-${mi}`);
  const result = document.getElementById(`result-${mi}`);

  slider.addEventListener("input", () => {
    label.textContent = `${slider.value}%`;
  });

  if (revealedCards[mi]) {
    slider.disabled = true;
    revealBtn.style.display = "none";
    const actualValue = Math.round(card.actualScore * 100);
    result.innerHTML = `<strong>${card.guessedLabel}' Score:</strong> ${actualValue}%`;
    return;
  }

  revealBtn.addEventListener("click", () => {
    const guess = Math.round(slider.value);
    const actual = Math.round(card.actualScore * 100);
    const diff = Math.abs(guess - actual);

    let feedback, color, dotClass;
    if (diff <= 1) {
      feedback = "🎯 Perfect!";
      color = "var(--vintage-coffee)";
      dotClass = "correct";
    } else if (diff <= 5) {
      feedback = "👍 Very close!";
      color = "var(--vintage-gold)";
      dotClass = "correct";
    } else if (guess < actual) {
      feedback = "❌ Too low!";
      color = "var(--autumn-rust)";
      dotClass = "incorrect";
    } else {
      feedback = "❌ Too high!";
      color = "var(--autumn-rust)";
      dotClass = "incorrect";
    }

    result.style.opacity = "0";
    result.style.transform = "translateY(8px) scale(0.98)";
    result.style.transition = "opacity 0.35s ease, transform 0.35s ease";

    result.innerHTML = `
      <strong>${card.guessedLabel}' Score:</strong> ${actual}%<br>
      <span style="font-weight:600;color:${color};margin-top:8px;display:inline-block;">
        ${feedback}
      </span>
    `;

    requestAnimationFrame(() => {
      result.style.opacity = "1";
      result.style.transform = "translateY(0) scale(1)";
    });

    if (!revealedCards[mi]) {
      answeredCount++;
      if (dotClass === "correct") correctCount++;
      updateScoreDisplay();
    }

    revealedCards[mi] = true;
    slider.disabled = true;
    revealBtn.style.display = "none";

    const dot = dotsContainer.children[mi];
    dot.classList.remove("correct", "incorrect", "active");
    dot.classList.add(dotClass);

    updateNavigation();
  });
}

// update nav
function updateNavigation() {
  let highlightedMovieIndex = null;

  if (isTransitionIndex(currentIndex)) {
    highlightedMovieIndex = 2;
  } else if (!isSummaryIndex(currentIndex)) {
    highlightedMovieIndex = carouselIndexToMovieIndex(currentIndex);
  }

  Array.from(dotsContainer.children).forEach((dot, i) => {
    dot.classList.remove("active");
    const isCorrect = dot.classList.contains("correct");
    const isIncorrect = dot.classList.contains("incorrect");

    if (
      highlightedMovieIndex !== null &&
      i === highlightedMovieIndex &&
      !isCorrect &&
      !isIncorrect
    ) {
      dot.classList.add("active");
    }

    const reachable = movieIndexToCarouselIndex(i) <= currentIndex;
    dot.style.cursor = reachable ? "pointer" : "not-allowed";
    dot.style.opacity = reachable ? "1" : "0.4";
  });

  const lastIndex = cardData.length - 1;

  prevBtn.style.display = currentIndex > 0 ? "block" : "none";

  if (currentIndex >= lastIndex) {
    nextBtn.style.display = "none";
  } else if (isTransitionIndex(currentIndex)) {
    nextBtn.style.display = "block";
  } else if (isSummaryIndex(currentIndex)) {
    nextBtn.style.display = "none";
  } else {
    const mi = carouselIndexToMovieIndex(currentIndex);
    nextBtn.style.display =
      (mi !== null && revealedCards[mi]) ? "block" : "none";
  }
}


/* --------------------------------------------------
   Rotten Tomatoes intro example toggles + pill expand
-------------------------------------------------- */

function setupRottenTomatoesIntro() {
  const panel = document.getElementById("rt-example-panel");
  const buttons = document.querySelectorAll(".rt-example-btn");
  const pills = document.querySelectorAll(".rt-pill");

  if (!panel || buttons.length === 0) return;

  /* -------------------------
     Example panel switching
  --------------------------*/
  function setExample(which) {
    buttons.forEach(btn => btn.classList.toggle("active", btn.dataset.example === which));

    if (which === "a") {
      panel.innerHTML = `
        <div class="rt-example-inner">
          <div class="rt-example-title">
            🍅 Example A · 99% Tomatometer = 99% Critics Score
          </div>
          <p>
            Imagine 100 critics review a movie.
            <strong>99 of them mark their review as “Fresh”</strong>, meaning they liked it.
            Even if many of them only think the film is around a 7/10.
          </p >
          <p>
            Rotten Tomatoes only checks whether each critic labels the review “Fresh” or “Rotten”.
            It does <strong>not</strong> average their star ratings.  
            A critic could give a movie 4/5 stars but still label it as Rotten, and that would be counted inside the 1% Rotten group.
          </p >
        </div>
      `;
    } else {
      panel.innerHTML = `
        <div class="rt-example-inner">
          <div class="rt-example-title">
            🍿 Example B · 50% Popcornmeter = 50% Audience Score
          </div>
          <p>
            Imagine half the audience loves a movie and gives it 5/5,
            and the other half dislikes it and gives it 2.5/5.
            The <strong>average</strong> rating would be 3.75/5 (75%).
          </p >
          <p>
            But on Rotten Tomatoes, only audience ratings above 3.5/5 count as “Fresh”.
            So only half of these audience reviews qualify,
            which results in a <strong>50% Audience Score</strong>.
          </p >
        </div>
      `;
    }
  }

  // default example
  setExample("a");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => setExample(btn.dataset.example));
  });

  /* --------------------------------------
     Pill – only ONE expanded at a time
  ----------------------------------------*/
  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      const isOpen = pill.classList.contains("expanded");

      // 先收起所有 pill
      pills.forEach(p => {
        p.classList.remove("expanded");
        p.querySelector(".expanded-text").style.display = "none";
        p.querySelector(".default-text").style.display = "block";
      });

      // 若原本没开，则把当前这颗展开
      if (!isOpen) {
        const defaultText = pill.querySelector(".default-text");
        const expandedText = pill.querySelector(".expanded-text");

        expandedText.style.display = "block";
        defaultText.style.display = "none";
        pill.classList.add("expanded");
      }
    });
  });
}

/* 点击空白处关闭所有 pill */
document.addEventListener("click", (e) => {
  // 如果点击位置不是 pill 内部
  if (!e.target.closest(".rt-pill")) {
    document.querySelectorAll(".rt-pill").forEach(p => {
      p.classList.remove("expanded");
      p.querySelector(".expanded-text").style.display = "none";
      p.querySelector(".default-text").style.display = "block";
    });
  }
});

// run after everything is loaded
window.addEventListener("load", setupRottenTomatoesIntro);

//--------------------------------------------------
// Q1: Genre Differences Bar Chart
//--------------------------------------------------
const margin1 = { top: 30, right: 20, bottom: 80, left: 70 },
  width1 = 420 - margin1.left - margin1.right,
  height1 = 350 - margin1.top - margin1.bottom;

const svg1 = d3.select("#chart-q1")
  .append("svg")
  .attr("width", 420)
  .attr("height", 350)
  .append("g")
  .attr("transform", `translate(${margin1.left},${margin1.top})`);


// ⭐ NEW ———— 添加透明背景层（点击空白恢复 All Genres）
svg1.append("rect")
  .attr("class", "reset-area")
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", width1)
  .attr("height", height1)
  .attr("fill", "transparent")
  .lower() // 放到最底层
  .on("click", () => {
    svg1.selectAll(".bar")
      .classed("selected", false)
      .attr("stroke", null)
      .attr("stroke-width", null);

    updateScatterByGenre("All Genres");
  });


d3.csv("data/imdb_tomatoes_oscar_genre_expanded.csv").then(data => {
  data.forEach(d => {
    d.critic_score = +d.critic_score;
    d.audience_score = +d.audience_score;
    d.score_diff = d.critic_score - d.audience_score;
    d.genre = d.genre.trim();
  });

  const genreStats = Array.from(
    d3.group(data, d => d.genre),
    ([genre, values]) => ({
      genre,
      critic_avg: d3.mean(values, v => v.critic_score),
      audience_avg: d3.mean(values, v => v.audience_score),
      diff: d3.mean(values, v => v.score_diff)
    })
  ).filter(d => d.genre && !isNaN(d.diff));

  genreStats.sort((a, b) => d3.ascending(a.diff, b.diff));

  const x = d3.scaleLinear()
    .domain(d3.extent(genreStats, d => d.diff))
    .nice()
    .range([0, width1]);

  const y = d3.scaleBand()
    .domain(genreStats.map(d => d.genre))
    .range([height1, 0])
    .padding(0.25);

  const bars = svg1.selectAll(".bar")
    .data(genreStats)
    .join("rect")
    .attr("class", "bar")
    .attr("y", d => y(d.genre))
    .attr("x", d => x(Math.min(0, d.diff)))
    .attr("width", 0)
    .attr("height", y.bandwidth())
    .attr("fill", d => d.diff > 0 ? vintageColors.critic : vintageColors.audience)
    .attr("rx", 2)
    .transition()
    .duration(800)
    .delay((d, i) => i * 30)
    .attr("width", d => Math.abs(x(d.diff) - x(0)));

  svg1.selectAll(".bar")
    .on("mouseover", (event, d) => {
      d3.select(event.currentTarget)
        .transition()
        .duration(200)
        .attr("opacity", 0.7);
      tooltip.style("visibility", "visible")
        .style("opacity", "1")
        .style("left", (event.pageX + 40) + "px")
        .style("top", (event.pageY - 40) + "px")
        .html(`
    <div style="
      background:linear-gradient(to bottom, #FFF8E7, #F5E6D3);
      border-radius:0;
      box-shadow:0 4px 12px rgba(0,0,0,0.2);
      border: 2px solid #8B4513;
      padding:10px 14px;
      font-size:13px;
      font-family: Crimson Text, serif;
      line-height:1.5;
      ">
      <div style="font-weight:600; font-size:15px; margin-bottom:6px; color:#8B4513; font-family: Playfair Display, serif;">🎬 ${d.genre}</div>
      <div style="color:#6F4E37;">⭐ Critics Avg: ${(d.critic_avg * 100).toFixed(1)}%</div>
      <div style="color:#6F4E37;">👥 Audience Avg: ${(d.audience_avg * 100).toFixed(1)}%</div>
      <div style="margin-top:6px; color:${d.diff > 0 ? '#8B4513' : '#D2691E'}; font-weight:600;">
        Δ Difference: ${(d.diff * 100).toFixed(1)}%
      </div>
    </div>
  `);
    })
    .on("mousemove", event => {
      tooltip.style("top", (event.pageY - 20) + "px")
        .style("left", (event.pageX + 15) + "px");
    })
    .on("mouseout", (event, d) => {
      d3.select(event.currentTarget)
        .transition()
        .duration(200)
        .attr("opacity", 1);
      tooltip.style("visibility", "hidden")
        .style("opacity", "0");
    })
    .on("click", (event, d) => {
      svg1.selectAll(".bar")
        .classed("selected", false)
        .attr("stroke", null)
        .attr("stroke-width", null);

      d3.select(event.currentTarget)
        .classed("selected", true)
        .attr("stroke", "#4A2C2A")
        .attr("stroke-width", 2);

      updateScatterByGenre(d.genre);
    });

  svg1.append("g")
    .attr("transform", `translate(0,${height1})`)
    .call(
      d3.axisBottom(x)
        .tickFormat(d => `${(d * 100).toFixed(0)}%`)
    )
    .selectAll("text")
    .style("fill", "#6F4E37")
    .style("font-family", "Crimson Text, serif");

  svg1.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("fill", "#6F4E37")
    .style("font-family", "Crimson Text, serif");

  svg1.append("line")
    .attr("x1", x(0))
    .attr("x2", x(0))
    .attr("y1", 0)
    .attr("y2", height1)
    .attr("stroke", "#4A2C2A")
    .attr("stroke-dasharray", "3,3");
});



//--------------------------------------------------
// Scatterplot: Genre Exploration
//--------------------------------------------------
const marginScatter = { top: 40, right: 30, bottom: 50, left: 70 },
  widthScatter = 420 - marginScatter.left - marginScatter.right,
  heightScatter = 380 - marginScatter.top - marginScatter.bottom;

const svgScatter = d3.select("#chart-scatter-multi")
  .append("svg")
  .attr("width", 420)
  .attr("height", 380)
  .append("g")
  .attr("transform", `translate(${marginScatter.left},${marginScatter.top})`);


// ⭐ NEW ———— 添加透明点击层（点击空白恢复 All Genres）
svgScatter.append("rect")
  .attr("class", "reset-area-scatter")
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", widthScatter)
  .attr("height", heightScatter)
  .attr("fill", "transparent")
  .lower()
  .on("click", () => updateScatterByGenre("All Genres"));


let allData = [];

d3.csv("data/imdb_tomatoes_oscar_genre_expanded.csv").then(data => {
  data.forEach(d => {
    d.critic_score = +d.critic_score;
    d.audience_score = +d.audience_score;
    d.score_diff = d.critic_score - d.audience_score;
    d.genre = d.genre.trim();
  });

  allData = data;
  updateScatterByGenre("All Genres");
});

function updateScatterByGenre(selectedGenre) {
  svgScatter.selectAll("*").remove();

  let filtered = allData;
  if (selectedGenre !== "All Genres") {
    filtered = allData.filter(d => d.genre && d.genre.includes(selectedGenre));
  }

  const x = d3.scaleLinear().domain([0, 1]).range([0, widthScatter]);
  const y = d3.scaleLinear().domain([0, 1]).range([heightScatter, 0]);

  svgScatter.append("g")
    .attr("transform", `translate(0,${heightScatter})`)
    .call(d3.axisBottom(x).tickFormat(d3.format(".1f")))
    .selectAll("text")
    .style("fill", "#6F4E37")
    .style("font-family", "Crimson Text, serif");

  svgScatter.append("g")
    .call(d3.axisLeft(y).tickFormat(d3.format(".1f")))
    .selectAll("text")
    .style("fill", "#6F4E37")
    .style("font-family", "Crimson Text, serif");

  svg1.append("text")
    .attr("x", width1 / 2)
    .attr("y", height1 + 40)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("fill", "#6F4E37")
    .attr("font-family", "Crimson Text, serif")
    .text("Audiences Like More  ←        →     Critics Like More");

  svg1.append("text")
    .attr("x", width1 / 2)
    .attr("y", height1 + 65)   // 第二行往下 20px
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("fill", "#6F4E37")
    .attr("font-family", "Crimson Text, serif")
    .text("Score Difference");



  svgScatter.append("line")
    .attr("x1", 0)
    .attr("y1", heightScatter)
    .attr("x2", widthScatter)
    .attr("y2", 0)
    .attr("stroke", "#C19A6B")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "4,4");

  svgScatter.selectAll("circle")
    .data(filtered)
    .join("circle")
    .attr("cx", d => x(d.critic_score))
    .attr("cy", d => y(d.audience_score))
    .attr("r", 0)
    .attr("fill", vintageColors.accent)
    .attr("opacity", 0.65)
    .transition()
    .duration(600)
    .attr("r", 4);

  svgScatter.selectAll("circle")
    .on("mouseover", (e, d) => {
      tooltip.style("visibility", "visible")
        .style("opacity", "1")
        .html(`
          <div style="font-family: Crimson Text, serif; color: #4A2C2A;">
            <strong style="color:#8B4513; font-family: Playfair Display, serif;">${d.title}</strong><br>
            🎬 ${d.genre}<br>
            ⭐ Critic: ${(d.critic_score * 100).toFixed(1)}%<br>
            👥 Audience: ${(d.audience_score * 100).toFixed(1)}%
          </div>
        `);
    })
    .on("mousemove", e => {
      tooltip.style("top", (e.pageY - 35) + "px")
        .style("left", (e.pageX + 10) + "px");
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden").style("opacity", "0"));

  svgScatter.append("text")
    .attr("x", widthScatter / 2)
    .attr("y", -25)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("font-size", "18px")
    .attr("fill", "#8B4513")
    .attr("font-family", "Playfair Display, serif")
    .text(selectedGenre === "All Genres" ? "All Genres" : `Genre: ${selectedGenre}`);

  svgScatter.append("text")
    .attr("x", widthScatter / 2)
    .attr("y", heightScatter + 45)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("fill", "#6F4E37")
    .attr("font-family", "Crimson Text, serif")
    .text("Critic Score");

  svgScatter.append("text")
    .attr("x", -heightScatter / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("fill", "#6F4E37")
    .attr("font-family", "Crimson Text, serif")
    .attr("transform", "rotate(-90)")
    .text("Audience Score");
}

//--------------------------------------------------
// Q2: Time Trend Line Chart
//--------------------------------------------------
const margin2 = { top: 50, right: 100, bottom: 60, left: 80 },
  width2 = 900 - margin2.left - margin2.right,
  height2 = 450 - margin2.top - margin2.bottom;

const svg2 = d3.select("#chart-q2")
  .append("svg")
  .attr("width", width2 + margin2.left + margin2.right)
  .attr("height", height2 + margin2.top + margin2.bottom)
  .append("g")
  .attr("transform", `translate(${margin2.left},${margin2.top})`);

d3.csv("data/imdb_tomatoes_oscar.csv").then(data => {
  data.forEach(d => {
    d.release_year = +d.release_year;
    d.critic_score = +d.critic_score;
    d.audience_score = +d.audience_score;
  });

  const yearly = Array.from(
    d3.group(data, d => d.release_year),
    ([year, values]) => ({
      year: +year,
      critic_avg: d3.mean(values, v => v.critic_score),
      audience_avg: d3.mean(values, v => v.audience_score)
    })
  ).filter(d => !isNaN(d.year) && d.year >= 1920 && d.year <= 2025)
    .sort((a, b) => d3.ascending(a.year, b.year));

  const x = d3.scaleLinear()
    .domain(d3.extent(yearly, d => d.year))
    .range([0, width2]);

  const y = d3.scaleLinear()
    .domain([0, 1])
    .range([height2, 0]);

  const lineCritic = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.critic_avg))
    .curve(d3.curveMonotoneX);

  const lineAudience = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.audience_avg))
    .curve(d3.curveMonotoneX);


  svg2.append("path")
    .datum(yearly)
    .attr("class", "rating-line critics-line")
    .attr("fill", "none")
    .attr("stroke", vintageColors.critic)
    .attr("stroke-width", 3)
    .attr("d", lineCritic);

  svg2.append("path")
    .datum(yearly)
    .attr("class", "rating-line audience-line")
    .attr("fill", "none")
    .attr("stroke", vintageColors.audience)
    .attr("stroke-width", 3)
    .attr("d", lineAudience);


  const focusCritic = svg2.append("g").style("display", "none");
  focusCritic.append("circle")
    .attr("r", 6)
    .attr("fill", vintageColors.critic);

  const tooltipCritic = svg2.append("foreignObject")
    .attr("width", 140)
    .attr("height", 60)
    .style("display", "none");

  tooltipCritic.append("xhtml:div")
    .attr("id", "tooltip-critic")
    .style("background", "linear-gradient(to bottom, #FFF8E7, #F5E6D3)")
    .style("border-radius", "0")
    .style("padding", "8px 10px")
    .style("box-shadow", "0 4px 12px rgba(0,0,0,0.2)")
    .style("border", "2px solid #8B4513")
    .style("font-size", "13px")
    .style("font-family", "Crimson Text, serif")
    .style("color", vintageColors.critic);

  const focusAudience = svg2.append("g").style("display", "none");
  focusAudience.append("circle")
    .attr("r", 6)
    .attr("fill", vintageColors.audience);

  const tooltipAudience = svg2.append("foreignObject")
    .attr("width", 140)
    .attr("height", 60)
    .style("display", "none");

  tooltipAudience.append("xhtml:div")
    .attr("id", "tooltip-audience")
    .style("background", "linear-gradient(to bottom, #FFF8E7, #F5E6D3)")
    .style("border-radius", "0")
    .style("padding", "8px 10px")
    .style("box-shadow", "0 4px 12px rgba(0,0,0,0.2)")
    .style("border", "2px solid #8B4513")
    .style("font-size", "13px")
    .style("font-family", "Crimson Text, serif")
    .style("color", vintageColors.audience);

  svg2.append("rect")
    .attr("class", "overlay")
    .attr("width", width2)
    .attr("height", height2)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("mouseout", () => {
      focusCritic.style("display", "none");
      tooltipCritic.style("display", "none");
      focusAudience.style("display", "none");
      tooltipAudience.style("display", "none");
    })
    .on("mousemove", (event) => {
      const [mouseX, mouseY] = d3.pointer(event);
      const yearScale = x.invert(mouseX);

      const closest = yearly.reduce((a, b) =>
        Math.abs(b.year - yearScale) < Math.abs(a.year - yearScale) ? b : a
      );

      const yCritic = y(closest.critic_avg);
      const yAudience = y(closest.audience_avg);

      const distCritic = Math.abs(mouseY - yCritic);
      const distAudience = Math.abs(mouseY - yAudience);

      const closer = distCritic < distAudience ? "critic" : "audience";

      if (closer === "critic") {
        focusCritic.style("display", null)
          .transition().duration(80)
          .attr("transform", `translate(${x(closest.year)},${yCritic})`);
        tooltipCritic
          .style("display", null)
          .attr("x", x(closest.year) + 10)
          .attr("y", yCritic - 50)
          .select("#tooltip-critic")
          .html(`
          <strong>${closest.year}</strong><br>
          ⭐ Critics: ${(closest.critic_avg * 100).toFixed(1)}%
        `);

        focusAudience.style("display", "none");
        tooltipAudience.style("display", "none");
      } else {
        focusAudience.style("display", null)
          .transition().duration(80)
          .attr("transform", `translate(${x(closest.year)},${yAudience})`);
        tooltipAudience
          .style("display", null)
          .attr("x", x(closest.year) + 10)
          .attr("y", yAudience - 50)
          .select("#tooltip-audience")
          .html(`
          <strong>${closest.year}</strong><br>
          👥 Audience: ${(closest.audience_avg * 100).toFixed(1)}%
        `);

        focusCritic.style("display", "none");
        tooltipCritic.style("display", "none");
      }
    });

  svg2.append("g")
    .attr("transform", `translate(0,${height2})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")))
    .selectAll("text")
    .style("fill", "#6F4E37")
    .style("font-family", "Crimson Text, serif");

  svg2.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("fill", "#6F4E37")
    .style("font-family", "Crimson Text, serif");

  svg2.append("text")
    .attr("x", width2 / 2)
    .attr("y", -15)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("font-family", "Playfair Display, serif")
    .attr("fill", "#8B4513");

  svg2.append("text")
    .attr("x", width2 / 2)
    .attr("y", height2 + 45)
    .attr("text-anchor", "middle")
    .attr("font-family", "Crimson Text, serif")
    .attr("fill", "#6F4E37")
    .text("Release Year");

  svg2.append("text")
    .attr("x", -height2 / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("font-family", "Crimson Text, serif")
    .attr("fill", "#6F4E37")
    .text("Average Score");

  const legend = svg2.append("g")
    .attr("transform", `translate(${width2 + 10}, ${height2 / 2 - 30})`);

  legend.append("text")
    .attr("x", 0)
    .attr("y", -10)
    .text("Legend")
    .attr("font-weight", "bold")
    .attr("font-size", "14px")
    .attr("font-family", "Playfair Display, serif")
    .attr("fill", "#8B4513");

  legend.append("rect")
    .attr("x", 0)
    .attr("y", 5)
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", vintageColors.critic);
  legend.append("text")
    .attr("x", 28)
    .attr("y", 19)
    .text("Critics")
    .attr("font-size", "13px")
    .attr("font-family", "Crimson Text, serif")
    .attr("fill", "#6F4E37");

  legend.append("rect")
    .attr("x", 0)
    .attr("y", 32)
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", vintageColors.audience);
  legend.append("text")
    .attr("x", 28)
    .attr("y", 46)
    .text("Audience")
    .attr("font-size", "13px")
    .attr("font-family", "Crimson Text, serif")
    .attr("fill", "#6F4E37");
});

//--------------------------------------------------
// Q5: Word-Cloud Venn (Interactive Top N)
//--------------------------------------------------
(function () {
  const rangeInput = d3.select("#topNRange");
  const rangeValue = d3.select("#topNValue");
  const vennContainer = d3.select("#venn");
  const vennTitle = d3.select("#venn-title");

  d3.csv("data/rotten_tomatoes.csv").then(rawData => {
    if (!rawData || !rawData.length) {
      console.error("CSV file is empty or missing");
      return;
    }

    // --- data prep & de-dup (unchanged) ---
    let data = rawData.map(d => ({
      title: d.title.trim(),
      release_year: +d.release_year,
      critic: +d.critic_score,
      audience: +d.audience_score
    })).filter(d => d.title && isFinite(d.critic) && isFinite(d.audience));

    const grouped = d3.rollups(
      data,
      v => v.map(d => ({ ...d })),
      d => d.title.trim().toLowerCase()
    );

    const seen = new Set();
    const deduped = [];
    for (const [baseTitle, entries] of grouped) {
      if (entries.length > 1) {
        for (const e of entries) {
          const uniqueTitle = `${e.title.trim()} (${e.release_year})`;
          if (!seen.has(uniqueTitle)) {
            seen.add(uniqueTitle);
            deduped.push({ ...e, title: uniqueTitle });
          }
        }
      } else {
        const e = entries[0];
        const uniqueTitle = e.title.trim();
        if (!seen.has(uniqueTitle)) {
          seen.add(uniqueTitle);
          deduped.push({ ...e, title: uniqueTitle });
        }
      }
    }
    data = deduped;

    //--------------------------------------------------
    // MAIN DRAW FUNCTION (RESPONSIVE)
    //--------------------------------------------------
    function drawVenn(topN) {
      const container = d3.select("#venn");
      const w = container.node().clientWidth;

      // if container is hidden, wait until it becomes visible
      if (!w || w < 10) {
        setTimeout(() => drawVenn(topN), 100);
        return;
      }

      vennContainer.selectAll("svg").remove();
      d3.selectAll(".venn-tooltip").remove();

      // figure out available space from the center area
      const containerEl = document.querySelector(".venn-center-area");
      const availableWidth = containerEl ? containerEl.clientWidth * 0.95 : window.innerWidth * 0.7;
      const availableHeight = containerEl ? containerEl.clientHeight : window.innerHeight * 0.6;
      console.log("Available width:", window.innerWidth);
      console.log("Available height:", window.innerHeight);

      const W = availableWidth;
      console.log("Venn width:", W);
      const H = availableHeight;
      console.log("Venn height:", H);

      const margin = {
        top: H * 0.15,
        right: 20,
        bottom: 20,
        left: 20
      };

      const innerW = W - margin.left - margin.right;
      const innerH = H - margin.top - margin.bottom;

      const svg = vennContainer.append("svg")
        .attr("width", W)
        .attr("height", H)
        .attr("viewBox", `0 0 ${W} ${H}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

      // true visual center inside the svg (including margins)
      const centerX = margin.left + innerW / 2;
      const centerY = margin.top + innerH / 2;
      const adjustedCenterY = centerY - H * 0.1; // small nudge up

      // font scaling
      let maxFont = Math.max(9, Math.min(14, W / 50));
      console.log("maxFont:", maxFont);
      let minFont = Math.max(6, Math.min(10, W / 85));
      console.log("minFont:", minFont);
      //--------------------------------------------------
      // radius / overlap
      //--------------------------------------------------
      const maxRadiusByHeight = innerH * 0.45;
      const maxRadiusByWidth = innerW * 0.32;
      const unifiedR = Math.max(40, Math.min(maxRadiusByHeight, maxRadiusByWidth));

      const circleSpacing = unifiedR * 1.1;

      const centers = {
        critic: {
          x: centerX - circleSpacing / 2,
          y: adjustedCenterY
        },
        audience: {
          x: centerX + circleSpacing / 2,
          y: adjustedCenterY
        },
        overlap: {
          x: centerX,
          y: adjustedCenterY
        }
      };
      //--------------------------------------------------
      // Region logic - adjusted for new spacing
      //--------------------------------------------------
      const padFracCritic = 0.35;
      const padFracAudience = 0.35;

      function dist(pt, c) {
        const dx = pt.x - c.x, dy = pt.y - c.y;
        return Math.sqrt(dx * dx + dy * dy);
      }

      function inRegion(pt, regionKey) {
        const dCritic = dist(pt, centers.critic);
        const dAudience = dist(pt, centers.audience);
        if (regionKey === "critic") return dCritic <= unifiedR * 0.92 && dAudience >= unifiedR * (1 + padFracCritic);
        if (regionKey === "audience") return dAudience <= unifiedR * 0.92 && dCritic >= unifiedR * (1 + padFracAudience);
        if (regionKey === "overlap") return dCritic <= unifiedR && dAudience <= unifiedR;
        return false;
      }

      //--------------------------------------------------
      // Top-N sets
      //--------------------------------------------------
      const topCritics = data.slice()
        .sort((a, b) => (b.critic - a.critic) || a.title.localeCompare(b.title))
        .slice(0, topN);

      const topAudience = data.slice()
        .sort((a, b) => (b.audience - a.audience) || a.title.localeCompare(b.title))
        .slice(0, topN);

      const criticSet = new Set(topCritics.map(d => d.title));
      const audienceSet = new Set(topAudience.map(d => d.title));
      const overlapSet = new Set([...criticSet].filter(x => audienceSet.has(x)));

      const criticOnly = topCritics.filter(d => !overlapSet.has(d.title));
      const audienceOnly = topAudience.filter(d => !overlapSet.has(d.title));
      const overlap = data.filter(d => overlapSet.has(d.title));

      //--------------------------------------------------
      // Fonts
      //--------------------------------------------------
      const fontFamilies = [
        "Crimson Text, serif",
        "Playfair Display, serif",
        "Courier Prime, monospace"
      ];
      const fontWeights = [400, 600, 700];
      const fontStyles = ["normal", "italic"];

      const randomFont = () => fontFamilies[Math.floor(Math.random() * fontFamilies.length)];
      const randomWeight = () => fontWeights[Math.floor(Math.random() * fontWeights.length)];
      const randomStyle = () => fontStyles[Math.floor(Math.random() * fontStyles.length)];

      //--------------------------------------------------
      // Tooltip for Venn only
      //--------------------------------------------------
      const tooltip = d3.select("body").append("div")
        .attr("class", "venn-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("padding", "8px 12px")
        .style("background", "linear-gradient(to bottom, #FFF8E7, #F5E6D3)")
        .style("color", "#4A2C2A")
        .style("border", "2px solid #8B4513")
        .style("box-shadow", "0 4px 12px rgba(0,0,0,0.25)")
        .style("font-size", "13px")
        .style("font-family", "Crimson Text, serif")
        .style("pointer-events", "none")
        .style("z-index", "9999")
        .style("max-width", "260px");

      //--------------------------------------------------
      // Draw circles FIRST (behind text) — UPDATED
      //--------------------------------------------------
      svg.append("circle")
        .attr("cx", centers.critic.x)
        .attr("cy", centers.critic.y)
        .attr("r", unifiedR)
        .attr("fill", vintageColors.critic)
        .attr("fill-opacity", 0.22)     // slightly stronger fill
        .attr("stroke", "none");        // ⬅️ remove border

      svg.append("circle")
        .attr("cx", centers.audience.x)
        .attr("cy", centers.audience.y)
        .attr("r", unifiedR)
        .attr("fill", vintageColors.audience)
        .attr("fill-opacity", 0.22)
        .attr("stroke", "none");        // ⬅️ remove border


      //--------------------------------------------------
      // WORD LAYOUT
      //--------------------------------------------------
      function layoutWords(movies, regionKey, color) {
        if (!movies.length) return;

        const sizeScale = d3.scaleLinear()
          .domain([
            d3.min(movies, d => d.title.length),
            d3.max(movies, d => d.title.length)
          ])
          .range([maxFont, minFont]);

        // overlap: stacked vertically in center with more space
        if (regionKey === "overlap") {
          const avgFont = (maxFont + minFont) / 2;
          const lineHeight = avgFont * 1.35;
          const totalHeight = lineHeight * movies.length;
          const startY = adjustedCenterY - totalHeight / 2 + lineHeight / 2;

          svg.append("g").selectAll("text")
            .data(movies)
            .enter().append("text")
            .attr("x", centers.overlap.x)
            .attr("y", (d, i) => startY + i * lineHeight)
            .attr("text-anchor", "middle")
            .attr("font-size", d => sizeScale(d.title.length) + "px")
            .attr("font-family", () => randomFont())
            .attr("font-weight", () => randomWeight())
            .attr("font-style", () => randomStyle())
            .attr("fill", color)
            .attr("cursor", "pointer")
            .text(d => d.title)
            .on("mouseover", function (e, d) {
              const year = d.release_year || '';
              const criticScore = d.critic ? (d.critic * 100).toFixed(0) + '%' : '-';
              const audScore = d.audience ? (d.audience * 100).toFixed(0) + '%' : '-';
              d3.select(this).attr("opacity", 0.6).attr("font-weight", 700);
              tooltip
                .style("visibility", "visible")
                .html(`<strong style="color:#8B4513;">${d.title}</strong>${year ? ' (' + year + ')' : ''}<br>
                       <span style="color:#8B4513;">Critics:</span> ${criticScore} &nbsp;|&nbsp; 
                       <span style="color:#D2691E;">Audience:</span> ${audScore}`);
            })
            .on("mousemove", function (e) {
              tooltip
                .style("top", (e.pageY - 45) + "px")
                .style("left", (e.pageX + 12) + "px");
            })
            .on("mouseout", function () {
              d3.select(this).attr("opacity", 1).attr("font-weight", null);
              tooltip.style("visibility", "hidden");
            });
          return;
        }

        // critic-only / audience-only: spiral placement inside region
        const placed = [];
        const step = 4;
        const candidates = [];

        for (let angle = 0; angle < 2 * Math.PI; angle += 0.06) {
          for (let r = 0; r < unifiedR * 0.9; r += step) {
            const pt = {
              x: centers[regionKey].x + r * Math.cos(angle),
              y: centers[regionKey].y + r * Math.sin(angle)
            };
            if (inRegion(pt, regionKey)) candidates.push(pt);
          }
        }
        d3.shuffle(candidates);

        movies.forEach(movie => {
          const font = sizeScale(movie.title.length);
          const textBox = { w: movie.title.length * font * 0.5, h: font * 1.1 };
          let found = false;

          for (let pt of candidates) {
            const candidate = {
              x: Math.max(textBox.w / 2 + 3, Math.min(W - textBox.w / 2 - 3, pt.x)),
              y: Math.max(textBox.h / 2 + 3, Math.min(H - textBox.h / 2 - 30, pt.y))
            };

            let valid = true;
            for (let p of placed) {
              const dx = p.x - candidate.x, dy = p.y - candidate.y;
              if (Math.abs(dx) < (p.w + textBox.w) / 2 + 1 &&
                Math.abs(dy) < (p.h + textBox.h) / 2 + 1) {
                valid = false; break;
              }
            }
            if (valid) {
              placed.push({ ...candidate, ...textBox, font, text: movie.title, movie });
              found = true;
              break;
            }
          }

          if (!found) {
            let tries = 0, pt;
            do {
              pt = {
                x: centers[regionKey].x + (Math.random() - 0.5) * unifiedR * 1.7,
                y: centers[regionKey].y + (Math.random() - 0.5) * unifiedR * 1.7
              };
              tries++;
            } while (!inRegion(pt, regionKey) && tries < 100);

            const candidate = {
              x: Math.max(textBox.w / 2 + 3, Math.min(W - textBox.w / 2 - 3, pt.x)),
              y: Math.max(textBox.h / 2 + 3, Math.min(H - textBox.h / 2 - 30, pt.y))
            };
            placed.push({ ...candidate, ...textBox, font, text: movie.title, movie });
          }
        });

        svg.append("g").selectAll("text")
          .data(placed)
          .enter().append("text")
          .attr("x", d => d.x)
          .attr("y", d => d.y)
          .attr("text-anchor", "middle")
          .attr("font-size", d => d.font + "px")
          .attr("font-family", () => randomFont())
          .attr("font-weight", () => randomWeight())
          .attr("font-style", () => randomStyle())
          .attr("fill", color)
          .attr("cursor", "pointer")
          .text(d => d.text)
          .on("mouseover", function (e, d) {
            const movieData = data.find(m => m.title === d.text);
            const year = movieData ? movieData.release_year : '';
            const criticScore = movieData ? (movieData.critic * 100).toFixed(0) + '%' : '-';
            const audScore = movieData ? (movieData.audience * 100).toFixed(0) + '%' : '-';
            d3.select(this).attr("opacity", 0.6).attr("font-weight", 700);
            tooltip
              .style("visibility", "visible")
              .html(`<strong style="color:#8B4513;">${d.text}</strong>${year ? ' (' + year + ')' : ''}<br>
                     <span style="color:#8B4513;">Critics:</span> ${criticScore} &nbsp;|&nbsp; 
                     <span style="color:#D2691E;">Audience:</span> ${audScore}`);
          })
          .on("mousemove", function (e) {
            tooltip
              .style("top", (e.pageY - 45) + "px")
              .style("left", (e.pageX + 12) + "px");
          })
          .on("mouseout", function () {
            d3.select(this).attr("opacity", 1).attr("font-weight", null);
            tooltip.style("visibility", "hidden");
          });
      }

      //--------------------------------------------------
      // Run layouts
      //--------------------------------------------------
      layoutWords(criticOnly, "critic", vintageColors.critic);
      layoutWords(audienceOnly, "audience", vintageColors.audience);
      layoutWords(overlap, "overlap", vintageColors.overlap);

      //--------------------------------------------------
      // Circle labels below
      //--------------------------------------------------
      svg.append("text")
        .attr("class", "venn-circle-label")
        .attr("x", centers.critic.x)
        .attr("y", adjustedCenterY + unifiedR + innerHeight * 0.05)
        .attr("text-anchor", "middle")
        .attr("fill", vintageColors.critic)
        .attr("font-family", "Playfair Display, serif")
        .attr("font-weight", "700")
        .attr("font-size", "13px")
        .text("Critics' Top " + topN);

      svg.append("text")
        .attr("class", "venn-circle-label")
        .attr("x", centers.audience.x)
        .attr("y", adjustedCenterY + unifiedR + innerHeight * 0.05)
        .attr("text-anchor", "middle")
        .attr("fill", vintageColors.audience)
        .attr("font-family", "Playfair Display, serif")
        .attr("font-weight", "700")
        .attr("font-size", "13px")
        .text("Audience's Top " + topN);

      //--------------------------------------------------
      // Update overlap count in sidebar
      //--------------------------------------------------
      const overlapCount = overlap.length;
      d3.select("#overlap-count").text(overlapCount);

      //--------------------------------------------------
      // Update takeaway text based on slider value
      //--------------------------------------------------
      const takeawayEl = d3.select("#venn-takeaway");
      let takeawayText = "";

      if (overlapCount === 0) {
        takeawayText = `At <strong>Top ${topN}</strong>, there is <strong>no overlap</strong>. They favor <strong>completely different films</strong>.`;
      } else if (overlapCount === 1) {
        const overlapTitle = overlap[0] ? overlap[0].title : "one film";
        takeawayText = `At <strong>Top ${topN}</strong>, only <strong>1 film</strong> overlaps: <em>${overlapTitle}</em>. Very different tastes!`;
      } else if (overlapCount <= 5) {
        takeawayText = `At <strong>Top ${topN}</strong>, only <strong>${overlapCount} films</strong> overlap. Critics and audiences favor <strong>mostly different films</strong>.`;
      } else if (overlapCount <= 15) {
        takeawayText = `At <strong>Top ${topN}</strong>, <strong>${overlapCount} films</strong> overlap. Some agreement, but preferences remain <strong>largely distinct</strong>.`;
      } else {
        const overlapPct = ((overlapCount / topN) * 100).toFixed(0);
        takeawayText = `At <strong>Top ${topN}</strong>, <strong>${overlapCount} films (${overlapPct}%)</strong> overlap. More alignment as the list expands.`;
      }

      takeawayEl.html(`<p takeaways-box vintage-card>"Top" means the movies ranked highest by either critics’ or audience score. 
        Critics’ top ${topN} uses critic scores, and Audience’s top ${topN} uses audience scores. <br>${takeawayText}</p>`);
    }

    //--------------------------------------------------
    // INITIAL DRAW
    //--------------------------------------------------
    const defaultN = +rangeInput.node().value || 50;
    drawVenn(defaultN);
    rangeValue.text(defaultN);
    vennTitle.text(`Top ${defaultN} Movies: Critic vs Audience`);

    //--------------------------------------------------
    // SLIDER UPDATE
    //--------------------------------------------------
    rangeInput.on("input", function () {
      const n = +this.value;
      rangeValue.text(n);
      vennTitle.text(`Top ${n} Movies: Critic vs Audience`);
      drawVenn(n);
    });

    //--------------------------------------------------
    // WINDOW RESIZE — REDRAW
    //--------------------------------------------------
    window.addEventListener("resize", () => {
      const n = +rangeInput.node().value;
      drawVenn(n);
    });
  });
})();


//--------------------------------------------------
// Movie Recommendation Tool
//--------------------------------------------------
function initMovieRecommendationTool() {
  if (initMovieRecommendationTool._initialized) return;
  initMovieRecommendationTool._initialized = true;

  function fmt(n) {
    if (n === undefined || n === null) return "-";
    if (+n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (+n >= 1e3) return (n / 1e3).toFixed(1) + "k";
    return Math.round(n).toString();
  }

  function fmtDecimal(n) {
    if (n === undefined || n === null) return "-";
    const num = +n;
    if (isNaN(num)) return "-";
    return num.toFixed(2);
  }

  d3.csv("data/imdb_tomatoes.csv").then(raw => {
    const data = raw.map(d => ({
      movie_id: d.movie_id || d.movieId || d.movieid || (d.title + "_" + d.release_year),
      movie_name: d.movie_name || d.movieName || d.title || d.Name || "",
      release_year: +d.release_year || +d.year || (d.release_date ? +d.release_date.slice(-4) : NaN),
      critic_score: +(d.critic_score || d.critic || 0),
      audience_score: +(d.audience_score || d.audience || 0),
      votes: +(d.votes || d.numVotes || 0),
      genre: d.genre || d.genres || "",
      description: d.description || d.plot || "",
      director: d.director || "",
      runtime: d.runtime || d.running_time || "",
      certificate: d.certificate || "",
      rating: d.rating || "",
      gross: d["gross(in $)"] || d.gross || ""
    })).filter(d => !isNaN(d.release_year));

    const genres = Array.from(new Set(data.flatMap(d => d.genre ? d.genre.split(',').map(s => s.trim()).filter(Boolean) : []))).sort();
    const genreSel = d3.select("#genre");
    genreSel.selectAll("option").data(["All", ...genres]).join("option").attr("value", d => d).text(d => d);

    let voteRange = [d3.min(data, d => d.votes), d3.max(data, d => d.votes)];
    let critBrushRange = null;
    let audBrushRange = null;

    const vW = 140, vH = 420, vMg = { top: 8, right: 8, bottom: 28, left: 36 };
    const voteSvg = d3.select("#voteSvg");
    voteSvg.selectAll("*").remove();

    const votesArr = data.map(d => Math.max(1, d.votes || 0));
    const maxVote = d3.max(votesArr);
    const minVote = 1;

    const binCount = 50;
    const logMin = Math.log10(minVote);
    const logMax = Math.log10(maxVote || 1);
    const thresholds = d3.range(0, binCount + 1).map(i =>
      Math.pow(10, logMin + i * (logMax - logMin) / binCount)
    );

    const binGen = d3.bin()
      .domain([minVote, maxVote])
      .thresholds(thresholds)
      .value(d => Math.max(1, d));

    const bins = binGen(votesArr);

    const yLinear = d3.scaleLinear()
      .domain([Math.log10(minVote), Math.log10(maxVote)])
      .range([vMg.top, vH - vMg.bottom]);

    const xCount = d3.scaleLinear()
      .domain([0, d3.max(bins, b => b.length)])
      .range([0, vW - vMg.left - vMg.right]);

    voteSvg.append("g")
      .selectAll("rect")
      .data(bins)
      .join("rect")
      .attr("x", vMg.left)
      .attr("y", d => yLinear(Math.log10(d.x1)) + 1)
      .attr("width", d => xCount(d.length))
      .attr("height", d => Math.max(1, yLinear(Math.log10(d.x0)) - yLinear(Math.log10(d.x1)) - 1))
      .attr("fill", vintageColors.accent)
      .attr("stroke", vintageColors.coffee);

    const yAxisTicks = [1, 10, 100, 1000, 10000, 100000, 1000000].filter(t => t <= maxVote);
    const yAxisG = voteSvg.append("g").attr("transform", "translate(" + (vMg.left - 6) + ",0)");
    yAxisG.selectAll("text")
      .data(yAxisTicks)
      .join("text")
      .attr("x", 0)
      .attr("y", d => yLinear(Math.log10(d)))
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .attr("font-size", 11)
      .attr("fill", "#6F4E37")
      .attr("font-family", "Crimson Text, serif")
      .text(d => fmt(Math.round(d)));

    const voteBrush = d3.brushY()
      .extent([[vMg.left, vMg.top], [vW - vMg.right, vH - vMg.bottom]])
      .on("brush end", ({ selection }) => {
        if (selection) {
          const [y0, y1] = selection;
          const v0 = Math.round(Math.pow(10, yLinear.invert(y1)));
          const v1 = Math.round(Math.pow(10, yLinear.invert(y0)));
          voteRange = [Math.min(v0, v1), Math.max(v0, v1)];
          d3.select("#voteLabel").text(fmt(voteRange[0]) + " — " + fmt(voteRange[1]));
        } else {
          voteRange = [d3.min(data, d => d.votes || 0), d3.max(data, d => d.votes || 0)];
          d3.select("#voteLabel").text("All");
        }
        updateAll();
      });

    voteSvg.append("g").attr("class", "brush").call(voteBrush);

    function createHoriz(svgId, accessor, labelId, summaryId, onBrushSet) {
      const W = 420, H = 140, mg = { left: 36, right: 10, top: 8, bottom: 28 };
      const svg = d3.select(svgId);
      svg.selectAll("*").remove();

      const x = d3.scaleLinear().domain([0, 1]).range([mg.left, W - mg.right]);
      const y = d3.scaleLinear().range([H - mg.bottom, mg.top]);

      // ✅ 一次性绘制完整分布（不再动态更新）
      const barsG = svg.append("g").attr("class", "bars-bg");
      const allVals = data.map(accessor).filter(v => !isNaN(v));
      const binGen = d3.bin().domain(x.domain()).thresholds(25);
      const bins = binGen(allVals);
      y.domain([0, d3.max(bins, b => b.length)]);

      barsG.selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
        .attr("x", d => x(d.x0))
        .attr("y", d => y(d.length))
        .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
        .attr("height", d => y(0) - y(d.length))
        .attr("fill", "#C9A55B")
        .attr("opacity", 0.8);
      const brushG = svg.append("g").attr("class", "brush-layer");   // 专门放 brush


      // ✅ 添加轻量提示文字
      // ✅ 提示文字：放在 x 轴正下方
      svg.append("text")
        .attr("class", "hint-text")
        .attr("x", W / 2)
        .attr("y", H - mg.bottom + 26) // ← 放在坐标轴下方一点
        .attr("text-anchor", "middle")
        .attr("fill", "black") // 深棕色，与标题风格一致
        .attr("font-size", 11)
        .attr("font-family", "Crimson Text, serif")
        .attr("opacity", 0.6)
        .text("💡 Drag or resize the box above to filter");


      svg.append("g")
        .attr("transform", "translate(0," + (H - mg.bottom) + ")")
        .call(d3.axisBottom(x).ticks(5))
        .selectAll("text")
        .style("fill", "#6F4E37")
        .style("font-family", "Crimson Text, serif");

      const brush = d3.brushX().extent([[mg.left, mg.top], [W - mg.right, H - mg.bottom]])
        .on("brush end", ({ selection }) => {
          if (selection) {
            const [s, e] = selection;
            const v0 = x.invert(s);
            const v1 = x.invert(e);
            onBrushSet([Math.max(0, v0), Math.min(1, v1)]);
          } else {
            onBrushSet(null);
          }
          updateAll();
        });

      svg.append("g").attr("class", "brush").call(brush);

      function update(vals) {

      }

      return { x, update, svg, brush, setBrush: (b) => { svg.select(".brush").call(brush.move, b ? [x(b[0]), x(b[1])] : null); } };
    }

    const criticHist = createHoriz("#criticSvg", d => d.critic_score, "#critLabel", "#critSummary", (range) => {
      if (range) { critBrushRange = [Math.max(0, range[0]), Math.min(1, range[1])]; d3.select("#critLabel").text(critBrushRange.map(v => v.toFixed(1)).join(' — ')); d3.select("#critSummary").text(critBrushRange[0].toFixed(1)); }
      else { critBrushRange = null; d3.select("#critLabel").text("All"); d3.select("#critSummary").text("All"); }
    });

    const audHist = createHoriz("#audienceSvg", d => d.audience_score, "#audLabel", "#audSummary", (range) => {
      if (range) { audBrushRange = [Math.max(0, range[0]), Math.min(1, range[1])]; d3.select("#audLabel").text(audBrushRange.map(v => v.toFixed(1)).join(' — ')); d3.select("#audSummary").text(audBrushRange[0].toFixed(1)); }
      else { audBrushRange = null; d3.select("#audLabel").text("All"); d3.select("#audSummary").text("All"); }
    });




    // ✅ 外层滚动容器
    //--------------------------------------------------
    // ✅ 改进版 Timeline（含横向滚动与缩放）
    //--------------------------------------------------

    const tW = 1200; // 宽一点，确保有可滚动空间
    const tH = 420, tMg = { left: 60, right: 100, top: 20, bottom: 20 };

    // 选中 SVG 并设置尺寸
    const tSvg = d3.select("#timeline")
      .attr("width", tW)
      .attr("height", tH);

    // 设置外层容器滚动行为
    d3.select("#timeline-wrap")
      .style("overflow-x", "auto")
      .style("overflow-y", "hidden")
      .style("width", "100%")
      .style("border", "none")
      .style("background", "#F5E6D3");

    tSvg.selectAll("*").remove();

    // 计算年份范围
    const years = data.map(d => d.release_year).filter(y => !isNaN(y));
    const yearMin = d3.min(years);
    const yearMax = d3.max(years);

    // 定义比例尺与 X 轴
    const x = d3.scaleLinear()
      .domain([yearMin, 1965, yearMax])
      .range([tMg.left, tMg.left + (tW - tMg.left - tMg.right) * 0.15, tW - tMg.right]);


    // 自定义刻度：1915–1965 每 10 年；1965–yearMax 每 5 年
    const ticks = [
      ...d3.range(1915, 1970, 20),   // 1915, 1925, 1935, ..., 1965
      ...d3.range(1970, yearMax + 1, 5) // 1970, 1975, ..., 2025
    ];

    const xAxis = d3.axisBottom(x)
      .tickValues(ticks)
      .tickFormat(d3.format("d"));


    // ✅ 先画背景条
    const first5 = Math.floor(yearMin / 5) * 5;
    const last5 = Math.ceil(yearMax / 5) * 5;
    const bands = d3.range(first5, last5 + 1, 5);



    // ✅ 再画 X 轴（置顶，避免被覆盖）
    tSvg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${tH - tMg.bottom})`)
      .call(xAxis)
      .raise() // ⬅️ 关键：把轴线提升到最上层
      .selectAll("text")
      .style("fill", "#6F4E37")
      .style("font-family", "Crimson Text, serif");

    // ✅ 气泡层
    const bubbleG = tSvg.append("g").attr("class", "bubbles");
    const rScale = d3.scaleLinear().domain([0, 1]).range([6, 10]);

    function yearToX(year) {
      return x(Math.max(yearMin, Math.min(yearMax, year)));
    }

    // ✅ updateAll
    function updateAll() {
      const selGenre = d3.select("#genre").property("value");

      let pool = data.filter(d => d.votes >= voteRange[0] && d.votes <= voteRange[1]);
      if (selGenre !== "All") pool = pool.filter(d => d.genre && d.genre.includes(selGenre));
      if (critBrushRange) pool = pool.filter(d => d.critic_score >= critBrushRange[0] && d.critic_score <= critBrushRange[1]);
      if (audBrushRange) pool = pool.filter(d => d.audience_score >= audBrushRange[0] && d.audience_score <= audBrushRange[1]);

      d3.select("#counts-box").text(pool.length);

      pool.forEach(d => d.avg = (d.critic_score + d.audience_score) / 2);
      const shown = pool.slice().sort((a, b) => b.votes - a.votes).slice(0, 1000);

      const nodes = bubbleG.selectAll("g.movie").data(shown, d => d.movie_id);
      nodes.exit().transition().duration(150).style("opacity", 0).remove();

      const enter = nodes.enter()
        .append("g")
        .attr("class", "movie")
        .attr("transform", d => {
          const year = Math.max(yearMin, Math.min(yearMax, d.release_year));
          d._y = tMg.top + Math.random() * (tH - tMg.top - tMg.bottom);
          return "translate(" + x(year) + "," + d._y + ")";
        })
        .style("opacity", 0);

      enter.append("circle")
        .attr("r", 0)
        .attr("fill", vintageColors.accent)
        .attr("opacity", 0.7)
        .attr("stroke", vintageColors.brown);

      enter.append("text")
        .attr("class", "timeline-label")
        .attr("text-anchor", "middle")
        .attr("dy", 4)
        .text(d =>
          (d.movie_name || "").length > 14
            ? (d.movie_name || "").slice(0, 10) + "…"
            : d.movie_name
        );

      const all = enter.merge(nodes);
      all.transition().duration(350)
        .attr("transform", d => {
          const year = Math.max(yearMin, Math.min(yearMax, d.release_year));
          return "translate(" + x(year) + "," + (d._y || tMg.top + Math.random() * (tH - tMg.top - tMg.bottom)) + ")";
        })
        .style("opacity", 1);
      all.select("circle").transition().duration(350).attr("r", d => rScale(d.avg));

      // ✅ Tooltip逻辑保持不变
      let lockedMovie = null;
      all.on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .style("visibility", "visible")
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 8) + "px")
          .html(
            `<b>${d.movie_name || ""}</b><br/>
        Year: ${d.release_year}<br/>
        Critic: ${isFinite(d.critic_score) ? d.critic_score.toFixed(2) : "-"}
        &nbsp; Audience: ${isFinite(d.audience_score) ? d.audience_score.toFixed(2) : "-"}<br/>
        Votes: ${fmt(d.votes)}`
          );
      })
        .on("mousemove", (event) => {
          tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY + 8) + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0).style("visibility", "hidden"))
        .on("click", (event, d) => {
          if (lockedMovie && lockedMovie.movie_id === d.movie_id) {
            lockedMovie = null;
            d3.select("#detailContent").html("<i>Hovered movie details</i>");
          } else {
            lockedMovie = d;
            const html = `
          <div style="font-weight:700; color:#8B4513; font-family: Playfair Display, serif;">
            ${d.movie_name || ""}
          </div>
          <div style="font-size:13px;color:#4A2C2A;margin-top:8px">
            <b>Year:</b> ${d.release_year} &nbsp; <b>Votes:</b> ${fmt(d.votes)}<br/>
            <b>Critic:</b> ${d.critic_score} &nbsp; <b>Audience:</b> ${d.audience_score} &nbsp; 
            <b>Avg:</b> ${(d.avg ? d.avg.toFixed(3) : "-")}<br/>
            <b>Genre:</b> ${d.genre || "-"}<br/>
            <b>Director:</b> ${d.director || "-"} &nbsp; <b>Runtime:</b> ${d.runtime || "-"}<br/>
            <b>Certificate:</b> ${d.certificate || "-"} &nbsp; <b>Rating:</b> ${d.rating || "-"}<br/>
            <b>Gross:</b> ${d.gross || "-"}<br/>
            <div style="margin-top:8px;color:#4A2C2A">
              <b>Description:</b>
              <div style="margin-top:6px;color:#6F4E37">
                ${(d.description || "").slice(0, 800)}
              </div>
            </div>
          </div>`;
            d3.select("#detailContent").html(html);
          }
        });

      renderTopTable(pool);
      d3.select("#voteSummary").text(voteRange[0] === d3.min(data, d => d.votes) && voteRange[1] === d3.max(data, d => d.votes)
        ? "All"
        : (fmt(voteRange[0]) + " — " + fmt(voteRange[1])));
      d3.select("#critSummary").text(critBrushRange ? fmtDecimal(critBrushRange[0]) + " — " + fmtDecimal(critBrushRange[1]) : "All");
      d3.select("#audSummary").text(audBrushRange ? fmtDecimal(audBrushRange[0]) + " — " + fmtDecimal(audBrushRange[1]) : "All");

      criticHist.update(pool.map(d => d.critic_score));
      audHist.update(pool.map(d => d.audience_score));
    }


    function renderTopTable(pool) {
      const topN = +d3.select("#topN").property("value");
      const topList = pool.slice().sort((a, b) => (b.avg || 0) - (a.avg || 0)).slice(0, topN);
      const wrap = d3.select("#tableWrap");
      wrap.selectAll("*").remove();
      const table = wrap.append("table");
      const thead = table.append("thead").append("tr");
      ["Rank", "Title", "Year", "Avg", "Critic", "Audience", "Votes"].forEach(h => thead.append("th").text(h));
      const tbody = table.append("tbody");
      topList.forEach((d, i) => {
        const tr = tbody.append("tr");
        tr.append("td").text(i + 1);
        tr.append("td").text(d.movie_name);
        tr.append("td").text(d.release_year);
        tr.append("td").text((d.avg || 0).toFixed(3));
        tr.append("td").text(d.critic_score);
        tr.append("td").text(d.audience_score);
        tr.append("td").text(fmt(d.votes));
      });
    }

    d3.select("#genre").on("change", updateAll);
    d3.select("#topN").on("change", updateAll);

    d3.select("#exportBtn").on("click", () => {
      const selGenre = d3.select("#genre").property("value");
      let pool = data.filter(d => d.votes >= voteRange[0] && d.votes <= voteRange[1]);
      if (selGenre !== "All") pool = pool.filter(d => d.genre && d.genre.includes(selGenre));
      if (critBrushRange) pool = pool.filter(d => d.critic_score >= critBrushRange[0] && d.critic_score <= critBrushRange[1]);
      if (audBrushRange) pool = pool.filter(d => d.audience_score >= audBrushRange[0] && d.audience_score <= audBrushRange[1]);
      const csv = d3.csvFormat(pool, ["movie_id", "movie_name", "release_year", "critic_score", "audience_score", "avg", "votes", "genre", "description", "director", "runtime", "certificate", "rating", "gross"]);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "filtered_movies.csv";
      a.click();
      URL.revokeObjectURL(url);
    });

    d3.select("#voteLabel").text("All");
    d3.select("#critLabel").text("All");
    d3.select("#audLabel").text("All");
    d3.select("#critSummary").text("All");
    d3.select("#audSummary").text("All");

    voteRange = [d3.min(data, d => d.votes), d3.max(data, d => d.votes)];
    updateAll();

    // --------------------------------------------------------------
    //  页面首次绘制完后再加初始 brush（Critic / Audience / Votes）
    // --------------------------------------------------------------
    setTimeout(() => {

      // -----------------------------
      // ⭐ 1. Critic 初始框选：0.4–0.6
      // -----------------------------
      const initialCritRange = [0.4, 0.6];
      critBrushRange = initialCritRange;
      criticHist.setBrush(initialCritRange);
      d3.select("#critLabel").text(initialCritRange.map(v => v.toFixed(1)).join(" — "));
      d3.select("#critSummary").text(initialCritRange[0].toFixed(1));


      // -----------------------------
      // ⭐ 2. Audience 初始框选：0.3–0.5
      // -----------------------------
      const initialAudRange = [0.3, 0.5];
      audBrushRange = initialAudRange;
      audHist.setBrush(initialAudRange);
      d3.select("#audLabel").text(initialAudRange.map(v => v.toFixed(1)).join(" — "));
      d3.select("#audSummary").text(initialAudRange[0].toFixed(1));


      // -----------------------------
      // ⭐ 3. Vote 初始框选：中间 30%–70%
      // -----------------------------
      const allVotes = data.map(d => d.votes).filter(v => v > 0).sort((a, b) => a - b);
      const voteLow = allVotes[Math.floor(allVotes.length * 0.3)];
      const voteHigh = allVotes[Math.floor(allVotes.length * 0.7)];

      voteRange = [voteLow, voteHigh];
      d3.select("#voteLabel").text(`${fmt(voteLow)} — ${fmt(voteHigh)}`);

      // --- brush Y scale ---
      const yScale = d3.scaleLinear()
        .domain([Math.log10(minVote), Math.log10(maxVote)])
        .range([vMg.top + 10, vH - vMg.bottom]);

      const voteBrushG = d3.select("#voteSvg").select(".brush");

      const yTop = yScale(Math.log10(voteLow));     // 小 vote（高）
      const yBottom = yScale(Math.log10(voteHigh)); // 大 vote（低）

      // ⭐ 使用全局 voteBrush 移动 brush
      voteBrushG.call(voteBrush.move, [yTop, yBottom]);

      // ⭐ 把 brush 提到最上层
      voteBrushG.raise();


      // -----------------------------
      // ⭐ 4. 添加 “Drag the box…” 提示（需放在 brush 后面 append!!!）
      // -----------------------------
      const hint = voteSvg.append("text")
        .attr("class", "hint-text-vote")
        .attr("x", vW - 15)
        .attr("y", vH - 5)
        .attr("text-anchor", "end")
        .attr("fill", "black")
        .attr("font-size", 11)
        .attr("font-family", "Crimson Text, serif")
        .attr("opacity", 0.9)
        .text("💡 Drag the box to filter votes");

      // ⭐⭐ 必须在 append 后再 raise，否则无效！
      hint.raise();


      // -----------------------------
      // ⭐ 5. 强制刷新一次，让初始 brush 生效
      // -----------------------------
      updateAll();


      // -----------------------------
      // ⭐ 6. 美化 brush selection
      // -----------------------------
      d3.selectAll(".brush .selection")
        .attr("fill", "#C19A6B")
        .attr("fill-opacity", 0.28)
        .attr("stroke", "#6F4E37")
        .attr("stroke-width", 1.1);

    }, 300);

  });
}

initMovieRecommendationTool();


//--------------------------------------------------
// 🔵 Page Dots Navigation — auto highlight + click jump
//--------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(".page");
  const nav = document.getElementById("page-nav-dots");

  // 清空旧点
  nav.innerHTML = "";

  // 生成对应页面数的小点
  sections.forEach((sec, i) => {
    const dot = document.createElement("div");
    dot.classList.add("page-dot");
    dot.dataset.page = i + 1;
    nav.appendChild(dot);

    // 点击小点 → 跳转到对应 section
    dot.addEventListener("click", () => {
      sec.scrollIntoView({ behavior: "smooth" });
    });
  });

  const dots = document.querySelectorAll(".page-dot");

  // 监听滚动，更新当前高亮的点
  window.addEventListener("scroll", () => {
    let currentPage = 0;

    sections.forEach((section, index) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.4 && rect.bottom >= window.innerHeight * 0.4) {
        currentPage = index;
      }
    });

    dots.forEach(dot => dot.classList.remove("active"));
    if (dots[currentPage]) dots[currentPage].classList.add("active");
  });
});


// ========================================================
// 🎬 Page 4: Interactive Divergent Movies
// ========================================================

document.addEventListener('DOMContentLoaded', function () {
  // Animate bars when page becomes visible
  function animateDivergentBars() {
    const page4 = document.getElementById('page5');

    // removed the scrollIntoView call so it doesn't hijack scroll
    // previously:
    // page4.scrollIntoView({ behavior: "smooth" });

    if (!page4 || page4.classList.contains('hidden')) return;

    const barFills = page4.querySelectorAll('.bar-fill');
    barFills.forEach(bar => {
      const targetWidth = bar.getAttribute('data-width');
      // Set width directly with inline style
      setTimeout(() => {
        bar.style.width = targetWidth + '%';
        bar.classList.add('animated');
      }, 300);
    });
  }

  // Observer to detect when page 4 becomes visible
  const page4Observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.classList.contains('hidden')) {
        animateDivergentBars();
      }
    });
  }, { threshold: 0.3 });

  const page4 = document.getElementById('page5');
  if (page4) {
    page4Observer.observe(page4);
  }

  // Toggle "Why the split?" sections
  const toggleButtons = document.querySelectorAll('.why-split-toggle');
  toggleButtons.forEach(button => {
    button.addEventListener('click', function (e) {
      e.stopPropagation();

      // Find the content that comes right after THIS button
      const content = this.nextElementSibling;
      const isExpanded = content.classList.contains('expanded');

      if (isExpanded) {
        // Collapse this section
        content.classList.remove('expanded');
        this.classList.remove('active');
        this.innerHTML = 'Why the split? ▼';
      } else {
        // Expand this section
        content.classList.add('expanded');
        this.classList.add('active');
        this.innerHTML = 'Why the split? ▲';
      }
    });
  });
});


// Only show bottom-fixed when page9 is in viewport
function updateBottomFixed() {
  const bottom = document.querySelector(".bottom-fixed");
  const page9 = document.getElementById("page10");
  if (!bottom || !page9) return;

  const rect = page9.getBoundingClientRect();

  const inView =
    rect.top < window.innerHeight * 0.6 &&
    rect.bottom > window.innerHeight * 0.4;

  bottom.style.display = inView ? "flex" : "none";
}

// Listen on scroll + load
window.addEventListener("scroll", updateBottomFixed);
window.addEventListener("load", updateBottomFixed);


function handlePage8Video() {
  const page8 = document.getElementById("page9");
  const vidContainer = document.getElementById("page8-video-container");
  const rect = page8.getBoundingClientRect();

  const inView = rect.top < window.innerHeight * 0.6 &&
    rect.bottom > window.innerHeight * 0.4;

  if (inView) {
    vidContainer.style.opacity = "0.9";   // 淡入
  } else {
    vidContainer.style.opacity = "0";     // 淡出
  }
}

window.addEventListener("scroll", handlePage8Video);
window.addEventListener("load", handlePage8Video);


document.addEventListener("DOMContentLoaded", () => {
  const page6 = document.getElementById("page7");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {

        // 🟠 激活动画 —— 给 path 加 .animate
        document.querySelectorAll("#chart-q2 .rating-line")
          .forEach(line => line.classList.add("animate"));

        // 为了避免反复播放，播放一次后停止监听
        observer.unobserve(page6);
      }
    });
  }, {
    threshold: 0.4
  });

  observer.observe(page6);
});



// ========================================================
// 🎬 Page 3 – Genre Streamgraph (Top 7 + Time Compression + Tooltip + Synced Slider)
// ========================================================

(function() { // IIFE to isolate scope

    /* ---------- Utilities ---------- */
    function getField(d, names) {
        for (const n of names) if (d[n] !== undefined) return d[n];
        return undefined;
    }

    /* ---------- Configuration ---------- */
    const csvPath_p3 = "data/imdb_tomatoes.csv";
    const dom = {
        svg: d3.select("#timeline-svg"),
        sliderContainer: document.querySelector(".controls"), // Parent of slider
        slider: document.getElementById("yearRange"),
        label: document.getElementById("yearRangeLabel"),
        statYear: document.getElementById("currentYear"),
        statTopGenre: document.getElementById("topGenreYear"),
        statTotal: document.getElementById("totalReleasesYear"),
        legend: d3.select("#legendContainer")
    };

    // Expanded Vintage Palette for Top 7 + Other
    const colorPalette = [
        "#D2691E", // 1. Chocolate
        "#C09858", // 2. Golden Bronze
        "#8B4513", // 3. Saddle Brown
        "#A0522D", // 4. Sienna (Reddish Brown)
        "#556B2F", // 5. Dark Olive Green
        "#6B8E23", // 6. Olive Drab
        "#CD853F", // 7. Peru
        "#A69FA6"  // 8. Other (Muted Gray)
    ];

    /* ---------- Inject Tooltip Style & Element ---------- */
    // Create tooltip div if not exists
    let tooltip = document.getElementById("p3-tooltip");
    if (!tooltip) {
        tooltip = document.createElement("div");
        tooltip.id = "p3-tooltip";
        tooltip.style.cssText = `
            position: absolute;
            display: none;
            background: rgba(244, 226, 198, 0.95); /* Vintage cream background */
            border: 1px solid #8B4513;
            padding: 8px 12px;
            border-radius: 4px;
            pointer-events: none;
            font-family: 'Courier Prime', monospace; /* Or inherit */
            font-size: 13px;
            color: #4a3b32;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            z-index: 1000;
            min-width: 160px;
            line-height: 1.4;
        `;
        document.body.appendChild(tooltip);
    }

    /* ---------- Main Logic ---------- */
    d3.csv(csvPath_p3).then(raw => {
        
        // 1. Data Cleaning
        let parsedRows = raw.map(r => {
            const yearVal = getField(r, ["release_year", "year", "Year"]);
            const genreStr = getField(r, ["genres", "genre", "Genre", "Genres"]) || "Other";
            return {
                year: parseInt(yearVal) || NaN,
                genres: genreStr.split(',').map(g => g.trim()).filter(g => g)
            };
        }).filter(d => !isNaN(d.year) && d.year > 1920 && d.year <= 2024);

        // 2. Identify Top 7 Genres
        const genreCounts = {};
        parsedRows.forEach(row => {
            row.genres.forEach(g => {
                genreCounts[g] = (genreCounts[g] || 0) + 1;
            });
        });

        const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
        const top7 = sortedGenres.slice(0, 7).map(d => d[0]);
        const keys = [...top7, "Other"];

        console.log("Top 7 Genres:", top7);

        // 3. Aggregate Data per Year
        const yearMap = new Map();
        const minYear = d3.min(parsedRows, d => d.year);
        const maxYear = d3.max(parsedRows, d => d.year);
        const allYears = d3.range(minYear, maxYear + 1);

        allYears.forEach(y => {
            const obj = { year: y, total: 0 };
            keys.forEach(k => obj[k] = 0);
            yearMap.set(y, obj);
        });

        parsedRows.forEach(row => {
            const yObj = yearMap.get(row.year);
            if (yObj) {
                row.genres.forEach(g => {
                    if (top7.includes(g)) {
                        yObj[g]++;
                    } else {
                        yObj["Other"]++;
                    }
                    yObj.total++;
                });
            }
        });

        const chartData = Array.from(yearMap.values());

        // 4. Stack Configuration
        const stack = d3.stack()
            .keys(keys)
            .offset(d3.stackOffsetSilhouette) 
            .order(d3.stackOrderNone);

        const series = stack(chartData);

        // 5. Draw Chart
        const svg = dom.svg;
        svg.selectAll("*").remove();

        // --- Layout Dimensions ---
        const containerNode = svg.node().parentNode;
        let containerWidth = containerNode.getBoundingClientRect().width || 800;
        
        // Adjust width to fit comfortably
        let width = containerWidth - 20; 
        let height = Math.min(width / 2.5, 300); 
        if (height < 200) height = 200;

        const margin = { top: 10, right: 15, bottom: 25, left: 15 };
        const innerWidth = width - margin.left - margin.right;

        svg.attr("viewBox", `0 0 ${width} ${height}`)
           .attr("preserveAspectRatio", "xMidYMid meet");

        // --- Piecewise X Scale (Time Compression) ---
        const splitYear = 1970;
        const splitRatio = 0.25; // 1920-1970 takes 25% space
        const splitPixel = margin.left + innerWidth * splitRatio;

        // Polylinear Scale: Input Year -> Output Pixels
        const x = d3.scaleLinear()
            .domain([minYear, splitYear, maxYear])
            .range([margin.left, splitPixel, width - margin.right]);

        const yMax = d3.max(series, layer => d3.max(layer, d => d[1]));
        const yMin = d3.min(series, layer => d3.min(layer, d => d[0]));
        
        const y = d3.scaleLinear()
            .domain([yMin, yMax])
            .range([height - margin.bottom, margin.top]);

        const color = d3.scaleOrdinal()
            .domain(keys)
            .range(colorPalette);

        const area = d3.area()
            .curve(d3.curveBasis)
            .x(d => x(d.data.year))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]));

        // --- ALIGN SLIDER TO X-SCALE ---
        // Critical Step: We make the slider width match the SVG width.
        // But more importantly, we will map the slider values to PIXELS, not YEARS.
        if (dom.slider) {
            // 1. Match physical width
            dom.sliderContainer.style.padding = "0"; // Remove container padding if any
            dom.slider.style.width = `${width}px`;   // Match SVG ViewBox width
            dom.slider.style.marginLeft = "0px";
            
            // 2. Set Slider Domain to Match Visual Range (Pixels)
            // Range is from margin.left to width-margin.right
            const rangeStart = margin.left;
            const rangeEnd = width - margin.right;
            
            dom.slider.min = rangeStart;
            dom.slider.max = rangeEnd;
            dom.slider.step = 1; // Move by 1 pixel unit
            
            // Set initial value to max (Pixel position of 2024)
            dom.slider.value = rangeEnd;
        }

        // --- Custom Ticks ---
        const customTicks = [];
        for (let y = Math.ceil(minYear/25)*25; y < 1970; y+=25) if(y>=minYear) customTicks.push(y);
        if(!customTicks.includes(1970)) customTicks.push(1970);
        for (let y = 1975; y <= maxYear; y+=5) customTicks.push(y);

        // Render Legend
        dom.legend.html("");
        keys.forEach(k => {
            dom.legend.append("div")
                .attr("class", "legend-item")
                .style("font-size", "10px")
                .html(`<span class="legend-dot" style="background:${color(k)}"></span> ${k}`);
        });

        // Render Layers
        const layerGroup = svg.append("g");
        const paths = layerGroup.selectAll("path")
            .data(series)
            .join("path")
            .attr("class", "stream-layer")
            .attr("d", area)
            .attr("fill", d => color(d.key))
            .attr("cursor", "pointer")
            .attr("stroke", "white")
            .attr("stroke-width", 0); // Default

        // Render X Axis
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x)
                .tickValues(customTicks)
                .tickFormat(d3.format("d"))
                .tickSize(4)
            )
            .attr("color", "#8B6F62")
            .select(".domain").remove();

        // 6. Interaction Layers
        const overlay = svg.append("rect")
            .attr("class", "future-overlay")
            .attr("x", width)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height);

        const cursorLine = svg.append("line")
            .attr("class", "cursor-line")
            .attr("y1", margin.top)
            .attr("y2", height - margin.bottom)
            .attr("opacity", 0);

        const dotsGroup = svg.append("g").attr("class", "dots-group");

        // State
        let currentSliderYear = maxYear;

        // 7. Slider Logic (The Time Machine)
        dom.label.innerText = maxYear;
        
        // Initial Draw
        updateVisuals(maxYear);
        updateBottomStats(maxYear); 

        dom.slider.addEventListener("input", (e) => {
            // 1. Get Pixel Value from Slider
            const pixelPos = +e.target.value;
            
            // 2. Invert Pixel to Year (Using the polylinear scale)
            // This automatically handles the compression:
            // A pixel movement on left returns years slowly.
            // A pixel movement on right returns years quickly.
            const rawYear = x.invert(pixelPos); 
            currentSliderYear = Math.round(rawYear);
            
            // Boundary Check
            if (currentSliderYear < minYear) currentSliderYear = minYear;
            if (currentSliderYear > maxYear) currentSliderYear = maxYear;

            // 3. Update UI
            dom.label.innerText = currentSliderYear;
            updateVisuals(currentSliderYear);
            updateBottomStats(currentSliderYear);
        });

        // 8. Hover Logic (Floating Box - Simplified)
        paths.on("mousemove", function(event, d) {
            const hoveredGenre = d.key;
            
            // Highlight effect
            paths.attr("opacity", 0.5); 
            d3.select(this).attr("opacity", 1).attr("stroke", "#fff").attr("stroke-width", 1);

            // Get Data for CURRENT SLIDER YEAR
            const idx = currentSliderYear - minYear;
            const data = chartData[idx];

            if (data) {
                const count = data[hoveredGenre] || 0;
                const total = data.total || 1;
                // Calculate Percentage
                const pct = ((count / total) * 100).toFixed(1) + "%";

                // Build Tooltip Content (Minimalist)
                tooltip.innerHTML = `
                    <div style="border-bottom:1px dashed #8B4513; margin-bottom:4px; padding-bottom:4px;">
                        <strong>Year: ${currentSliderYear}</strong>
                    </div>
                    <div style="margin-top:4px; color:${color(hoveredGenre)}; font-weight:bold;">
                        ● ${hoveredGenre}
                    </div>
                    <div>Count: ${count}</div>
                    <div>Share: ${pct}</div>
                `;

                // Position Tooltip
                tooltip.style.display = "block";
                tooltip.style.left = (event.pageX + 15) + "px";
                tooltip.style.top = (event.pageY - 15) + "px";
            }
        })
        .on("mouseleave", function() {
            // Reset Highlight
            paths.attr("opacity", 1).attr("stroke-width", 0);
            // Hide Tooltip
            tooltip.style.display = "none";
        });


        // Helper: Update Bottom Static Text
        function updateBottomStats(year) {
            const idx = year - minYear;
            const data = chartData[idx];
            if(!data) return;

            dom.statYear.textContent = year;
            dom.statTotal.textContent = data.total.toLocaleString();

            // Calculate Top Genre
            let maxG = "None";
            let maxV = 0;
            keys.forEach(k => {
                if(data[k] > maxV) {
                    maxV = data[k];
                    maxG = k;
                }
            });
            
            // Display with percentage
            const pct = data.total > 0 ? ((maxV/data.total)*100).toFixed(1) + "%" : "0%";
            dom.statTopGenre.innerHTML = `${maxG} (${pct})`;
        }

        // Helper: Update Line, Dots, Overlay
        function updateVisuals(year) {
            const idx = year - minYear;
            const currentData = chartData[idx];
            
            const xPos = x(year);

            // Overlay
            overlay.attr("x", xPos).attr("width", Math.max(0, width - xPos));
            
            // Line
            cursorLine.attr("x1", xPos).attr("x2", xPos).attr("opacity", 1);

            // Dots
            const layerPoints = series.map(layer => {
                const d = layer[idx]; 
                if (!d) return null;
                const thickness = Math.abs(y(d[0]) - y(d[1]));
                const yCenter = (y(d[0]) + y(d[1])) / 2;
                return { 
                    key: layer.key, 
                    y: yCenter, 
                    thickness: thickness 
                };
            }).filter(pt => pt && pt.thickness > 8);

            const circles = dotsGroup.selectAll("circle")
                .data(layerPoints, d => d.key);

            circles.join(
                enter => enter.append("circle")
                    .attr("r", 3.5)
                    .attr("fill", "#fff")
                    .attr("stroke", d => color(d.key))
                    .attr("stroke-width", 2)
                    .attr("cx", xPos)
                    .attr("cy", d => d.y),
                update => update
                    .attr("cx", xPos)
                    .attr("cy", d => d.y)
                    .attr("stroke", d => color(d.key)),
                exit => exit.remove()
            );
        }
    });

})();


// ========================================================
// 🎬 Page 1 – Intro Animation (Floating Data Particles)
// ========================================================
(function() {
    const container = d3.select("#p1-vis");
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Create SVG
    const svg = container.append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .style("pointer-events", "none"); // Let clicks pass through to text

    // Configuration
    const particleCount = 40;
    // Colors: Critics (Orange/Red), Audience (Gold/Bronze), Neutral (Brown)
    const colors = ["#D2691E", "#C09858", "#8B4513", "#A0522D"]; 

    // Generate Random Particles
    const particles = d3.range(particleCount).map(() => ({
        x: Math.random() * width,
        y: height + Math.random() * 200, // Start below screen
        r: Math.random() * 6 + 2,        // Random size
        speed: Math.random() * 0.8 + 0.2, // Random speed
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.4 + 0.1
    }));

    // Draw Circles
    const circles = svg.selectAll("circle")
        .data(particles)
        .enter()
        .append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => d.r)
        .attr("fill", d => d.color)
        .attr("opacity", d => d.opacity);

    // Animation Loop
    function animate() {
        particles.forEach(p => {
            p.y -= p.speed; // Move up
            
            // Reset if it goes off top
            if (p.y < -20) {
                p.y = height + 20;
                p.x = Math.random() * width;
            }
        });

        circles
            .attr("cy", d => d.y)
            .attr("cx", d => d.x); // Simple update

        requestAnimationFrame(animate);
    }

    // Start Animation
    animate();

    // Interactive Parallax (Optional: Mouse moves dots slightly)
    document.addEventListener("mousemove", (e) => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        circles.attr("transform", d => {
            const dx = (d.x - mouseX) * 0.02;
            const dy = (d.y - mouseY) * 0.02;
            return `translate(${dx}, ${dy})`;
        });
    });

})();