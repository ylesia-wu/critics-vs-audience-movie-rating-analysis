// script.js
// Combined visualizations for Q1 + Q2 + Q5
// D3.js v7

//--------------------------------------------------
// Shared tooltip
//--------------------------------------------------
const tooltip = d3.select("#tooltip");

//--------------------------------------------------
// Q1: Average Critic - Audience Score Difference by Genre
//--------------------------------------------------
const margin1 = { top: 40, right: 40, bottom: 60, left: 120 },
    width1 = 900 - margin1.left - margin1.right,
    height1 = 500 - margin1.top - margin1.bottom;

const svg1 = d3.select("#chart-q1")
    .append("svg")
    .attr("width", width1 + margin1.left + margin1.right)
    .attr("height", height1 + margin1.top + margin1.bottom)
    .append("g")
    .attr("transform", `translate(${margin1.left},${margin1.top})`);

d3.csv("data/imdb_tomatoes_oscar_genre_expanded.csv").then(data => {
    data.forEach(d => {
        d.critic_score = +d.critic_score;
        d.audience_score = +d.audience_score;
        d.score_diff = d.critic_score - d.audience_score;
        d.genre = d.genre.trim();
    });

    const genreDiff = Array.from(
        d3.group(data, d => d.genre),
        ([genre, values]) => ({
            genre,
            diff: d3.mean(values, v => v.score_diff)
        })
    ).filter(d => d.genre && !isNaN(d.diff));

    genreDiff.sort((a, b) => d3.ascending(a.diff, b.diff));

    const x = d3.scaleLinear()
        .domain(d3.extent(genreDiff, d => d.diff))
        .nice()
        .range([0, width1]);

    const y = d3.scaleBand()
        .domain(genreDiff.map(d => d.genre))
        .range([height1, 0])
        .padding(0.2);

    svg1.selectAll(".bar")
        .data(genreDiff)
        .join("rect")
        .attr("class", "bar")
        .attr("y", d => y(d.genre))
        .attr("x", d => x(Math.min(0, d.diff)))
        .attr("width", d => Math.abs(x(d.diff) - x(0)))
        .attr("height", y.bandwidth())
        .attr("fill", d => d.diff > 0 ? "#5DADE2" : "#E74C3C")
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
                .html(`<strong>${d.genre}</strong><br>Diff: ${d.diff.toFixed(3)}`);
        })
        .on("mousemove", event => {
            tooltip.style("top", (event.pageY - 35) + "px")
                .style("left", (event.pageX + 15) + "px");
        })
        .on("mouseout", () => tooltip.style("visibility", "hidden"));

    svg1.append("g")
        .attr("transform", `translate(0,${height1})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("+.2f")));

    svg1.append("g").call(d3.axisLeft(y));

    svg1.append("line")
        .attr("x1", x(0))
        .attr("x2", x(0))
        .attr("y1", 0)
        .attr("y2", height1)
        .attr("stroke", "#333")
        .attr("stroke-dasharray", "3,3");

    svg1.append("text")
        .attr("x", width1 / 2)
        .attr("y", height1 + 45)
        .attr("text-anchor", "middle")
        .text("Critic Score – Audience Score (→ Critics Like More)");

    svg1.append("text")
        .attr("x", -height1 / 2)
        .attr("y", -90)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text("Genre");
});

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

    // Legend placed outside the main plot area
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

//--------------------------------------------------
// Q5: Venn Diagram (Top 30 unique movies)
//--------------------------------------------------
(function () {
    const width = 800, height = 500;
    const svg = d3.select("#chart-q5").append("svg").attr("width", width).attr("height", height);

    d3.csv("data/imdb_tomatoes_oscar.csv").then(data => {
        data.forEach(d => {
            d.critic_score = +d.critic_score;
            d.audience_score = +d.audience_score;
        });

        data = data.filter(d => d.title && !isNaN(d.critic_score) && !isNaN(d.audience_score));
        const uniqueByTitle = Array.from(
            d3.rollup(data, v => v[0], d => d.title)
        ).map(([title, d]) => d);

        const topCritics = uniqueByTitle
            .sort((a, b) => d3.descending(a.critic_score, b.critic_score))
            .slice(0, 30);
        const topAudience = uniqueByTitle
            .sort((a, b) => d3.descending(a.audience_score, b.audience_score))
            .slice(0, 30);

        const criticsSet = new Set(topCritics.map(d => d.title));
        const audienceSet = new Set(topAudience.map(d => d.title));
        const overlap = [...criticsSet].filter(t => audienceSet.has(t));

        console.log("Overlap count:", overlap.length, overlap);

        const sets = [
            { name: "Critics", movies: topCritics.filter(d => !audienceSet.has(d.title)), color: "#5DADE2", x: 280, y: height / 2 },
            { name: "Audience", movies: topAudience.filter(d => !criticsSet.has(d.title)), color: "#E74C3C", x: 520, y: height / 2 },
            { name: "Overlap", movies: uniqueByTitle.filter(d => overlap.includes(d.title)), color: "#9B59B6", x: 400, y: height / 2 }
        ];

        svg.selectAll("circle")
            .data(sets.slice(0, 2))
            .join("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", 150)
            .attr("fill", d => d.color)
            .attr("opacity", 0.4)
            .attr("stroke", "black");

        svg.selectAll(".label")
            .data(sets.slice(0, 2))
            .join("text")
            .attr("x", d => d.x)
            .attr("y", d => d.y - 170)
            .attr("text-anchor", "middle")
            .attr("font-size", "18px")
            .attr("font-weight", "bold")
            .text(d => d.name);

        function showMovieTitles(set, offsetX = 0) {
            const g = svg.append("g");
            g.selectAll("text.movie")
                .data(set.movies.slice(0, 15))
                .join("text")
                .attr("x", set.x + offsetX)
                .attr("y", (d, i) => set.y - 120 + i * 16)
                .attr("text-anchor", "middle")
                .attr("font-size", "11px")
                .attr("fill", "black")
                .text(d => d.title.length > 25 ? d.title.slice(0, 25) + "..." : d.title)
                .on("mouseover", (e, d) => {
                    tooltip.style("visibility", "visible")
                        .html(`<strong>${d.title}</strong><br>${set.name}`);
                })
                .on("mousemove", e => tooltip.style("top", (e.pageY - 35) + "px").style("left", (e.pageX + 10) + "px"))
                .on("mouseout", () => tooltip.style("visibility", "hidden"));
        }

        showMovieTitles(sets[0], -30);
        showMovieTitles(sets[1], 30);
        showMovieTitles(sets[2], 0);
        console.log('Finished drawing the first venn diagram');
    });
})();

//--------------------------------------------------
// Q5: Word-Cloud Venn (Top 50 Critic vs Audience)
//--------------------------------------------------
(function () {
    d3.csv("data/rotten_tomatoes.csv").then(data => {
        if (!data || !data.length) {
        console.error("CSV file is empty or missing");
        return;
    }


    if (!data || !data.length) {
      loadingText.text("CSV file is empty or missing");
      return;
    }

    // parse and validate (scores already 0–1)
    data = data.map(d => ({
      title: d.title.trim(),
      critic: +d.critic_score,
      audience: +d.audience_score
    })).filter(d =>
      d.title && isFinite(d.critic) && isFinite(d.audience)
    );

    if (!data.length) {
      loadingText.text("No valid rows in CSV");
      return;
    }

    // top-N selections
    const topN = 50;
    const topCritics = data.slice().sort((a, b) => b.critic - a.critic).slice(0, topN);
    const topAudience = data.slice().sort((a, b) => b.audience - a.audience).slice(0, topN);

    // find overlaps
    const criticSet = new Set(topCritics.map(d => d.title));
    const audienceSet = new Set(topAudience.map(d => d.title));
    const overlapSet = new Set([...criticSet].filter(x => audienceSet.has(x)));

    const criticOnly   = topCritics.filter(d => !overlapSet.has(d.title));
    const audienceOnly = topAudience.filter(d => !overlapSet.has(d.title));
    const overlap      = data.filter(d => overlapSet.has(d.title));

    // === visualization setup ===
    const W = window.innerWidth * 0.98;
    const H = window.innerHeight * 0.95;
    const margin = { top: 0.05 * H, right: 0.1 * W, bottom: 0.05 * H, left: 0.1 * W };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;

    const svg = d3.select("#venn").append("svg")
      .attr("width", W)
      .attr("height", H)
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const centerY = margin.top + innerH / 2;
    const maxFont = Math.max(22, Math.min(32, W / 55));
    const minFont = Math.max(10, Math.min(16, W / 160));

    const centers = {
      critic: { x: W * 0.36, y: centerY },
      audience: { x: W * 0.64, y: centerY },
      overlap: { x: W / 2, y: centerY }
    };
    const unifiedR = innerH / 2;
    const padFracCritic = 0.35;
    const padFracAudience = 0.4;

    // --- region helpers ---
    function dist(pt, c) {
      const dx = pt.x - c.x, dy = pt.y - c.y;
      return Math.sqrt(dx * dx + dy * dy);
    }
    function inRegion(pt, regionKey) {
      const dCritic = dist(pt, centers.critic);
      const dAudience = dist(pt, centers.audience);

      if (regionKey === "critic") {
        return dCritic <= unifiedR && dAudience >= unifiedR * (1 + padFracCritic);
      } else if (regionKey === "audience") {
        return dAudience <= unifiedR && dCritic >= unifiedR * (1 + padFracAudience);
      } else if (regionKey === "overlap") {
        return dCritic <= unifiedR && dAudience <= unifiedR;
      }
      return false;
    }

    // --- random visual style ---
    const fontFamilies = [
      "Helvetica Neue, Arial, sans-serif",
      "Georgia, serif",
      "Trebuchet MS, sans-serif",
      // "Courier New, monospace",
      "Verdana, sans-serif",
      "Times New Roman, serif",
      "Gill Sans, sans-serif",
      "Lucida Bright, serif"
    ];
    const fontWeights = [300, 400, 500, 600, 700, "bold"];
    const fontStyles = ["normal", "italic", "oblique"];

    function randomFont() {
      return fontFamilies[Math.floor(Math.random() * fontFamilies.length)];
    }
    function randomWeight() {
      return fontWeights[Math.floor(Math.random() * fontWeights.length)];
    }
    function randomStyle() {
      return fontStyles[Math.floor(Math.random() * fontStyles.length)];
    }

    // --- layout words ---
    function layoutWords(movies, regionKey, color) {
      if (!movies.length) return;

      const sizeScale = d3.scaleLinear()
        .domain([d3.min(movies, d => d.title.length), d3.max(movies, d => d.title.length)])
        .range([maxFont, minFont]);

      // overlap: vertical centered list
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
          .text(d => d.title);
        return;
      }

      // otherwise: scatter in crescent region
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
        .text(d => d.text);
    }

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

    loadingText.classed("hidden", true);
  });
})();

