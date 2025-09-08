// API Client for Excess Music
class ExcessAPI {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
    this.apiURL = `${baseURL}/api`;
  }

  // Generic request handler
  async request(endpoint, options = {}) {
    const url = `${this.apiURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Artists API
  async getArtists(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/artists${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  async getFeaturedArtists(limit = 6) {
    return this.request(`/artists/featured?limit=${limit}`);
  }

  async getArtist(slug) {
    return this.request(`/artists/${slug}`);
  }

  // Releases API
  async getReleases(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/releases${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  async getFeaturedReleases(limit = 8) {
    return this.request(`/releases/featured?limit=${limit}`);
  }

  async getLatestReleases(limit = 6) {
    return this.request(`/releases/latest?limit=${limit}`);
  }

  async getRelease(slug) {
    return this.request(`/releases/${slug}`);
  }

  async incrementPlayCount(releaseId, trackId = null) {
    return this.request(`/releases/${releaseId}/play`, {
      method: 'POST',
      body: JSON.stringify({ trackId })
    });
  }

  // Contact API
  async sendContactForm(formData) {
    return this.request('/contact', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
  }

  async getContactInfo() {
    return this.request('/contact/info');
  }

  // Health check
  async getHealth() {
    return this.request('/health');
  }
}

// Create global API instance
window.excessAPI = new ExcessAPI();

// Utility functions for frontend
const utils = {
  // Format date
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // Format duration (mm:ss)
  formatDuration(seconds) {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  // Truncate text
  truncate(text, length = 100) {
    if (!text || text.length <= length) return text;
    return text.substring(0, length).trim() + '...';
  },

  // Debounce function for search
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Show loading state
  showLoading(element, text = 'Loading...') {
    if (element) {
      element.innerHTML = `
        <div class="loading">
          <div class="loading-spinner"></div>
          <span>${text}</span>
        </div>
      `;
    }
  },

  // Show error state
  showError(element, message = 'Something went wrong') {
    if (element) {
      element.innerHTML = `
        <div class="error">
          <span>⚠️ ${message}</span>
          <button onclick="location.reload()" class="btn-secondary">Retry</button>
        </div>
      `;
    }
  },

  // Create artist card HTML
  createArtistCard(artist) {
    const genres = artist.genre && artist.genre.length > 0 
      ? artist.genre.slice(0, 2).join(', ') 
      : 'Various';
    
    return `
      <article class="card artist-card" data-slug="${artist.slug}">
        ${artist.profileImage ? `<img src="${artist.profileImage}" alt="${artist.name}" class="artist-image">` : ''}
        <div class="card-content">
          <h3>${artist.name}</h3>
          <p class="genre">${genres}</p>
          ${artist.bio ? `<p class="bio">${this.truncate(artist.bio, 120)}</p>` : ''}
          <div class="artist-stats">
            <span class="stat">
              <strong>${artist.totalReleases || 0}</strong> releases
            </span>
            <span class="stat">
              <strong>${artist.totalPlays || 0}</strong> plays
            </span>
          </div>
          ${artist.featured ? '<span class="featured-badge">Featured</span>' : ''}
        </div>
      </article>
    `;
  },

  // Create release card HTML
  createReleaseCard(release) {
    return `
      <article class="card release-card" data-slug="${release.slug}">
        <img src="${release.artwork}" alt="${release.title}" class="release-artwork">
        <div class="card-content">
          <h3>${release.title}</h3>
          <p class="artist-name">${release.artist.name}</p>
          <p class="release-info">
            <span class="release-type">${release.releaseType}</span>
            <span class="release-date">${this.formatDate(release.releaseDate)}</span>
          </p>
          <div class="release-stats">
            <span class="stat">
              <strong>${release.tracks.length}</strong> tracks
            </span>
            <span class="stat">
              <strong>${release.totalPlays || 0}</strong> plays
            </span>
          </div>
          ${release.featured ? '<span class="featured-badge">Featured</span>' : ''}
        </div>
      </article>
    `;
  }
};

// Make utils globally available
window.excessUtils = utils;

export { ExcessAPI, utils };
