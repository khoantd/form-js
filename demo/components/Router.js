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

  // Wrap component render in error boundary
  try {
    return <Component />;
  } catch (error) {
    console.error('Error rendering component:', error);
    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h1>Render Error</h1>
        <p><strong>Route:</strong> {route}</p>
        <p><strong>Error:</strong> {error.message}</p>
        <pre>{error.stack}</pre>
      </div>
    );
  }
}

