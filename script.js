// script.js
// Vintage Cinema Theme - Color palette updated for fall/café aesthetic
// D3.js v7

// Vintage color palette
const vintageColors = {
  critic: '#8B4513', // Saddle brown
  audience: '#D2691E', // Chocolate
  overlap: '#6F4E37', // Coffee brown
  positive: '#D4AF37', // Gold
  negative: '#B7410E', // Rust
  neutral: '#C19A6B', // Camel
  accent: '#CD853F' // Peru
};

//--------------------------------------------------
// ✅ Page Loading Logic (First time → Page1; Refresh → restore progress)
//--------------------------------------------------
window.addEventListener("load", () => {
  // 如果是新会话（第一次打开标签页） → 清除旧记录
  if (!sessionStorage.getItem("visited")) {
    localStorage.removeItem("lastPage");
    sessionStorage.setItem("visited", "true");
  }

  // 读取上次浏览的页码
  const lastPage = parseInt(localStorage.getItem("lastPage")) || 1;

  // 隐藏所有页面
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));

  // ✅ 显示从第 1 页到上次浏览页的所有内容
  for (let i = 1; i <= lastPage; i++) {
    const section = document.getElementById(`page${i}`);
    if (section) {
      section.classList.remove("hidden");
      // 把前一页的 “Load More” 按钮隐藏
      const btn = section.querySelector(".load-more");
      if (btn && i < lastPage) btn.style.display = "none";
    }
  }

  // 滚动到最后一页
  document.getElementById(`page${lastPage}`)?.scrollIntoView({ behavior: "instant" });
});


//--------------------------------------------------
// ✅ 更新 Page 并保存进 localStorage
//--------------------------------------------------
function showNextPage(next, btn) {
  const nextPage = document.getElementById(`page${next}`);
  if (nextPage) {
    nextPage.classList.remove("hidden");
    nextPage.scrollIntoView({ behavior: "smooth" });
    localStorage.setItem("lastPage", next); // 保存进度
  }
  if (btn) btn.style.display = "none";
}



//--------------------------------------------------
// Shared tooltip
//--------------------------------------------------
const tooltip = d3.select("#tooltip");

function showNextPage(next, btn) {
  const nextPage = document.getElementById(`page${next}`);
  if (nextPage) {
    nextPage.classList.remove("hidden");
    nextPage.scrollIntoView({ behavior: "smooth" });
    localStorage.setItem("lastPage", next);
  }
  if (btn) btn.style.display = "none";
}

//--------------------------------------------------
// 🎮 Horizontal Guessing Game Carousel (Fixed Version)
//--------------------------------------------------

const movieRounds = [
  { title: "Barbie", poster: "image/Barbie.png", mode: "critic" },
  { title: "Top Gun: Maverick", poster: "image/Top Gun.png", mode: "audience" },
  { title: "Captain America: The First Avenger", poster: "image/Captain America.png", mode: "critic" },
  { title: "The Greatest Showman", poster: "image/The Greatest Showman.png", mode: "audience" },
  { title: "Star Wars: The Last Jedi", poster: "image/Star Wars.png", mode: "critic" }
];

const carouselContainer = document.getElementById("guessing-carousel");

carouselContainer.innerHTML = `
  <div class="carousel-content">
    <div class="movie-card" id="active-card">
      <div class="card-loading">Loading...</div>
    </div>
  </div>
  <div class="carousel-dots"></div>
  <button class="carousel-btn left" id="carousel-prev" style="display:none;">❮</button>
  <button class="carousel-btn right" id="carousel-next" style="display:none;">❯</button>
`;

const cardContainer = carouselContainer.querySelector("#active-card");
const dotsContainer = carouselContainer.querySelector(".carousel-dots");
const prevBtn = carouselContainer.querySelector("#carousel-prev");
const nextBtn = carouselContainer.querySelector("#carousel-next");
const loadMoreBtn = document.getElementById("carousel-next-btn");

let currentIndex = 0;
let revealedCards = [false, false, false, false, false];

let cardData = [];

function isTransitionIndex(ci) { return ci === 3; }
function isMovieCarouselIndex(ci) { return ci !== 3; }
function carouselIndexToMovieIndex(ci) {
  if (ci <= 2) return ci;
  if (ci >= 4) return ci - 1;
  return null;
}
function movieIndexToCarouselIndex(mi) {
  if (mi <= 2) return mi;
  return mi + 1;
}

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

  // Insert transition screen
  cardData.splice(3, 0, { transition: true });

  renderCard(0);
  updateNavigation();

  // Dot click
  Array.from(dotsContainer.children).forEach(dot => {
    dot.addEventListener("click", () => {
      const mi = parseInt(dot.dataset.index);
      const targetCi = movieIndexToCarouselIndex(mi);
      if (targetCi <= currentIndex) {
        currentIndex = targetCi;
        renderCard(currentIndex);
        updateNavigation();
      }
    });
  });

  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderCard(currentIndex);
      updateNavigation();
    }
  });

  nextBtn.addEventListener("click", () => {
    const lastIndex = cardData.length - 1;
    if (currentIndex < lastIndex) {
      if (isTransitionIndex(currentIndex)) {
        currentIndex++;
        renderCard(currentIndex);
        updateNavigation();
      } else {
        const mi = carouselIndexToMovieIndex(currentIndex);
        if (mi !== null && revealedCards[mi]) {
          currentIndex++;
          renderCard(currentIndex);
          updateNavigation();
        }
      }
    }
  });
});

function renderCard(index) {
  const card = cardData[index];

  if (isTransitionIndex(index)) {
    cardContainer.innerHTML = `
      <div class="transition-message">
        <p style="font-size:18px;line-height:1.6;color:var(--vintage-dark)">
          It seems that critics and audiences often agree!
        </p >
        <p style="font-size:16px;color:var(--vintage-coffee);margin-top:30px;font-style:italic;">
          Or do they?
        </p >
      </div>
    `;
    return;
  }

  const mi = carouselIndexToMovieIndex(index);

  cardContainer.innerHTML = `
    <h2>${card.title}</h2>
    <img src="${card.poster}" alt="${card.title} Poster">

    <p><strong>${card.shownLabel} Score:</strong> ${(card.shownScore * 100).toFixed(0)}%</p >

    <p style="margin-top:15px;font-family:Playfair Display, serif;font-weight:600;color:var(--vintage-brown)">
      Guess the ${card.guessedLabel}' Score:
    </p >

    <input type="range" min="0" max="100" value="50" class="score-slider" id="slider-${mi}">
    <div class="slider-value" id="value-${mi}">Your guess: 50%</div>

    <button class="reveal-btn" id="reveal-${mi}">Reveal Score</button>
    <div class="guess-result" id="result-${mi}"></div>
  `;

  const slider = document.getElementById(`slider-${mi}`);
  const sliderValue = document.getElementById(`value-${mi}`);
  const revealBtn = document.getElementById(`reveal-${mi}`);
  const result = document.getElementById(`result-${mi}`);

  slider.addEventListener("input", () => {
    sliderValue.textContent = `Your guess: ${slider.value}%`;
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
      feedback = "🎯 Correct!";
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

    result.innerHTML = `
      <strong>${card.guessedLabel}' Score:</strong> ${actual}%<br>
      <span style="font-weight:600;color:${color};margin-top:8px;display:inline-block;">${feedback}</span>
    `;

    revealedCards[mi] = true;
    slider.disabled = true;
    revealBtn.style.display = "none";

    // ⭐ FIXED — clean old state, apply new one
    const dot = dotsContainer.children[mi];
    dot.classList.remove("correct", "incorrect", "active");
    dot.classList.add(dotClass);

    updateNavigation();
  });
}

function updateNavigation() {
  let highlightedMovieIndex;

  if (isTransitionIndex(currentIndex)) {
    highlightedMovieIndex = 2;
  } else {
    highlightedMovieIndex = carouselIndexToMovieIndex(currentIndex);
  }

  Array.from(dotsContainer.children).forEach((dot, i) => {
    dot.classList.remove("active");

    const isCorrect = dot.classList.contains("correct");
    const isIncorrect = dot.classList.contains("incorrect");

    // highlight only if not answered yet
    if (i === highlightedMovieIndex && !isCorrect && !isIncorrect) {
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
  } else {
    const mi = carouselIndexToMovieIndex(currentIndex);
    nextBtn.style.display = (mi !== null && revealedCards[mi]) ? "block" : "none";
  }

  const allRevealed = revealedCards.every(Boolean);
  if (allRevealed) loadMoreBtn.classList.remove("hidden");
  else loadMoreBtn.classList.add("hidden");
}


//--------------------------------------------------
// Q1: Genre Differences Bar Chart
//--------------------------------------------------
const margin1 = { top: 30, right: 20, bottom: 50, left: 70 },
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
const marginScatter = { top: 50, right: 30, bottom: 50, left: 60 },
  widthScatter = 420 - marginScatter.left - marginScatter.right,
  heightScatter = 350 - marginScatter.top - marginScatter.bottom;

const svgScatter = d3.select("#chart-scatter-multi")
  .append("svg")
  .attr("width", widthScatter + marginScatter.left + marginScatter.right)
  .attr("height", heightScatter + marginScatter.top + marginScatter.bottom)
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
    .text("Critics Score - Audience Score ( → Critics Like More )");

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
    .attr("fill", "none")
    .attr("stroke", vintageColors.critic)
    .attr("stroke-width", 3)
    .attr("d", lineCritic);

  svg2.append("path")
    .datum(yearly)
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
    .attr("fill", "#8B4513")
    .text("Average Ratings Over Time");

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
      vennContainer.selectAll("svg").remove();

      // overall svg size
      const W = window.innerWidth * 0.82;
      const H = window.innerHeight * 0.82;

      const margin = {
        top: 0.05 * H,
        right: 0.1 * W,
        bottom: 0.05 * H,
        left: 0.1 * W
      };

      const innerW = W - margin.left - margin.right;
      const innerH = H - margin.top - margin.bottom;

      const svg = vennContainer.append("svg")
        .attr("width", W)
        .attr("height", H)
        .attr("viewBox", `0 0 ${W} ${H}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

      const centerY = margin.top + innerH / 2;

      // font scaling (keep original range on normal windows, shrink on small)
      let baseMaxFont = Math.max(18, Math.min(26, W / 65));
      let baseMinFont = Math.max(8, Math.min(13, W / 180));
      if (W < 900) {
        const scale = W / 900; // < 1 on small screens
        baseMaxFont = Math.max(10, baseMaxFont * scale);
        baseMinFont = Math.max(6, baseMinFont * scale);
      }
      const maxFont = baseMaxFont;
      const minFont = baseMinFont;

      //--------------------------------------------------
      // CONSISTENT RADIUS: LIMITED BY BOTH HEIGHT & WIDTH
      //--------------------------------------------------
      const maxRadiusByHeight = (innerH - 40) / 2;
      const maxRadiusByWidth = innerW * 0.3;  // since centers at 0.3 / 0.7 innerW

      const unifiedR = Math.max(10, Math.min(maxRadiusByHeight, maxRadiusByWidth));

      //--------------------------------------------------
      // Circle centers – use innerW, then shift by margin
      //--------------------------------------------------
      const centers = {
        critic: { x: margin.left + innerW * 0.30, y: centerY },
        audience: { x: margin.left + innerW * 0.70, y: centerY },
        overlap: { x: margin.left + innerW * 0.50, y: centerY }
      };

      //--------------------------------------------------
      // Region logic
      //--------------------------------------------------
      const padFracCritic = 0.30;
      const padFracAudience = 0.35;

      function dist(pt, c) {
        const dx = pt.x - c.x, dy = pt.y - c.y;
        return Math.sqrt(dx * dx + dy * dy);
      }

      function inRegion(pt, regionKey) {
        const dCritic = dist(pt, centers.critic);
        const dAudience = dist(pt, centers.audience);
        if (regionKey === "critic") return dCritic <= unifiedR && dAudience >= unifiedR * (1 + padFracCritic);
        if (regionKey === "audience") return dAudience <= unifiedR && dCritic >= unifiedR * (1 + padFracAudience);
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
        .style("padding", "6px 10px")
        .style("background", "rgba(0,0,0,0.7)")
        .style("color", "white")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("z-index", "10")
        .style("transition", "opacity 0.2s");

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

        // overlap: stacked vertically in center
        if (regionKey === "overlap") {
          const lineHeight = 1.3 * ((maxFont + minFont) / 2);
          const totalHeight = lineHeight * movies.length;
          const startY = centerY - totalHeight / 2 + lineHeight / 2;

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
            .text(d => d.title)
            .on("mouseover", (e, d) => {
              tooltip
                .style("visibility", "visible")
                .style("opacity", "1")
                .html(`<strong>${d.title}</strong><br>${regionKey}`);
            })
            .on("mousemove", e => {
              tooltip
                .style("top", (e.pageY - 35) + "px")
                .style("left", (e.pageX + 10) + "px");
            })
            .on("mouseout", () => {
              tooltip
                .style("visibility", "hidden")
                .style("opacity", "0");
            });
          return;
        }

        // critic-only / audience-only: spiral placement inside region
        const placed = [];
        const step = 3;
        const candidates = [];

        for (let angle = 0; angle < 2 * Math.PI; angle += 0.05) {
          for (let r = 0; r < unifiedR * 0.95; r += step) {
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
          const textBox = { w: movie.title.length * font * 0.55, h: font };
          let found = false;

          for (let pt of candidates) {
            // clamp candidate so text box stays inside svg bounds
            const candidate = {
              x: Math.max(textBox.w / 2, Math.min(W - textBox.w / 2, pt.x)),
              y: Math.max(textBox.h / 2, Math.min(H - textBox.h / 2, pt.y))
            };

            let valid = true;
            for (let p of placed) {
              const dx = p.x - candidate.x, dy = p.y - candidate.y;
              if (Math.abs(dx) < (p.w + textBox.w) / 2 &&
                Math.abs(dy) < (p.h + textBox.h) / 2) {
                valid = false; break;
              }
            }
            if (valid) {
              placed.push({ ...candidate, ...textBox, font, text: movie.title });
              found = true;
              break;
            }
          }

          if (!found) {
            let tries = 0, pt;
            do {
              pt = {
                x: centers[regionKey].x + (Math.random() - 0.5) * unifiedR * 2,
                y: centers[regionKey].y + (Math.random() - 0.5) * unifiedR * 2
              };
              tries++;
            } while (!inRegion(pt, regionKey) && tries < 50);

            const candidate = {
              x: Math.max(textBox.w / 2, Math.min(W - textBox.w / 2, pt.x)),
              y: Math.max(textBox.h / 2, Math.min(H - textBox.h / 2, pt.y))
            };
            placed.push({ ...candidate, ...textBox, font, text: movie.title });
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
          .text(d => d.text)
          .on("mouseover", (e, d) => {
            tooltip
              .style("visibility", "visible")
              .style("opacity", "1")
              .html(`<strong>${d.text}</strong><br>${regionKey}`);
          })
          .on("mousemove", e => {
            tooltip
              .style("top", (e.pageY - 35) + "px")
              .style("left", (e.pageX + 10) + "px");
          })
          .on("mouseout", () => {
            tooltip
              .style("visibility", "hidden")
              .style("opacity", "0");
          });
      }

      //--------------------------------------------------
      // Run layouts
      //--------------------------------------------------
      layoutWords(criticOnly, "critic", vintageColors.critic);
      layoutWords(audienceOnly, "audience", vintageColors.audience);
      layoutWords(overlap, "overlap", vintageColors.overlap);

      //--------------------------------------------------
      // Draw circles
      //--------------------------------------------------
      svg.append("circle")
        .attr("cx", centers.critic.x)
        .attr("cy", centers.critic.y)
        .attr("r", unifiedR)
        .attr("fill", vintageColors.critic)
        .attr("fill-opacity", 0.25)
        .style("mix-blend-mode", "multiply");

      svg.append("circle")
        .attr("cx", centers.audience.x)
        .attr("cy", centers.audience.y)
        .attr("r", unifiedR)
        .attr("fill", vintageColors.audience)
        .attr("fill-opacity", 0.25)
        .style("mix-blend-mode", "multiply");
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
      const y = d3.scaleLinear().domain([0, 1]).range([H - mg.bottom, mg.top]);

      const barsG = svg.append("g").attr("class", "bars");
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
        vals = vals.filter(v => !isNaN(v)).map(v => +v);
        if (vals.length === 0) {
          barsG.selectAll("rect").remove();
          y.domain([0, 1]);
          return;
        }
        const binGen = d3.bin().domain(x.domain()).thresholds(25).value(d => Math.max(0, Math.min(1, d)));
        const bins = binGen(vals);

        y.domain([0, d3.max(bins, b => b.length)]);
        const rects = barsG.selectAll("rect").data(bins);
        rects.exit().remove();
        rects.enter().append("rect")
          .attr("x", d => x(d.x0))
          .attr("y", d => y(d.length))
          .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
          .attr("height", d => y(0) - y(d.length))
          .attr("fill", vintageColors.positive)
          .merge(rects)
          .transition().duration(250)
          .attr("x", d => x(d.x0))
          .attr("y", d => y(d.length))
          .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
          .attr("height", d => y(0) - y(d.length));
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

    const tW = 1000, tH = 420, tMg = { left: 60, right: 40, top: 20, bottom: 50 };
    const tSvg = d3.select("#timeline");
    tSvg.selectAll("*").remove();

    const years = data.map(d => d.release_year);
    const x = d3.scaleLinear().domain([d3.min(years) - 1, d3.max(years) + 1]).range([tMg.left, tW - tMg.right]);

    const first5 = Math.floor(d3.min(years) / 5) * 5;
    const last5 = Math.ceil(d3.max(years) / 5) * 5;
    const bands = d3.range(first5, last5 + 1, 5);
    tSvg.append("g").selectAll("rect.band")
      .data(bands)
      .join("rect")
      .attr("x", d => x(d - 2.5))
      .attr("y", 0)
      .attr("width", d => Math.max(1, x(d + 2.5) - x(d - 2.5)))
      .attr("height", tH)
      .attr("fill", "#EBD9C5");

    tSvg.append("g")
      .attr("transform", "translate(0," + (tH - tMg.bottom) + ")")
      .call(d3.axisBottom(x).ticks(10).tickFormat(d3.format("d")))
      .selectAll("text")
      .style("fill", "#6F4E37")
      .style("font-family", "Crimson Text, serif");

    const bubbleG = tSvg.append("g").attr("class", "bubbles");
    const rScale = d3.scaleLinear().domain([0, 1]).range([6, 10]);

    function updateAll() {
      const selGenre = d3.select("#genre").property("value");

      let pool = data.filter(d => d.votes >= voteRange[0] && d.votes <= voteRange[1]);

      if (selGenre !== "All") pool = pool.filter(d => d.genre && d.genre.includes(selGenre));

      if (critBrushRange) pool = pool.filter(d => d.critic_score >= critBrushRange[0] && d.critic_score <= critBrushRange[1]);
      if (audBrushRange) pool = pool.filter(d => d.audience_score >= audBrushRange[0] && d.audience_score <= audBrushRange[1]);

      d3.select("#counts").text(pool.length);

      pool.forEach(d => d.avg = (d.critic_score + d.audience_score) / 2);

      const shown = pool.slice().sort((a, b) => b.votes - a.votes).slice(0, 1000);

      const nodes = bubbleG.selectAll("g.movie").data(shown, d => d.movie_id);
      nodes.exit().transition().duration(150).style("opacity", 0).remove();

      const enter = nodes.enter().append("g").attr("class", "movie")
        .attr("transform", d => "translate(" + x(d.release_year) + "," + (tMg.top + Math.random() * (tH - tMg.top - tMg.bottom)) + ")")
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
      all.transition().duration(350).attr("transform", d => "translate(" + x(d.release_year) + "," + (tMg.top + Math.random() * (tH - tMg.top - tMg.bottom)) + ")").style("opacity", 1);
      all.select("circle").transition().duration(350).attr("r", d => rScale(d.avg));

      all.on("mouseover", (event, d) => {
        tooltip.style("opacity", 1).style("visibility", "visible").style("left", (event.pageX + 10) + "px").style("top", (event.pageY + 8) + "px")
          .html("<b>" + (d.movie_name || "") + "</b><br/>Year: " + d.release_year + "<br/>Critic: " + (isFinite(d.critic_score) ? d.critic_score.toFixed(2) : '-') + " Audience: " + (isFinite(d.audience_score) ? d.audience_score.toFixed(2) : '-') + "<br/>Votes: " + fmt(d.votes));
        const html = "<div style=\"font-weight:700; color:#8B4513; font-family: Playfair Display, serif;\">" + (d.movie_name || "") + "</div>" +
          "<div style=\"font-size:13px;color:#4A2C2A;margin-top:8px\"> <b>Year:</b> " + d.release_year + " &nbsp; <b>Votes:</b> " + fmt(d.votes) +
          "<br/> <b>Critic:</b> " + d.critic_score + " &nbsp; <b>Audience:</b> " + d.audience_score + " &nbsp; <b>Avg:</b> " + (d.avg ? d.avg.toFixed(3) : '-') +
          "<br/> <b>Genre:</b> " + (d.genre || "-") + "<br/> <b>Director:</b> " + (d.director || "-") + " &nbsp; <b>Runtime:</b> " + (d.runtime || "-") +
          "<br/> <b>Certificate:</b> " + (d.certificate || "-") + " &nbsp; <b>Rating:</b> " + (d.rating || "-") +
          "<br/> <b>Gross:</b> " + (d.gross || "-") +
          "<br/><div style=\"margin-top:8px;color:#4A2C2A\"><b>Description:</b><div style=\"margin-top:6px;color:#6F4E37\">" + ((d.description || "").slice(0, 800)) + "</div></div></div>";
        d3.select("#detailContent").html(html);
      }).on("mousemove", (event) => {
        tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY + 8) + "px");
      }).on("mouseout", () => {
        tooltip.style("opacity", 0).style("visibility", "hidden");
      });

      renderTopTable(pool);

      d3.select("#voteSummary").text(voteRange[0] === d3.min(data, d => d.votes) && voteRange[1] === d3.max(data, d => d.votes) ? "All" : (fmt(voteRange[0]) + " — " + fmt(voteRange[1])));
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
