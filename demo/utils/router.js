/**
 * Simple client-side router utilities
 * Uses hash-based routing (e.g., #/start, #/playground)
 */

/**
 * Get current route from hash
 * @returns {string} Current route path
 */
export function getCurrentRoute() {
  const hash = window.location.hash;
  if (!hash || hash === '#') {
    return '/start';
  }
  return hash.slice(1); // Remove '#'
}

/**
 * Navigate to a route
 * @param {string} path - Route path (e.g., '/start', '/playground')
 */
export function navigate(path) {
  window.location.hash = path;
}

/**
 * Check if a route matches a pattern
 * @param {string} route - Current route
 * @param {string} pattern - Pattern to match (supports exact match)
 * @returns {boolean}
 */
export function matchRoute(route, pattern) {
  if (pattern.includes(':')) {
    // Simple parameter matching (e.g., '/playground/:id')
    const routeParts = route.split('/');
    const patternParts = pattern.split('/');
    
    if (routeParts.length !== patternParts.length) {
      return false;
    }
    
    return patternParts.every((part, index) => {
      return part.startsWith(':') || part === routeParts[index];
    });
  }
  
  return route === pattern;
}

/**
 * Extract parameters from route
 * @param {string} route - Current route
 * @param {string} pattern - Pattern with parameters (e.g., '/playground/:id')
 * @returns {Object} Parameters object
 */
export function extractParams(route, pattern) {
  const params = {};
  const routeParts = route.split('/');
  const patternParts = pattern.split('/');
  
  patternParts.forEach((part, index) => {
    if (part.startsWith(':')) {
      const paramName = part.slice(1);
      params[paramName] = routeParts[index];
    }
  });
  
  return params;
}

/**
 * Subscribe to route changes
 * @param {Function} callback - Callback function called on route change
 * @returns {Function} Unsubscribe function
 */
export function onRouteChange(callback) {
  const handleHashChange = () => {
    callback(getCurrentRoute());
  };
  
  window.addEventListener('hashchange', handleHashChange);
  
  // Call immediately with current route
  callback(getCurrentRoute());
  
  return () => {
    window.removeEventListener('hashchange', handleHashChange);
  };
}

