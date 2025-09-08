// Artists page functionality
class ArtistsPage {
  constructor() {
    this.currentPage = 1;
    this.currentFilters = {
      search: '',
      genre: '',
      featured: false,
      sort: '-createdAt'
    };
    this.isLoading = false;

    this.init();
  }

  init() {
    this.bindEvents();
    this.loadArtists();
  }

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('artist-search');
    const clearSearch = document.getElementById('clear-search');
    
    if (searchInput) {
      const debouncedSearch = excessUtils.debounce((value) => {
        this.currentFilters.search = value;
        this.currentPage = 1;
        this.loadArtists();
        
        clearSearch.style.display = value ? 'block' : 'none';
      }, 500);

      searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value.trim());
      });
    }

    if (clearSearch) {
      clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        this.currentFilters.search = '';
        this.currentPage = 1;
        this.loadArtists();
        clearSearch.style.display = 'none';
      });
    }

    // Genre filter
    const genreFilter = document.getElementById('genre-filter');
    if (genreFilter) {
      genreFilter.addEventListener('change', (e) => {
        this.currentFilters.genre = e.target.value;
        this.currentPage = 1;
        this.loadArtists();
      });
    }

    // Sort filter
    const sortFilter = document.getElementById('sort-filter');
    if (sortFilter) {
      sortFilter.addEventListener('change', (e) => {
        this.currentFilters.sort = e.target.value;
        this.currentPage = 1;
        this.loadArtists();
      });
    }

    // Featured toggle
    const featuredToggle = document.getElementById('featured-toggle');
    if (featuredToggle) {
      featuredToggle.addEventListener('click', () => {
        this.currentFilters.featured = !this.currentFilters.featured;
        featuredToggle.classList.toggle('active', this.currentFilters.featured);
        featuredToggle.textContent = this.currentFilters.featured ? 'Show All' : 'Featured Only';
        this.currentPage = 1;
        this.loadArtists();
      });
    }

    // Pagination
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.loadArtists();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentPage++;
        this.loadArtists();
      });
    }

    // Artist card clicks
    document.addEventListener('click', (e) => {
      const artistCard = e.target.closest('.artist-card');
      if (artistCard) {
        const slug = artistCard.dataset.slug;
        if (slug) {
          this.viewArtist(slug);
        }
      }
    });
  }

  async loadArtists() {
    if (this.isLoading) return;

    this.isLoading = true;
    const grid = document.getElementById('artists-grid');
    const pagination = document.getElementById('pagination');

    if (grid) {
      excessUtils.showLoading(grid, 'Loading artists...');
    }

    try {
      const params = {
        page: this.currentPage,
        limit: 12,
        sort: this.currentFilters.sort
      };

      if (this.currentFilters.search) {
        params.search = this.currentFilters.search;
      }

      if (this.currentFilters.genre) {
        params.genre = this.currentFilters.genre;
      }

      if (this.currentFilters.featured) {
        params.featured = 'true';
      }

      const response = await excessAPI.getArtists(params);

      if (response.success && response.data) {
        this.renderArtists(response.data, response.pagination);
        this.updatePagination(response.pagination);
      } else {
        throw new Error('Failed to load artists');
      }

    } catch (error) {
      console.error('Error loading artists:', error);
      
      if (grid) {
        excessUtils.showError(grid, 'Failed to load artists. Please try again.');
      }
    } finally {
      this.isLoading = false;
    }
  }

  renderArtists(artists, pagination) {
    const grid = document.getElementById('artists-grid');
    
    if (!grid) return;

    if (!artists || artists.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <h3>No artists found</h3>
          <p>Try adjusting your search criteria or filters.</p>
        </div>
      `;
      return;
    }

    const artistCards = artists.map(artist => excessUtils.createArtistCard(artist)).join('');
    grid.innerHTML = artistCards;

    // Add entrance animation
    const cards = grid.querySelectorAll('.artist-card');
    cards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  updatePagination(pagination) {
    const paginationEl = document.getElementById('pagination');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');

    if (!paginationEl || !pagination) return;

    // Show/hide pagination
    if (pagination.pages > 1) {
      paginationEl.style.display = 'flex';
    } else {
      paginationEl.style.display = 'none';
      return;
    }

    // Update buttons
    if (prevBtn) {
      prevBtn.disabled = !pagination.hasPrev;
      prevBtn.classList.toggle('disabled', !pagination.hasPrev);
    }

    if (nextBtn) {
      nextBtn.disabled = !pagination.hasNext;
      nextBtn.classList.toggle('disabled', !pagination.hasNext);
    }

    // Update page info
    if (pageInfo) {
      pageInfo.textContent = `Page ${pagination.page} of ${pagination.pages}`;
    }
  }

  viewArtist(slug) {
    // For now, just log the artist slug
    // In a full implementation, you might navigate to an artist detail page
    console.log('Viewing artist:', slug);
    
    // You could implement a modal or navigate to a detail page
    // window.location.href = `/artist/${slug}`;
    
    // Or show artist details in a modal
    this.showArtistModal(slug);
  }

  async showArtistModal(slug) {
    try {
      const response = await excessAPI.getArtist(slug);
      
      if (response.success && response.data) {
        const artist = response.data;
        
        // Create modal HTML
        const modalHTML = `
          <div class="modal-overlay" id="artist-modal">
            <div class="modal-content">
              <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
              
              <div class="artist-detail">
                ${artist.profileImage ? `<img src="${artist.profileImage}" alt="${artist.name}" class="artist-image-large">` : ''}
                
                <div class="artist-info">
                  <h2>${artist.name}</h2>
                  ${artist.genre && artist.genre.length > 0 ? `<p class="genre-tags">${artist.genre.join(', ')}</p>` : ''}
                  
                  ${artist.bio ? `<p class="bio">${artist.bio}</p>` : ''}
                  
                  <div class="artist-stats-large">
                    <div class="stat">
                      <strong>${artist.totalReleases || 0}</strong>
                      <span>Releases</span>
                    </div>
                    <div class="stat">
                      <strong>${artist.totalPlays || 0}</strong>
                      <span>Total Plays</span>
                    </div>
                    <div class="stat">
                      <strong>${excessUtils.formatDate(artist.joinedDate || artist.createdAt)}</strong>
                      <span>Joined</span>
                    </div>
                  </div>
                  
                  ${this.renderSocialLinks(artist.socialLinks)}
                  
                  ${artist.releases && artist.releases.length > 0 ? this.renderArtistReleases(artist.releases) : ''}
                </div>
              </div>
            </div>
          </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add click outside to close
        const modal = document.getElementById('artist-modal');
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.remove();
          }
        });
        
      }
    } catch (error) {
      console.error('Error loading artist details:', error);
      alert('Failed to load artist details. Please try again.');
    }
  }

  renderSocialLinks(socialLinks) {
    if (!socialLinks) return '';
    
    const links = Object.entries(socialLinks)
      .filter(([key, value]) => value)
      .map(([platform, url]) => {
        const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
        return `<a href="${url}" target="_blank" rel="noopener" class="social-link">${platformName}</a>`;
      })
      .join('');
    
    return links ? `<div class="social-links">${links}</div>` : '';
  }

  renderArtistReleases(releases) {
    const releasesHTML = releases.map(release => `
      <div class="release-item">
        <img src="${release.artwork}" alt="${release.title}" class="release-thumb">
        <div class="release-info">
          <h4>${release.title}</h4>
          <p>${excessUtils.formatDate(release.releaseDate)}</p>
        </div>
      </div>
    `).join('');
    
    return `
      <div class="artist-releases">
        <h3>Recent Releases</h3>
        <div class="releases-list">
          ${releasesHTML}
        </div>
      </div>
    `;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize on artists page
  if (document.querySelector('[data-page="artists"]')) {
    new ArtistsPage();
  }
});
