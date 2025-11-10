import { useEffect, useState } from 'preact/hooks';
import { getCurrentRoute, onRouteChange } from '../utils/router';

/**
 * Simple Router component
 * 
 * @param {Object} props
 * @param {Object} props.routes - Route configuration object mapping paths to components
 * @param {Object} [props.defaultRoute] - Default route to show if no match
 */
export function Router({ routes, defaultRoute = '/start' }) {
  const [currentRoute, setCurrentRoute] = useState(getCurrentRoute);

  useEffect(() => {
    const unsubscribe = onRouteChange((route) => {
      setCurrentRoute(route);
    });

    return unsubscribe;
  }, []);

  // Find matching route
  const route = currentRoute in routes ? currentRoute : defaultRoute;
  const Component = routes[route] || routes[defaultRoute];

  if (!Component) {
    return <div>Route not found: {route}</div>;
  }

  return <Component />;
}

