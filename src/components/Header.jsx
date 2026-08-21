import { Link, useLocation } from "react-router-dom";

export default function Header() {
  const location = useLocation();

  const getLinkClasses = (path) => {
    if (location.pathname === path) {
      return "text-primary font-bold border-b-2 border-primary pb-1 font-label-md text-label-md";
    }
    return "text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 font-label-md text-label-md";
  };

  return (
    <header className="bg-surface-container-lowest dark:bg-surface-container-low border-b border-outline-variant w-full sticky top-0 z-50">
      <div className="flex justify-between items-center w-full px-gutter max-w-container-max mx-auto h-20">
        <div className="text-headline-md font-headline-md font-bold text-primary dark:text-primary-fixed">
          DPIRD Business Hub
        </div>
        <nav className="hidden md:flex items-center gap-lg">
          <Link className={getLinkClasses("/")} to="/">Home</Link>
          <Link className={getLinkClasses("/advisor")} to="/advisor">Advisory Tool</Link>
          <Link className={getLinkClasses("/resources")} to="/resources">Resources</Link>
          <Link className={getLinkClasses("/grants")} to="/grants">Grants</Link>
          <Link className={getLinkClasses("/providers")} to="/providers">Providers</Link>
        </nav>
        <div className="flex items-center gap-md text-primary dark:text-inverse-primary">
          <button aria-label="Search" className="hover:opacity-80 scale-98 transition-all p-sm">
            <span className="material-symbols-outlined">search</span>
          </button>
          <Link to="/consultant/dashboard" aria-label="Account" className="hover:opacity-80 scale-98 transition-all p-sm inline-flex">
            <span className="material-symbols-outlined">account_circle</span>
          </Link>
          <button aria-label="Help" className="hover:opacity-80 scale-98 transition-all p-sm">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
          <button aria-label="Menu" className="md:hidden hover:opacity-80 scale-98 transition-all p-sm">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </div>
    </header>
  );
}
