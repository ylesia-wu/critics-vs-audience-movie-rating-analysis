# Critics vs Audience: Movie Rating Analysis

Welcome to our project that explores **Rotten Tomatoes movie ratings** and how critics' and audiences' opinions differ or align!

Check out the interactive visualization website [here](https://ylesia-wu.github.io/critics-vs-audience-movie-rating-analysis/).

## Dataset

The data is already processed and stored inside the [data](data) folder. 

You can also run our [data-processing and EDA notebook](data_processing/data_processing_EDA.ipynb) instead. Required packages are listed inside [requirements.txt](data_processing/requirements.txt).

## Visualization Codebase

The codebase for our visualization website consists of 3 main files alongside other assets:
- [index.html](index.html)
- [script.js](script.js)
- [style.css](style.css)

To run the visualization locally, from the project root, run `python -m http.server 8000` in your terminal, then open http://localhost:8000/index.html in your browser.
