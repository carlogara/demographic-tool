/**
 * File: sidebar-dots.js
 * Location: demographic-tool/frontend/js/sidebar-dots.js
 * Purpose: Generates and adds the CISOC-style dot sidebar that extends into the header
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Create and add the sidebar element immediately
  createSidebar();
  
  // Add event listeners for dashboard/landing toggles to handle sidebar visibility
  setupEventListeners();
});

/**
 * Creates the sidebar element and adds it to the body
 */
function createSidebar() {
  // Check if sidebar already exists to prevent duplicates
  if (document.querySelector('.cisoc-dots-sidebar')) return;
  
  // Create the sidebar element
  const sidebar = document.createElement('div');
  sidebar.className = 'cisoc-dots-sidebar';
  
  // Add sidebar as the first child of the body to ensure it's behind other elements
  document.body.insertBefore(sidebar, document.body.firstChild);
  
  // Check if we should show the sidebar (only if on dashboard)
  updateSidebarVisibility();
}

/**
 * Set up event listeners for dashboard/landing toggles
 */
function setupEventListeners() {
  // Listen for clicks on #back-to-landing
  const backToLandingBtn = document.getElementById('back-to-landing');
  if (backToLandingBtn) {
    backToLandingBtn.addEventListener('click', function() {
      // Sidebar should be hidden on landing page
      updateSidebarVisibility(true);
    });
  }
  
  // Listen for location selection in search results
  const landingSearchResults = document.getElementById('landing-search-results');
  if (landingSearchResults) {
    landingSearchResults.addEventListener('click', function(e) {
      if (e.target.classList.contains('search-result-item')) {
        // Going to dashboard, show sidebar
        updateSidebarVisibility(false);
      }
    });
  }
  
  // Handle initial state
  if (sessionStorage.getItem('selectedLocation')) {
    // If there's a selected location, we're on dashboard
    updateSidebarVisibility(false);
  } else {
    // Otherwise we're on landing
    updateSidebarVisibility(true);
  }
}

/**
 * Updates sidebar visibility based on current page
 * @param {boolean} onLandingPage - Whether we're on the landing page
 */
function updateSidebarVisibility(onLandingPage) {
  const sidebar = document.querySelector('.cisoc-dots-sidebar');
  if (!sidebar) return;
  
  // If explicitly set, use that value, otherwise determine from DOM
  if (onLandingPage === undefined) {
    onLandingPage = document.getElementById('landing-page').style.display !== 'none';
  }
  
  // Hide sidebar on landing page, show on dashboard
  if (onLandingPage) {
    sidebar.style.display = 'none';
  } else {
    sidebar.style.display = 'block';
  }
}