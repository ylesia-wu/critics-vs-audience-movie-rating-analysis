// script.js
// Combined visualizations for Q1 + Q2 + Q5
// D3.js v7

//--------------------------------------------------
// Shared tooltip
//--------------------------------------------------
const tooltip = d3.select("#tooltip");

function showNextPage(next, btn) {
  const current = btn.closest(".page");
  if (current) current.classList.add("hidden");
  const nextPage = document.getElementById(`page${next}`);
  if (nextPage) nextPage.classList.remove("hidden");
  nextPage?.scrollIntoView({ behavior: "smooth" });
}


//--------------------------------------------------
// Guessing Game Sequence (stacked with "Next Round" button)
//--------------------------------------------------
const movieRounds = [
  {
    title: "Barbie",
    poster: "https://upload.wikimedia.org/wikipedia/en/0/0b/Barbie_2023_poster.jpg",
    mode: "critic"
  },
  {
    title: "Top Gun: Maverick",
    poster: "https://upload.wikimedia.org/wikipedia/en/1/13/Top_Gun_Maverick_Poster.jpg",
    mode: "audience"
  },
  {
    title: "Captain America: The First Avenger",
    poster: "https://m.media-amazon.com/images/I/51Xp%2B8qDCbL._AC_UF894_,1000_QL80_.jpg",
    mode: "critic"
  },
  {
    title: "The Greatest Showman",
    poster: "https://upload.wikimedia.org/wikipedia/en/1/10/The_Greatest_Showman_poster.png",
    mode: "audience"
  },
  {
    title: "Star Wars: The Last Jedi",
    poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Ep8_teaser_1-sht_v2_sm.jpg/400px-Ep8_teaser_1-sht_v2_sm.jpg",
    mode: "critic"
  }
];
//--------------------------------------------------
// Render one round (hidden until activated) ✅ 修正版
//--------------------------------------------------
function renderGuessingRound(movie, posterURL, mode, index) {
  const mainContainer = d3.select("#guessing-game");

  // 每轮的外框
  const container = mainContainer.append("div")
    .attr("class", "game-instance hidden")
    .style("margin", "40px auto")
    .style("padding", "25px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "12px")
    .style("width", "70%")
    .style("background-color", "#fff")
    .style("box-shadow", "0 2px 6px rgba(0,0,0,0.08)")
    .style("text-align", "center")
    .style("font-family", "Inter, sans-serif");

  // 加载数据
  d3.csv("data/rotten_tomatoes.csv").then(data => {
    const match = data.find(d =>
      d.title && d.title.trim().toLowerCase() === movie.toLowerCase()
    );
    if (!match) {
      container.html(`<p>Movie '${movie}' not found in dataset.</p>`);
      return;
    }

    const critic = +match.critic_score;
    const audience = +match.audience_score;

    const shownLabel = mode === "critic" ? "Audience" : "Critics";
    const guessedLabel = mode === "critic" ? "Critics" : "Audience";
    const shownScore = mode === "critic" ? audience : critic;
    const actualScore = mode === "critic" ? critic : audience;

    // 主体内容
    container.html(`
      <h3 style="font-size:22px; margin-bottom:10px;">${movie}</h3>
      <img src="${posterURL}" alt="${movie} Poster" style="width:250px; border-radius:10px; margin:15px 0;">
      <div style="font-size:16px; margin-bottom:10px;">
        <strong>${shownLabel} Score:</strong> ${(shownScore * 100).toFixed(0)}%
      </div>

      <div class="slider-container" style="margin:20px 0;">
        <label><strong>Guess the ${guessedLabel}' Score:</strong></label><br>
        <input type="range" class="score-slider" min="0" max="100" value="50" step="1" 
               style="width:60%; margin-top:8px;">
        <div class="slider-value" style="margin-top:6px; color:#333;">Your guess: 50%</div>
      </div>

      <button class="load-more reveal-btn" 
              style="margin-top:10px; background:#007BFF; color:white; border:none; border-radius:6px; padding:8px 14px; cursor:pointer;">
              Reveal Score
      </button>
      <div class="guess-result" style="margin-top:15px; font-size:16px;"></div>
    `);

    // 第一轮显示
    if (index === 0) container.classed("hidden", false);

    const slider = container.select(".score-slider");
    const sliderValue = container.select(".slider-value");
    const result = container.select(".guess-result");
    const revealBtn = container.select(".reveal-btn");

    // 滑块更新显示
    slider.on("input", function () {
      sliderValue.text(`Your guess: ${this.value}%`);
    });

   // Reveal 按钮逻辑
revealBtn.on("click", function () {
  const guessValue = Math.round(Number(slider.node().value));
  const actualValue = Math.round(Number(actualScore * 100));
  const diff = Math.abs(guessValue - actualValue);
  let feedback, color;

  if (diff <= 1) {
    feedback = "🎯 Correct!";
    color = "#27ae60";
  } else if (diff <= 5) {
    feedback = "👍 Very close!";
    color = "#f1c40f";
  } else if (guessValue < actualValue) {
    feedback = "Too low!";
    color = "#e74c3c";
  } else {
    feedback = "Too high!";
    color = "#e74c3c";
  }

  result.html(`
    <strong>${guessedLabel}' Score:</strong> ${actualValue}%<br>
    <span style="font-weight:600; color:${color};">${feedback}</span>
  `);

  result.transition()
    .duration(200)
    .style("background", color === "#27ae60" ? "#d4edda" : "transparent")
    .transition()
    .delay(600)
    .duration(500)
    .style("background", "transparent");

  // ✅ Special logic starting here
  // index 0–2 normal; after round 3 show transition text first
  if (index === 2) {
    revealBtn.text("Next Round ↓")
      .style("background", "#6c757d")
      .on("click", () => {
        revealBtn.remove();

        // Insert transition text block
        const transitionBlock = container.append("div")
          .style("margin-top", "25px")
          .style("font-size", "18px")
          .style("color", "#333")
          .style("line-height", "1.6")
          .style("padding", "10px 20px")
          .style("background", "#f8f9fa")
          .style("border-radius", "8px")
          .style("box-shadow", "0 2px 5px rgba(0,0,0,0.08)")
          .html(`
            <p>See? It’s not all conflict.</p>
            <p>For most movies, critics and audiences agree more than we think.</p>
            <p>There are more games you can try!</p>
          `);

        // After 2 seconds, show Round 4
        setTimeout(() => {
          const next = d3.selectAll(".game-instance").filter((d, i) => i === index + 1);
          if (!next.empty()) next.classed("hidden", false);
        }, 2000);
      });

  } else if (d3.selectAll(".game-instance").size() > index + 1) {
    // normal logic for other rounds
    revealBtn.text("Next Round ↓")
      .style("background", "#6c757d")
      .on("click", () => {
        const next = d3.selectAll(".game-instance").filter((d, i) => i === index + 1);
        if (!next.empty()) next.classed("hidden", false);
        revealBtn.remove();
      });

  } else {
    revealBtn.remove();
  }
});

  });
}


//--------------------------------------------------
// Initialize all rounds (only first shown at start)
//--------------------------------------------------
movieRounds.forEach((m, i) => renderGuessingRound(m.title, m.poster, m.mode, i));



//--------------------------------------------------
// Q1: Average Critic - Audience Score Difference by Genre (✨ styled version)
//--------------------------------------------------
const margin1 = { top: 30, right: 20, bottom: 50, left: 70 },
  width1 = 420 - margin1.left - margin1.right,   // ✅ 与 SVG width 对齐
  height1 = 350 - margin1.top - margin1.bottom;


const svg1 = d3.select("#chart-q1")
  .append("svg")
  .attr("width", 420)
  .attr("height", 350)
  .append("g")
  .attr("transform", `translate(${margin1.left},${margin1.top})`);


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
    .attr("fill", d => d.diff > 0 ? "#5DADE2" : "#E74C3C")
    .attr("rx", 3)
    .transition()
    .duration(800)
    .delay((d, i) => i * 30)
    .attr("width", d => Math.abs(x(d.diff) - x(0)));

  // 添加交互
  svg1.selectAll(".bar")
    .on("mouseover", (event, d) => {
      d3.select(event.currentTarget)
        .transition()
        .duration(200)
        .attr("opacity", 0.7);
      tooltip.style("visibility", "visible")
        .style("transform", "scale(0.9)") // 👈 缩小一点
        .style("left", (event.pageX + 40) + "px") // 👈 向右偏移一点
        .style("top", (event.pageY - 40) + "px")  // 👈 稍微往上提
        .html(`
    <div style="
      background:white;
      border-radius:10px;
      box-shadow:0 2px 6px rgba(0,0,0,0.15);
      padding:8px 12px;
      font-size:13px;
      font-family:'Inter',sans-serif;
      line-height:1.4;
      transform:scale(0.9);
      ">
      <div style="font-weight:600; font-size:14px; margin-bottom:4px;">🎬 ${d.genre}</div>
      <div>⭐ Critics Avg: ${(d.critic_avg * 100).toFixed(1)}%</div>
      <div>👥 Audience Avg: ${(d.audience_avg * 100).toFixed(1)}%</div>
      <div style="margin-top:4px; color:${d.diff > 0 ? '#1f77b4' : '#c0392b'}; font-weight:600;">
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
      tooltip.style("visibility", "hidden");
    })
    .on("click", (event, d) => {
      // 取消所有选中状态
      svg1.selectAll(".bar")
        .classed("selected", false)
        .attr("stroke", null)
        .attr("stroke-width", null);

      // 设置当前 bar 为选中
      d3.select(event.currentTarget)
        .classed("selected", true)
        .attr("stroke", "#000")
        .attr("stroke-width", 2);

      // ✅ 更新右侧散点图
      updateScatterByGenre(d.genre);
    });




  svg1.append("g")
    .attr("transform", `translate(0,${height1})`)
    .call(
      d3.axisBottom(x)
        .tickFormat(d => `${(d * 100).toFixed(0)}%`) // 转为百分比
    );


  svg1.append("g").call(d3.axisLeft(y));

  svg1.append("line")
    .attr("x1", x(0))
    .attr("x2", x(0))
    .attr("y1", 0)
    .attr("y2", height1)
    .attr("stroke", "#333")
    .attr("stroke-dasharray", "3,3");
});


//--------------------------------------------------
// 🎯 Scatterplot: Explore Individual Movies (Filtered by Genre)
//--------------------------------------------------

// 设置边距与画布尺寸
const marginScatter = { top: 50, right: 30, bottom: 50, left: 60 },
  widthScatter = 420 - marginScatter.left - marginScatter.right,  // ✅ 缩小宽度
  heightScatter = 350 - marginScatter.top - marginScatter.bottom; // ✅ 缩小高度


// 创建 scatter plot 的 SVG
const svgScatter = d3.select("#chart-scatter-multi")
  .append("svg")
  .attr("width", widthScatter + marginScatter.left + marginScatter.right)
  .attr("height", heightScatter + marginScatter.top + marginScatter.bottom)
  .append("g")
  .attr("transform", `translate(${marginScatter.left},${marginScatter.top})`);

// 定义全局数据变量
let allData = [];

// 加载 CSV 数据
d3.csv("data/imdb_tomatoes_oscar_genre_expanded.csv").then(data => {
  data.forEach(d => {
    d.critic_score = +d.critic_score;
    d.audience_score = +d.audience_score;
    d.score_diff = d.critic_score - d.audience_score;
    d.genre = d.genre.trim();
  });

  allData = data;

  // 初始化图表显示
  updateScatterByGenre("All Genres");
});


//--------------------------------------------------
// ✨ updateScatterByGenre 函数
//--------------------------------------------------
function updateScatterByGenre(selectedGenre) {
  // 清空原图
  svgScatter.selectAll("*").remove();

  // 筛选数据
  let filtered = allData;
  if (selectedGenre !== "All Genres") {
    filtered = allData.filter(d => d.genre && d.genre.includes(selectedGenre));
  }

  // 定义比例尺
  const x = d3.scaleLinear().domain([0, 1]).range([0, widthScatter]);
  const y = d3.scaleLinear().domain([0, 1]).range([heightScatter, 0]);

  // 坐标轴
  svgScatter.append("g")
    .attr("transform", `translate(0,${heightScatter})`)
    .call(d3.axisBottom(x).tickFormat(d3.format(".1f")));
  svgScatter.append("g")
    .call(d3.axisLeft(y).tickFormat(d3.format(".1f")));

  // 对角线（y = x）
  svgScatter.append("line")
    .attr("x1", 0)
    .attr("y1", heightScatter)
    .attr("x2", widthScatter)
    .attr("y2", 0)
    .attr("stroke", "#aaa")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "4,4");

  // 散点
  svgScatter.selectAll("circle")
    .data(filtered)
    .join("circle")
    .attr("cx", d => x(d.critic_score))
    .attr("cy", d => y(d.audience_score))
    .attr("r", 0)
    .attr("fill", "#5DADE2")
    .attr("opacity", 0.65)
    .transition()
    .duration(600)
    .attr("r", 4);

  // Tooltip
  svgScatter.selectAll("circle")
    .on("mouseover", (e, d) => {
      tooltip.style("visibility", "visible")
        .html(`
                    <strong>${d.title}</strong><br>
                    🎬 ${d.genre}<br>
                    ⭐ Critic: ${(d.critic_score * 100).toFixed(1)}%<br>
                    👥 Audience: ${(d.audience_score * 100).toFixed(1)}%
                `);
    })
    .on("mousemove", e => {
      tooltip.style("top", (e.pageY - 35) + "px")
        .style("left", (e.pageX + 10) + "px");
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden"));

  // 标题与轴标签
  svgScatter.append("text")
    .attr("x", widthScatter / 2)
    .attr("y", -25)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("font-size", "18px")
    .text(selectedGenre === "All Genres" ? "All Genres" : `Genre: ${selectedGenre}`);

  svgScatter.append("text")
    .attr("x", widthScatter / 2)
    .attr("y", heightScatter + 45)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .text("Critic Score");

  svgScatter.append("text")
    .attr("x", -heightScatter / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("transform", "rotate(-90)")
    .text("Audience Score");
}

//--------------------------------------------------
// Q2: Average Ratings Over Time (Critics vs Audience)
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
    .attr("stroke", "#1f77b4")
    .attr("stroke-width", 2)
    .attr("d", lineCritic);

  svg2.append("path")
    .datum(yearly)
    .attr("fill", "none")
    .attr("stroke", "#d62728")
    .attr("stroke-width", 2)
    .attr("d", lineAudience);



  //--------------------------------------------------
  // ✨ 双线智能 Hover Tooltip：鼠标靠近哪条线显示哪条线
  //--------------------------------------------------

  // --- 蓝线 (Critics) ---
  const focusCritic = svg2.append("g").style("display", "none");
  focusCritic.append("circle")
    .attr("r", 5)
    .attr("fill", "#1f77b4");

  const tooltipCritic = svg2.append("foreignObject")
    .attr("width", 130)
    .attr("height", 50)
    .style("display", "none");

  tooltipCritic.append("xhtml:div")
    .attr("id", "tooltip-critic")
    .style("background", "rgba(255,255,255,0.9)")
    .style("border-radius", "6px")
    .style("padding", "6px 8px")
    .style("box-shadow", "0 2px 6px rgba(0,0,0,0.15)")
    .style("font-size", "12px")
    .style("font-family", "Inter, sans-serif")
    .style("color", "#1f77b4");

  // --- 红线 (Audience) ---
  const focusAudience = svg2.append("g").style("display", "none");
  focusAudience.append("circle")
    .attr("r", 5)
    .attr("fill", "#d62728");

  const tooltipAudience = svg2.append("foreignObject")
    .attr("width", 130)
    .attr("height", 50)
    .style("display", "none");

  tooltipAudience.append("xhtml:div")
    .attr("id", "tooltip-audience")
    .style("background", "rgba(255,255,255,0.9)")
    .style("border-radius", "6px")
    .style("padding", "6px 8px")
    .style("box-shadow", "0 2px 6px rgba(0,0,0,0.15)")
    .style("font-size", "12px")
    .style("font-family", "Inter, sans-serif")
    .style("color", "#d62728");

  // --- Overlay 捕捉鼠标移动 ---
  svg2.append("rect")
    .attr("class", "overlay")
    .attr("width", width2)
    .attr("height", height2)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("mouseout", () => {
      // 鼠标离开图表 → 隐藏全部
      focusCritic.style("display", "none");
      tooltipCritic.style("display", "none");
      focusAudience.style("display", "none");
      tooltipAudience.style("display", "none");
    })
    .on("mousemove", (event) => {
      const [mouseX, mouseY] = d3.pointer(event);
      const yearScale = x.invert(mouseX);

      // 找出最接近鼠标的年份
      const closest = yearly.reduce((a, b) =>
        Math.abs(b.year - yearScale) < Math.abs(a.year - yearScale) ? b : a
      );

      const yCritic = y(closest.critic_avg);
      const yAudience = y(closest.audience_avg);

      // 计算鼠标与两条线的垂直距离
      const distCritic = Math.abs(mouseY - yCritic);
      const distAudience = Math.abs(mouseY - yAudience);

      // 判断靠近哪条线
      const closer = distCritic < distAudience ? "critic" : "audience";

      if (closer === "critic") {
        // 🔵 显示蓝线 Tooltip
        focusCritic.transition().duration(80)
          .attr("transform", `translate(${x(closest.year)},${yCritic})`);
        tooltipCritic
          .style("display", null)
          .attr("x", x(closest.year) + 10)
          .attr("y", yCritic - 45)
          .select("#tooltip-critic")
          .html(`
          <strong>${closest.year}</strong><br>
          ⭐ Critics: ${(closest.critic_avg * 100).toFixed(1)}%
        `);

        // 隐藏红线提示
        focusAudience.style("display", "none");
        tooltipAudience.style("display", "none");
      } else {
        // 🔴 显示红线 Tooltip
        focusAudience.transition().duration(80)
          .attr("transform", `translate(${x(closest.year)},${yAudience})`);
        tooltipAudience
          .style("display", null)
          .attr("x", x(closest.year) + 10)
          .attr("y", yAudience - 45)
          .select("#tooltip-audience")
          .html(`
          <strong>${closest.year}</strong><br>
          👥 Audience: ${(closest.audience_avg * 100).toFixed(1)}%
        `);

        // 隐藏蓝线提示
        focusCritic.style("display", "none");
        tooltipCritic.style("display", "none");
      }
    });

  svg2.append("g")
    .attr("transform", `translate(0,${height2})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svg2.append("g").call(d3.axisLeft(y));

  svg2.append("text")
    .attr("x", width2 / 2)
    .attr("y", -15)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .text("Average Ratings Over Time");

  svg2.append("text")
    .attr("x", width2 / 2)
    .attr("y", height2 + 45)
    .attr("text-anchor", "middle")
    .text("Release Year");

  svg2.append("text")
    .attr("x", -height2 / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Average Score");

  // Legend
  const legend = svg2.append("g")
    .attr("transform", `translate(${width2 + 10}, ${height2 / 2 - 30})`);

  legend.append("text")
    .attr("x", 0)
    .attr("y", -10)
    .text("Legend")
    .attr("font-weight", "bold")
    .attr("font-size", "13px");

  legend.append("rect")
    .attr("x", 0)
    .attr("y", 5)
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", "#1f77b4");
  legend.append("text")
    .attr("x", 25)
    .attr("y", 17)
    .text("Critics")
    .attr("font-size", "12px");

  legend.append("rect")
    .attr("x", 0)
    .attr("y", 30)
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", "#d62728");
  legend.append("text")
    .attr("x", 25)
    .attr("y", 42)
    .text("Audience")
    .attr("font-size", "12px");
});

// //--------------------------------------------------
// // Q5: Venn Diagram (Top 30 unique movies)
// //--------------------------------------------------
// (function () {
//     const width = 800, height = 500;
//     const svg = d3.select("#chart-q5").append("svg").attr("width", width).attr("height", height);

//     d3.csv("data/imdb_tomatoes_oscar.csv").then(data => {
//         data.forEach(d => {
//             d.critic_score = +d.critic_score;
//             d.audience_score = +d.audience_score;
//         });

//         data = data.filter(d => d.title && !isNaN(d.critic_score) && !isNaN(d.audience_score));

//         // --- Deduplicate titles, add (year) if needed ---
//         const grouped = d3.rollups(
//             data,
//             v => v.map(d => ({ ...d })),
//             d => d.title.trim().toLowerCase()
//         );

//         const seen = new Set();
//         const uniqueByTitle = [];
//         for (const [baseTitle, entries] of grouped) {
//             if (entries.length > 1) {
//                 for (const e of entries) {
//                     const uniqueTitle = `${e.title.trim()} (${e.release_year})`;
//                     if (!seen.has(uniqueTitle)) {
//                         seen.add(uniqueTitle);
//                         uniqueByTitle.push({ ...e, title: uniqueTitle });
//                     }
//                 }
//             } else {
//                 const e = entries[0];
//                 const uniqueTitle = e.title.trim();
//                 if (!seen.has(uniqueTitle)) {
//                     seen.add(uniqueTitle);
//                     uniqueByTitle.push({ ...e, title: uniqueTitle });
//                 }
//             }
//         }

//         // --- Deterministic sorting ---
//         const topCritics = [...uniqueByTitle]
//             .sort((a, b) =>
//                 d3.descending(a.critic_score, b.critic_score) ||
//                 d3.ascending(a.title, b.title)
//             )
//             .slice(0, 30);

//         const topAudience = [...uniqueByTitle]
//             .sort((a, b) =>
//                 d3.descending(a.audience_score, b.audience_score) ||
//                 d3.ascending(a.title, b.title)
//             )
//             .slice(0, 30);

//         const criticsSet = new Set(topCritics.map(d => d.title));
//         const audienceSet = new Set(topAudience.map(d => d.title));
//         const overlap = [...criticsSet].filter(t => audienceSet.has(t));

//         const sets = [
//             { name: "Critics", movies: topCritics.filter(d => !audienceSet.has(d.title)), color: "#5DADE2", x: 280, y: height / 2 },
//             { name: "Audience", movies: topAudience.filter(d => !criticsSet.has(d.title)), color: "#E74C3C", x: 520, y: height / 2 },
//             { name: "Overlap", movies: uniqueByTitle.filter(d => overlap.includes(d.title)), color: "#9B59B6", x: 400, y: height / 2 }
//         ];

//         svg.selectAll("circle")
//             .data(sets.slice(0, 2))
//             .join("circle")
//             .attr("cx", d => d.x)
//             .attr("cy", d => d.y)
//             .attr("r", 150)
//             .attr("fill", d => d.color)
//             .attr("opacity", 0.4)
//             .attr("stroke", "black");

//         svg.selectAll(".label")
//             .data(sets.slice(0, 2))
//             .join("text")
//             .attr("x", d => d.x)
//             .attr("y", d => d.y - 170)
//             .attr("text-anchor", "middle")
//             .attr("font-size", "18px")
//             .attr("font-weight", "bold")
//             .text(d => d.name);

//         function showMovieTitles(set, offsetX = 0) {
//             const g = svg.append("g");
//             g.selectAll("text.movie")
//                 .data(set.movies.slice(0, 15))
//                 .join("text")
//                 .attr("x", set.x + offsetX)
//                 .attr("y", (d, i) => set.y - 120 + i * 16)
//                 .attr("text-anchor", "middle")
//                 .attr("font-size", "11px")
//                 .attr("fill", "black")
//                 .text(d => d.title.length > 25 ? d.title.slice(0, 25) + "..." : d.title)
//                 .on("mouseover", (e, d) => {
//                     tooltip.style("visibility", "visible")
//                         .html(`<strong>${d.title}</strong><br>${set.name}`);
//                 })
//                 .on("mousemove", e => tooltip.style("top", (e.pageY - 35) + "px").style("left", (e.pageX + 10) + "px"))
//                 .on("mouseout", () => tooltip.style("visibility", "hidden"));
//         }

//         showMovieTitles(sets[0], -30);
//         showMovieTitles(sets[1], 30);
//         showMovieTitles(sets[2], 0);
//     });
// })();

//--------------------------------------------------
// Q5: Word-Cloud Venn  (Interactive Top N Selector)
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

    //--------------------------------------------------
    // Data cleaning & deduplication (same as before)
    //--------------------------------------------------
    let data = rawData.map(d => ({
      title: d.title.trim(),
      release_year: +d.release_year,
      critic: +d.critic_score,
      audience: +d.audience_score
    })).filter(d => d.title && isFinite(d.critic) && isFinite(d.audience));

    const grouped = d3.rollups(data, v => v.map(d => ({ ...d })), d => d.title.trim().toLowerCase());
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
    // Function: Draw Venn for selected N
    //--------------------------------------------------
    function drawVenn(topN) {
      vennContainer.selectAll("svg").remove();

      const W = window.innerWidth * 0.8;
      const H = window.innerHeight * 0.8;
      const margin = { top: 0.05 * H, right: 0.1 * W, bottom: 0.05 * H, left: 0.1 * W };
      const innerW = W - margin.left - margin.right;
      const innerH = H - margin.top - margin.bottom;

      const svg = vennContainer.append("svg")
        .attr("width", W)
        .attr("height", H)
        .attr("viewBox", `0 0 ${W} ${H}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

      const centerY = margin.top + innerH / 2;
      const maxFont = Math.max(18, Math.min(26, W / 65));
      const minFont = Math.max(8, Math.min(13, W / 180));

      const centers = {
        critic: { x: W * 0.36, y: centerY },
        audience: { x: W * 0.64, y: centerY },
        overlap: { x: W / 2, y: centerY }
      };

      const unifiedR = innerH / 2;
      const padFracCritic = 0.3;
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
      // Determine top-N sets dynamically
      //--------------------------------------------------
      const topCritics = data.slice().sort((a, b) => (b.critic - a.critic) || a.title.localeCompare(b.title)).slice(0, topN);
      const topAudience = data.slice().sort((a, b) => (b.audience - a.audience) || a.title.localeCompare(b.title)).slice(0, topN);

      const criticSet = new Set(topCritics.map(d => d.title));
      const audienceSet = new Set(topAudience.map(d => d.title));
      const overlapSet = new Set([...criticSet].filter(x => audienceSet.has(x)));

      const criticOnly = topCritics.filter(d => !overlapSet.has(d.title));
      const audienceOnly = topAudience.filter(d => !overlapSet.has(d.title));
      const overlap = data.filter(d => overlapSet.has(d.title));

      //--------------------------------------------------
      // Randomized typography (original)
      //--------------------------------------------------
      const fontFamilies = ["Helvetica Neue, Arial, sans-serif", "Georgia, serif", "Trebuchet MS, sans-serif", "Verdana, sans-serif", "Times New Roman, serif"];
      const fontWeights = [300, 400, 500, 600, 700, "bold"];
      const fontStyles = ["normal", "italic", "oblique"];
      const randomFont = () => fontFamilies[Math.floor(Math.random() * fontFamilies.length)];
      const randomWeight = () => fontWeights[Math.floor(Math.random() * fontWeights.length)];
      const randomStyle = () => fontStyles[Math.floor(Math.random() * fontStyles.length)];

      //--------------------------------------------------
      // Layout function (preserved from original)
      //--------------------------------------------------
      function layoutWords(movies, regionKey, color) {
        if (!movies.length) return;
        const sizeScale = d3.scaleLinear()
          .domain([d3.min(movies, d => d.title.length), d3.max(movies, d => d.title.length)])
          .range([maxFont, minFont]);

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
            .on("mouseover", (e, d) => tooltip.style("visibility", "visible").html(`<strong>${d.title}</strong><br>${regionKey}`))
            .on("mousemove", e => tooltip.style("top", (e.pageY - 35) + "px").style("left", (e.pageX + 10) + "px"))
            .on("mouseout", () => tooltip.style("visibility", "hidden"));
          return;
        }

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
            let valid = true;
            for (let p of placed) {
              const dx = p.x - pt.x, dy = p.y - pt.y;
              if (Math.abs(dx) < (p.w + textBox.w) / 2 &&
                Math.abs(dy) < (p.h + textBox.h) / 2) {
                valid = false; break;
              }
            }
            if (valid) {
              placed.push({ ...pt, ...textBox, font, text: movie.title });
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
            placed.push({ ...pt, ...textBox, font, text: movie.title });
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
          .on("mouseover", (e, d) => tooltip.style("visibility", "visible").html(`<strong>${d.text}</strong><br>${regionKey}`))
          .on("mousemove", e => tooltip.style("top", (e.pageY - 35) + "px").style("left", (e.pageX + 10) + "px"))
          .on("mouseout", () => tooltip.style("visibility", "hidden"));
      }

      //--------------------------------------------------
      // Draw words & region circles (unchanged)
      //--------------------------------------------------
      layoutWords(criticOnly, "critic", "#1f77b4");
      layoutWords(audienceOnly, "audience", "#d62728");
      layoutWords(overlap, "overlap", "#15803d");

      svg.append("circle")
        .attr("cx", centers.critic.x)
        .attr("cy", centers.critic.y)
        .attr("r", unifiedR)
        .attr("fill", "#1f77b4")
        .attr("fill-opacity", 0.35)
        .style("mix-blend-mode", "multiply");

      svg.append("circle")
        .attr("cx", centers.audience.x)
        .attr("cy", centers.audience.y)
        .attr("r", unifiedR)
        .attr("fill", "#d62728")
        .attr("fill-opacity", 0.35)
        .style("mix-blend-mode", "multiply");
    }

    //--------------------------------------------------
    // Initial draw + slider listener
    //--------------------------------------------------
    const defaultN = +rangeInput.node().value || 50;
    drawVenn(defaultN);
    rangeValue.text(defaultN);
    vennTitle.text(`Top ${defaultN} Movies: Critic vs Audience`);

    rangeInput.on("input", function () {
      const n = +this.value;
      rangeValue.text(n);
      vennTitle.text(`Top ${n} Movies: Critic vs Audience`);
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
  /* ------------------ Helpers ------------------ */
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

        /* ------------------ Load data ------------------ */
        d3.csv("data/imdb_tomatoes.csv").then(raw => {
          console.log('Trying to load data in movie recommendation tool.')
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

            // populate genre dropdown
            const genres = Array.from(new Set(data.flatMap(d => d.genre ? d.genre.split(',').map(s => s.trim()).filter(Boolean) : []))).sort();
            const genreSel = d3.select("#genre");
            genreSel.selectAll("option").data(["All", ...genres]).join("option").attr("value", d => d).text(d => d);

            /* ------------------ State ------------------ */
            let voteRange = [d3.min(data, d => d.votes), d3.max(data, d => d.votes)];
            let critBrushRange = null;
            let audBrushRange = null;

            /* ------------------ Vote histogram (vertical, log bins, fixed) ------------------ */
            const vW = 140, vH = 420, vMg = { top: 8, right: 8, bottom: 28, left: 36 };
            const voteSvg = d3.select("#voteSvg");
            voteSvg.selectAll("*").remove();

            // --- prepare data ---
            const votesArr = data.map(d => Math.max(1, d.votes || 0)); // avoid zero for log scale
            const maxVote = d3.max(votesArr);
            const minVote = 1;

            // --- build log-spaced thresholds for bins ---
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

            // --- scales ---
            // linear scale for visual spacing (so each log step occupies similar height)
            const yLinear = d3.scaleLinear()
                .domain([Math.log10(minVote), Math.log10(maxVote)])
                .range([vMg.top, vH - vMg.bottom]);
                
            // for bar width (counts)
            const xCount = d3.scaleLinear()
                .domain([0, d3.max(bins, b => b.length)])
                .range([0, vW - vMg.left - vMg.right]);

            // --- draw bars ---
            voteSvg.append("g")
                .selectAll("rect")
                .data(bins)
                .join("rect")
                .attr("x", vMg.left)
                .attr("y", d => yLinear(Math.log10(d.x1)) + 1)
                .attr("width", d => xCount(d.length))
                .attr("height", d => Math.max(1, yLinear(Math.log10(d.x0)) - yLinear(Math.log10(d.x1)) - 1))
                .attr("fill", "#9ecae1")
                .attr("stroke", "#7fb0d8");

            // --- left axis (log ticks) ---
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
                .text(d => fmt(Math.round(d)));

            // --- brush for filtering ---
            const voteBrush = d3.brushY()
                .extent([[vMg.left, vMg.top], [vW - vMg.right, vH - vMg.bottom]])
                .on("brush end", ({ selection }) => {
                    if (selection) {
                        const [y0, y1] = selection;
                        // convert from pixel to vote values using inverse of linear log mapping
                        const v0 = Math.round(Math.pow(10, yLinear.invert(y1))); // bottom -> smaller
                        const v1 = Math.round(Math.pow(10, yLinear.invert(y0))); // top -> larger
                        voteRange = [Math.min(v0, v1), Math.max(v0, v1)];

                        d3.select("#voteLabel").text(fmt(voteRange[0]) + " — " + fmt(voteRange[1]));
                    } else {
                        voteRange = [d3.min(data, d => d.votes || 0), d3.max(data, d => d.votes || 0)];
                        d3.select("#voteLabel").text("All");
                    }
                    updateAll();
                });

            voteSvg.append("g").attr("class", "brush").call(voteBrush);


            /* ------------------ Critic & Audience histograms (horizontal, with brushX) ------------------ */
            // We'll create an updatable histogram component so distribution is recomputed from the current pool
            function createHoriz(svgId, accessor, labelId, summaryId, onBrushSet) {
                const W = 420, H = 140, mg = { left: 36, right: 10, top: 8, bottom: 28 };
                const svg = d3.select(svgId);
                svg.selectAll("*").remove();

                // normalize domain for scores — assume 0..1 typical; use 0..1 for x domain
                const x = d3.scaleLinear().domain([0, 1]).range([mg.left, W - mg.right]);
                const y = d3.scaleLinear().domain([0, 1]).range([H - mg.bottom, mg.top]); // placeholder, will update

                // group for bars
                const barsG = svg.append("g").attr("class", "bars");
                svg.append("g").attr("transform", "translate(0," + (H - mg.bottom) + ")").call(d3.axisBottom(x).ticks(5));

                // brushX
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
                        updateAll(); // re-filter & update visuals
                    });

                svg.append("g").attr("class", "brush").call(brush);

                // update function: vals = array of numbers for this metric
                function update(vals) {
                    vals = vals.filter(v => !isNaN(v)).map(v => +v);
                    if (vals.length === 0) {
                        barsG.selectAll("rect").remove();
                        y.domain([0, 1]);
                        return;
                    }
                    const maxVal = d3.max(vals);
                    // binning: 25 bins across 0..1 (clamped)
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
                        .attr("fill", "#ffd966")
                        .merge(rects)
                        .transition().duration(250)
                        .attr("x", d => x(d.x0))
                        .attr("y", d => y(d.length))
                        .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
                        .attr("height", d => y(0) - y(d.length));
                }

                return { x, update, svg, brush, setBrush: (b) => { svg.select(".brush").call(brush.move, b ? [x(b[0]), x(b[1])] : null); } };
            }

            // make components and pass callbacks to set global ranges
            const criticHist = createHoriz("#criticSvg", d => d.critic_score, "#critLabel", "#critSummary", (range) => {
                if (range) { critBrushRange = [Math.max(0, range[0]), Math.min(1, range[1])]; d3.select("#critLabel").text(critBrushRange.map(v => v.toFixed(1)).join(' — ')); d3.select("#critSummary").text(critBrushRange[0].toFixed(1)); }
                else { critBrushRange = null; d3.select("#critLabel").text("All"); d3.select("#critSummary").text("All"); }
            });

            const audHist = createHoriz("#audienceSvg", d => d.audience_score, "#audLabel", "#audSummary", (range) => {
                if (range) { audBrushRange = [Math.max(0, range[0]), Math.min(1, range[1])]; d3.select("#audLabel").text(audBrushRange.map(v => v.toFixed(1)).join(' — ')); d3.select("#audSummary").text(audBrushRange[0].toFixed(1)); }
                else { audBrushRange = null; d3.select("#audLabel").text("All"); d3.select("#audSummary").text("All"); }
            });

            /* ------------------ Timeline (bubbles) ------------------ */
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
                .attr("fill", "#f5f5f5");

            tSvg.append("g").attr("transform", "translate(0," + (tH - tMg.bottom) + ")").call(d3.axisBottom(x).ticks(10).tickFormat(d3.format("d")));

            const bubbleG = tSvg.append("g").attr("class", "bubbles");
            const rScale = d3.scaleLinear().domain([0, 1]).range([6, 10]);
            const tooltip = d3.select("#tooltip");

            /* ------------------ Update pipeline ------------------ */
            function updateAll() {
                const selGenre = d3.select("#genre").property("value");

                // pool filtered by vote range
                let pool = data.filter(d => d.votes >= voteRange[0] && d.votes <= voteRange[1]);

                // genre
                if (selGenre !== "All") pool = pool.filter(d => d.genre && d.genre.includes(selGenre));

                // critic / audience ranges (brush selections)
                if (critBrushRange) pool = pool.filter(d => d.critic_score >= critBrushRange[0] && d.critic_score <= critBrushRange[1]);
                if (audBrushRange) pool = pool.filter(d => d.audience_score >= audBrushRange[0] && d.audience_score <= audBrushRange[1]);

                // pool size -> counts
                d3.select("#counts").text(pool.length);

                // compute avg score
                pool.forEach(d => d.avg = (d.critic_score + d.audience_score) / 2);

                // prepare shown subset (limit to first 1000 sorted by votes desc)
                const shown = pool.slice().sort((a, b) => b.votes - a.votes).slice(0, 1000);

                // bind bubbles
                const nodes = bubbleG.selectAll("g.movie").data(shown, d => d.movie_id);
                nodes.exit().transition().duration(150).style("opacity", 0).remove();

                const enter = nodes.enter().append("g").attr("class", "movie")
                    .attr("transform", d => "translate(" + x(d.release_year) + "," + (tMg.top + Math.random() * (tH - tMg.top - tMg.bottom)) + ")")
                    .style("opacity", 0);

                enter.append("circle").attr("r", 0).attr("fill", "#64b5f6").attr("opacity", 0.8).attr("stroke", "#3a8fbf");
                enter.append("text").attr("text-anchor", "middle").attr("dy", 4).attr("font-size", 10).attr("fill", "#042a2b")
                    .text(d => (d.movie_name || "").length > 14 ? (d.movie_name || "").slice(0, 10) + "…" : d.movie_name);

                const all = enter.merge(nodes);
                all.transition().duration(350).attr("transform", d => "translate(" + x(d.release_year) + "," + (tMg.top + Math.random() * (tH - tMg.top - tMg.bottom)) + ")").style("opacity", 1);
                all.select("circle").transition().duration(350).attr("r", d => rScale(d.avg));

                // interactions: tooltip + update fixed bottom detail on hover
                all.on("mouseover", (event, d) => {
                    tooltip.style("opacity", 1).style("left", (event.pageX + 10) + "px").style("top", (event.pageY + 8) + "px")
                        .html("<b>" + (d.movie_name || "") + "</b><br/>Year: " + d.release_year + "<br/>Critic: " + (isFinite(d.critic_score) ? d.critic_score.toFixed(2) : '-') + " Audience: " + (isFinite(d.audience_score) ? d.audience_score.toFixed(2) : '-') + "<br/>Votes: " + fmt(d.votes));
                    // update fixed bottom detail panel with full fields
                    const html = "<div style=\"font-weight:700\">" + (d.movie_name || "") + "</div>" +
                        "<div style=\"font-size:13px;color:#444;margin-top:6px\"> <b>Year:</b> " + d.release_year + " &nbsp; <b>Votes:</b> " + fmt(d.votes) +
                        "<br/> <b>Critic:</b> " + d.critic_score + " &nbsp; <b>Audience:</b> " + d.audience_score + " &nbsp; <b>Avg:</b> " + (d.avg ? d.avg.toFixed(3) : '-') +
                        "<br/> <b>Genre:</b> " + (d.genre || "-") + "<br/> <b>Director:</b> " + (d.director || "-") + " &nbsp; <b>Runtime:</b> " + (d.runtime || "-") +
                        "<br/> <b>Certificate:</b> " + (d.certificate || "-") + " &nbsp; <b>Rating:</b> " + (d.rating || "-") +
                        "<br/> <b>Gross:</b> " + (d.gross || "-") +
                        "<br/><div style=\"margin-top:8px;color:#333\"><b>Description:</b><div style=\"margin-top:6px;color:#555\">" + ((d.description || "").slice(0, 800)) + "</div></div></div>";
                    d3.select("#detailContent").html(html);
                }).on("mousemove", (event) => {
                    tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY + 8) + "px");
                }).on("mouseout", () => {
                    tooltip.style("opacity", 0);
                    // per requirement, detail box remains showing last hovered movie (i.e. fixed)
                });

                // update top table on the right-bottom panel
                renderTopTable(pool);

                // also update filter summary text
                d3.select("#voteSummary").text(voteRange[0] === d3.min(data, d => d.votes) && voteRange[1] === d3.max(data, d => d.votes) ? "All" : (fmt(voteRange[0]) + " — " + fmt(voteRange[1])));
                d3.select("#critSummary").text(critBrushRange ? fmtDecimal(critBrushRange[0]) + " — " + fmtDecimal(critBrushRange[1]) : "All");
                d3.select("#audSummary").text(audBrushRange ? fmtDecimal(audBrushRange[0]) + " — " + fmtDecimal(audBrushRange[1]) : "All");

                // update critic/audience histograms using the pool (so they reflect current vote selection)
                criticHist.update(pool.map(d => d.critic_score));
                audHist.update(pool.map(d => d.audience_score));
            }

            /* ------------------ Top table render ------------------ */
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

            /* ------------------ Wire controls ------------------ */
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

            /* ------------------ Init labels + render once ------------------ */
            d3.select("#voteLabel").text("All");
            d3.select("#critLabel").text("All");
            d3.select("#audLabel").text("All");
            d3.select("#critSummary").text("All");
            d3.select("#audSummary").text("All");

            // initial voteRange set to full domain
            voteRange = [d3.min(data, d => d.votes), d3.max(data, d => d.votes)];

            // initial render
            updateAll();
        });
        // end load
};

initMovieRecommendationTool();
