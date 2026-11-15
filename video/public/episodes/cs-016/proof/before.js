function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Usage
const searchInput = document.getElementById('search');
const resultsContainer = document.getElementById('results');

const handleSearch = async (query) => {
  if (!query.trim()) {
    resultsContainer.innerHTML = '';
    return;
  }
  
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    displayResults(data);
  } catch (error) {
    console.error('Search failed:', error);
  }
};

// Debounce the search function (300ms delay)
const debouncedSearch = debounce(handleSearch, 300);

searchInput.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});


const searchInput = document.getElementById('search');
const resultsContainer = document.getElementById('results');
const loadingIndicator = document.getElementById('loading');

const handleSearch = async (query) => {
  if (!query.trim()) {
    resultsContainer.innerHTML = '';
    loadingIndicator.style.display = 'none';
    return;
  }
  
  loadingIndicator.style.display = 'block';
  
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Search failed');
    
    const data = await response.json();
    displayResults(data);
  } catch (error) {
    resultsContainer.innerHTML = '<p class="error">Search failed. Try again.</p>';
    console.error('Search error:', error);
  } finally {
    loadingIndicator.style.display = 'none';
  }
};

const debouncedSearch = debounce(handleSearch, 300);

searchInput.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});

function displayResults(data) {
  resultsContainer.innerHTML = data
    .map(item => `<div class="result">${item.title}</div>`)
    .join('');
}


function debounce(func, delay, options = {}) {
  let timeoutId;
  let lastArgs;
  
  const debounced = function (...args) {
    lastArgs = args;
    clearTimeout(timeoutId);
    
    if (options.immediate && !timeoutId) {
      func(...args);
    }
    
    timeoutId = setTimeout(() => {
      if (!options.immediate) {
        func(...lastArgs);
      }
      timeoutId = null;
    }, delay);
  };
  
  // Allow manual cancellation
  debounced.cancel = () => clearTimeout(timeoutId);
  
  return debounced;
}

// Usage with options
const debouncedSearch = debounce(handleSearch, 300, { immediate: false });

// Cancel pending search if needed
searchInput.addEventListener('blur', () => {
  debouncedSearch.cancel();
});


<div class="search-container">
  <input 
    type="text" 
    id="search" 
    placeholder="Search..."
    autocomplete="off"
  >
  <div id="loading" style="display: none;">Loading...</div>
  <div id="results"></div>
</div>

<style>
  .search-container {
    max-width: 500px;
    margin: 20px auto;
  }
  
  #search {
    width: 100%;
    padding: 10px;
    font-size: 16px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  #results {
    margin-top: 10px;
  }
  
  .result {
    padding: 10px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
  }
  
  .result:hover {
    background-color: #f5f5f5;
  }
  
  .error {
    color: red;
    padding: 10px;
  }
</style>
