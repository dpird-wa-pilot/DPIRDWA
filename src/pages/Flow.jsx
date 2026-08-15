import React from 'react';
import { Link } from 'react-router-dom';

export default function Flow() {
  return (
    <main className="flex-grow flex flex-col items-center w-full">
      {/* Hero Section */}
        <section className="w-full bg-surface-container-low py-24 px-gutter lg:px-0">
          <div className="max-w-container-max mx-auto flex flex-col lg:flex-row items-center gap-xl">
            <div className="flex-1 flex flex-col gap-lg">
              <h1 className="font-headline-xl text-headline-xl text-primary max-w-2xl">
                Grow Your Business with DPIRD Digital Support
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
                Navigate the digital landscape with expert guidance. Find the right tools, resources, and government grants tailored for Western Australian small businesses to thrive in a modern economy.
              </p>
              <div className="flex flex-col sm:flex-row gap-md mt-sm">
                <Link to="/advisor" className="bg-primary-container text-on-primary font-label-md text-label-md py-3 px-6 rounded-lg hover:bg-primary transition-colors shadow-sm flex items-center justify-center gap-sm">
                  Get Started
                  <span className="material-symbols-outlined text-[20px]" data-icon="arrow_forward">arrow_forward</span>
                </Link>
                <Link to="/resources" className="bg-transparent border-2 border-primary-container text-primary-container font-label-md text-label-md py-3 px-6 rounded-lg hover:bg-surface-variant transition-colors flex items-center justify-center gap-sm">
                  Learn More
                </Link>
              </div>
            </div>
            <div className="flex-1 w-full lg:w-auto mt-xl lg:mt-0 relative">
              <div className="w-full aspect-[4/3] rounded-xl overflow-hidden shadow-[0px_4px_12px_rgba(0,0,0,0.08)] bg-surface-variant">
                <img alt="Small business owner using a tablet in a modern workshop" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0UCvECMR7wBy-6WaAuZa2fXC6Fl-34GcBThijgxJeF1uBbM6tilWJ0RtsEMjp2mOoP4KLkEUi78KLkUjcR_C7oyeumt6Eklq7hy08DVZ65uXuRNTMDMfEI1nF4rm5SnlxBC4XR8hFjE-bO-CVQekEFA8Hni0sABsJ_Cnfq7RoMRDuxbgBhvg6fB5BxDcZkp9AkXgiNArUYsMEgPGWZlMLz-YW5amLH3QiQdxfgMJmxWKVVGQ0OejwYdAVRMj9JFOtJKvIMVt6GRPg"/>
              </div>
              {/* Decorative Element */}
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-secondary-container rounded-full mix-blend-multiply filter blur-2xl opacity-40 z-[-1]"></div>
            </div>
          </div>
        </section>

        {/* Three Main Pathways (Cards) */}
        <section className="w-full py-xl px-gutter max-w-container-max mx-auto mt-[-40px] z-10 relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            {/* Card 1 */}
            <Link to="/advisor" className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col gap-md shadow-[0px_4px_12px_rgba(0,0,0,0.08)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined fill" data-icon="psychology" style={{fontVariationSettings: "'FILL' 1"}}>psychology</span>
              </div>
              <div className="flex flex-col gap-xs mt-sm">
                <h3 className="font-headline-md text-headline-md text-primary">Get Digital Advisory</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Use our interactive tool to assess your needs and get a personalized roadmap for digital growth.</p>
              </div>
              <div className="mt-auto pt-md flex items-center text-secondary font-label-md text-label-md group-hover:underline">
                Start Assessment <span className="material-symbols-outlined ml-xs text-[18px]" data-icon="chevron_right">chevron_right</span>
              </div>
            </Link>
            {/* Card 2 */}
            <Link to="/resources" className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col gap-md shadow-[0px_4px_12px_rgba(0,0,0,0.08)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-lg bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined fill" data-icon="library_books" style={{fontVariationSettings: "'FILL' 1"}}>library_books</span>
              </div>
              <div className="flex flex-col gap-xs mt-sm">
                <h3 className="font-headline-md text-headline-md text-primary">Explore Tools &amp; Resources</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Access a curated library of guides, templates, and best practices to streamline your operations.</p>
              </div>
              <div className="mt-auto pt-md flex items-center text-secondary font-label-md text-label-md group-hover:underline">
                Browse Library <span className="material-symbols-outlined ml-xs text-[18px]" data-icon="chevron_right">chevron_right</span>
              </div>
            </Link>
            {/* Card 3 */}
            <Link to="/grants" className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col gap-md shadow-[0px_4px_12px_rgba(0,0,0,0.08)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-lg bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined fill" data-icon="payments" style={{fontVariationSettings: "'FILL' 1"}}>payments</span>
              </div>
              <div className="flex flex-col gap-xs mt-sm">
                <h3 className="font-headline-md text-headline-md text-primary">Find Grants &amp; Support</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Discover available funding opportunities and support programs designed to accelerate your business.</p>
              </div>
              <div className="mt-auto pt-md flex items-center text-secondary font-label-md text-label-md group-hover:underline">
                Search Grants <span className="material-symbols-outlined ml-xs text-[18px]" data-icon="chevron_right">chevron_right</span>
              </div>
            </Link>
          </div>
        </section>

        {/* Featured Section: Industry Digital Plans */}
        <section className="w-full bg-surface-container-lowest py-24 border-t border-outline-variant">
          <div className="max-w-container-max mx-auto px-gutter flex flex-col gap-xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-lg">
              <div className="max-w-2xl flex flex-col gap-sm">
                <span className="font-label-md text-label-md text-secondary uppercase tracking-wider">Featured Program</span>
                <h2 className="font-headline-lg text-headline-lg text-primary">Industry Digital Plans</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
                  Step-by-step guides tailored to your specific sector. Discover the foundational digital solutions you need at every stage of your business growth, aligned with industry standards.
                </p>
              </div>
              <Link to="/resources" className="bg-secondary text-on-secondary font-label-md text-label-md py-3 px-6 rounded-lg hover:bg-secondary-container hover:text-on-secondary-container transition-colors shadow-sm flex items-center justify-center gap-sm shrink-0">
                View All Industry Plans
              </Link>
            </div>
            
            {/* Bento Grid Layout for Featured Items */}
            <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-md h-auto md:h-[500px]">
              {/* Large Feature Block */}
              <div className="md:col-span-2 md:row-span-2 bg-surface-container rounded-xl overflow-hidden relative group">
                <img alt="Retail industry digital planning" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEEyDBIbmTzliH55mxkVHJ00QcUKs4dw7BcaLu_UVcExlt6k3YlfOUlcWHcYInjo0-GG_FAg9XZWtxn3QfixCl6qVFWSh7u8iJ_xHDB96xWLrmr4QCvmi8gdkiErUySdUi8er69sUZVyml5Q9VtkV0KLtai_27PHxVYm86hsSugyipRfW95IttmAVk63nw4NSTp9hytlI3OxXumVmYWUdyi8uQPf3y_8bZMDmbSsnqdC_4fV-wYZPrg86H6lDoj2mkexTLJGkEXcNc"/>
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-lg w-full flex flex-col gap-sm">
                  <span className="font-label-sm text-label-sm bg-primary-container text-on-primary w-max px-2 py-1 rounded">Retail &amp; Wholesale</span>
                  <h3 className="font-headline-md text-headline-md text-on-primary">Digitize Your Retail Operations</h3>
                  <p className="font-body-md text-body-md text-on-primary/80 hidden md:block">From POS systems to inventory management and e-commerce integration, follow our structured guide to modernizing your storefront.</p>
                  <a className="font-label-md text-label-md text-secondary-fixed mt-sm hover:underline flex items-center" href="#">Explore Plan <span className="material-symbols-outlined ml-xs text-[18px]">arrow_forward</span></a>
                </div>
              </div>
              {/* Medium Block Top Right */}
              <div className="md:col-span-2 md:row-span-1 bg-surface-container rounded-xl overflow-hidden relative flex flex-col justify-end p-lg border border-outline-variant hover:border-primary transition-colors">
                <div className="flex items-center gap-sm mb-auto">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-primary" data-icon="restaurant">restaurant</span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface">Food Services</span>
                </div>
                <div className="flex flex-col gap-xs mt-md">
                  <h4 className="font-headline-md text-headline-md text-primary">Streamline Food Delivery &amp; Ordering</h4>
                  <a className="font-label-sm text-label-sm text-secondary hover:underline flex items-center mt-xs" href="#">View Guide <span className="material-symbols-outlined ml-xs text-[16px]">arrow_forward</span></a>
                </div>
              </div>
              {/* Small Block Bottom Right 1 */}
              <div className="md:col-span-1 md:row-span-1 bg-surface-container-lowest rounded-xl overflow-hidden p-md border border-outline-variant flex flex-col justify-between hover:shadow-[0px_4px_12px_rgba(0,0,0,0.08)] transition-all">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center mb-sm">
                  <span className="material-symbols-outlined text-on-surface-variant" data-icon="construction">construction</span>
                </div>
                <h4 className="font-label-md text-label-md text-primary leading-tight">Construction &amp; Trade</h4>
                <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary mt-sm flex items-center" href="#">Plan details <span className="material-symbols-outlined ml-xs text-[16px]">arrow_forward</span></a>
              </div>
              {/* Small Block Bottom Right 2 */}
              <div className="md:col-span-1 md:row-span-1 bg-primary text-on-primary rounded-xl overflow-hidden p-md flex flex-col justify-between relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary-container rounded-bl-full opacity-50"></div>
                <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center mb-sm z-10">
                  <span className="material-symbols-outlined text-on-primary" data-icon="domain">domain</span>
                </div>
                <h4 className="font-label-md text-label-md text-on-primary leading-tight z-10">Professional Services</h4>
                <a className="font-label-sm text-label-sm text-inverse-primary hover:text-on-primary mt-sm flex items-center z-10" href="#">Plan details <span className="material-symbols-outlined ml-xs text-[16px]">arrow_forward</span></a>
              </div>
            </div>
          </div>
        </section>
    </main>
  );
}
