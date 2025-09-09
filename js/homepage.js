// Homepage functionality
class HomePage {
  constructor() {
    this.featuredContentVisible = false;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadFeaturedContent();
  }

  bindEvents() {
    const exploreBtn = document.getElementById('explore-toggle');
    
    if (exploreBtn) {
      exploreBtn.addEventListener('click', () => {
        this.toggleFeaturedContent();
      });
    }

    // Click handlers for featured items
    document.addEventListener('click', (e) => {
      const featuredItem = e.target.closest('.featured-item');
      if (featuredItem) {
        const type = featuredItem.dataset.type;
        const slug = featuredItem.dataset.slug;
        
        if (type === 'artist') {
          window.location.href = '/artists.html';
        } else if (type === 'release') {
          // For now, just log the release
          console.log('Viewing release:', slug);
        }
      }
    });
  }

  toggleFeaturedContent() {
    const featuredContent = document.getElementById('featured-content');
    const exploreBtn = document.getElementById('explore-toggle');
    
    if (!featuredContent || !exploreBtn) return;

    this.featuredContentVisible = !this.featuredContentVisible;
    
    if (this.featuredContentVisible) {
      featuredContent.style.display = 'block';
      exploreBtn.textContent = 'Hide Music';
      
      // Animate in
      setTimeout(() => {
        featuredContent.style.opacity = '1';
        featuredContent.style.transform = 'translateY(0)';
      }, 10);
    } else {
      featuredContent.style.opacity = '0';
      featuredContent.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        featuredContent.style.display = 'none';
      }, 300);
      
      exploreBtn.textContent = 'Explore Music';
    }
  }

  async loadFeaturedContent() {
    try {
      // Load featured artists and latest releases in parallel
      const [artistsResponse, releasesResponse] = await Promise.all([
        excessAPI.getFeaturedArtists(6),
        excessAPI.getLatestReleases(6)
      ]);

      if (artistsResponse.success) {
        this.renderFeaturedArtists(artistsResponse.data);
      }

      if (releasesResponse.success) {
        this.renderLatestReleases(releasesResponse.data);
      }

    } catch (error) {
      console.error('Error loading featured content:', error);
      
      // Show fallback content
      this.renderFallbackContent();
    }
  }

  renderFeaturedArtists(artists) {
    const container = document.getElementById('featured-artists');
    
    if (!container) return;

    if (!artists || artists.length === 0) {
      container.innerHTML = '<p class="loading-small">No featured artists available</p>';
      return;
    }

    const artistsHTML = artists.map(artist => `
      <div class="featured-item" data-type="artist" data-slug="${artist.slug}">
        ${artist.profileImage ? `<img src="${artist.profileImage}" alt="${artist.name}">` : '<div class="placeholder-image">🎵</div>'}
        <h4>${artist.name}</h4>
        <p>${artist.totalReleases || 0} releases</p>
      </div>
    `).join('');

    container.innerHTML = artistsHTML;
  }

  renderLatestReleases(releases) {
    const container = document.getElementById('latest-releases');
    
    if (!container) return;

    if (!releases || releases.length === 0) {
      container.innerHTML = '<p class="loading-small">No releases available</p>';
      return;
    }

    const releasesHTML = releases.map(release => `
      <div class="featured-item" data-type="release" data-slug="${release.slug}">
        <img src="${release.artwork}" alt="${release.title}">
        <h4>${release.title}</h4>
        <p>${release.artist.name}</p>
      </div>
    `).join('');

    container.innerHTML = releasesHTML;
  }

  renderFallbackContent() {
    // Show some static content if API is not available
    const artistsContainer = document.getElementById('featured-artists');
    const releasesContainer = document.getElementById('latest-releases');

    if (artistsContainer) {
      artistsContainer.innerHTML = `
        <div class="featured-item" data-type="artist">
          <div class="placeholder-image">🎵</div>
          <h4>SelfMade</h4>
          <p>Trap soul artist</p>
        </div>
        <div class="featured-item" data-type="artist">
          <div class="placeholder-image">🎵</div>
          <h4>Dolores</h4>
          <p>Experimental</p>
        </div>
        <div class="featured-item" data-type="artist">
          <div class="placeholder-image">🎵</div>
          <h4>XX Collective</h4>
          <p>Producer collective</p>
        </div>
      `;
    }

    if (releasesContainer) {
      releasesContainer.innerHTML = `
        <div class="featured-item" data-type="release">
          <div class="placeholder-image">💿</div>
          <h4>Latest EP</h4>
          <p>New Release</p>
        </div>
        <div class="featured-item" data-type="release">
          <div class="placeholder-image">💿</div>
          <h4>Single Drop</h4>
          <p>Hot Track</p>
        </div>
        <div class="featured-item" data-type="release">
          <div class="placeholder-image">💿</div>
          <h4>Album</h4>
          <p>Full Length</p>
        </div>
      `;
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize on homepage
  if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    new HomePage();
  }
});

// Add CSS for featured content transitions
const style = document.createElement('style');
style.textContent = `
  .featured-content {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .placeholder-image {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba(255,255,255,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    margin: 0 auto 8px;
  }

  .featured-grid::-webkit-scrollbar {
    width: 6px;
  }

  .featured-grid::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.1);
    border-radius: 3px;
  }

  .featured-grid::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.3);
    border-radius: 3px;
  }

  .featured-grid::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.5);
  }
`;
document.head.appendChild(style);
