import { useLocation } from 'react-router-dom';

const EXCLUDED_ROUTE_PREFIXES = ['/admin', '/gallery'];

const isRouteExcluded = (pathname: string) => {
  return EXCLUDED_ROUTE_PREFIXES.some((prefix) => {
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
};

export const FilmGrainOverlay = () => {
  const { pathname } = useLocation();

  if (isRouteExcluded(pathname)) {
    return null;
  }

  return <div aria-hidden="true" className="film-grain-overlay" />;
};
