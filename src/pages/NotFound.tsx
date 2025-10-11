import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold glow-text">404</h1>
        <p className="mb-6 text-xl text-foreground">Oops! Page not found</p>
        <a href="/" className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-6 py-3 font-medium neon-glow hover:neon-glow-strong transition-all duration-300">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
