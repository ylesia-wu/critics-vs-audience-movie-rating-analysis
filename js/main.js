// main.js
// Combined visualizations for Q1 + Q2
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

    // Legend title (optional)
    legend.append("text")
        .attr("x", 0)
        .attr("y", -10)
        .text("Legend")
        .attr("font-weight", "bold")
        .attr("font-size", "13px");

    // Critics
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

    // Audience
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

