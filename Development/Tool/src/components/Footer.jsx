export default function Footer() {
  return (
    <footer className="bg-primary dark:bg-primary-container text-on-primary dark:text-on-primary-container w-full py-xl px-gutter max-w-container-max mx-auto flex flex-col gap-lg mt-auto">
      <div className="font-headline-lg-mobile text-on-primary">
          DPIRD Business Hub
      </div>
      <div className="flex flex-wrap gap-md font-body-md text-body-md">
        <a className="text-on-primary/80 hover:text-on-primary transition-opacity focus:ring-2 focus:ring-secondary-container rounded px-1 -mx-1" href="#">Privacy</a>
        <span className="text-on-primary/40 hidden sm:inline">|</span>
        <a className="text-on-primary/80 hover:text-on-primary transition-opacity focus:ring-2 focus:ring-secondary-container rounded px-1 -mx-1" href="#">Terms of use</a>
        <span className="text-on-primary/40 hidden sm:inline">|</span>
        <a className="text-on-primary/80 hover:text-on-primary transition-opacity focus:ring-2 focus:ring-secondary-container rounded px-1 -mx-1" href="#">Contact us</a>
        <span className="text-on-primary/40 hidden sm:inline">|</span>
        <a className="text-on-primary/80 hover:text-on-primary transition-opacity focus:ring-2 focus:ring-secondary-container rounded px-1 -mx-1" href="#">Cultural sensitivity warning</a>
        <span className="text-on-primary/40 hidden sm:inline">|</span>
        <a className="text-on-primary/80 hover:text-on-primary transition-opacity focus:ring-2 focus:ring-secondary-container rounded px-1 -mx-1" href="#">wa.gov.au</a>
      </div>
      <div className="font-label-sm text-label-sm text-on-primary/60 border-t border-primary-container pt-lg">
          © 2024 Government of Western Australia. Department of Primary Industries and Regional Development.
      </div>
    </footer>
  );
}
