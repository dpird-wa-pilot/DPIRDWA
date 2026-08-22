/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
        "colors": {
            "surface-container-low": "#f6f3f2",
            "secondary-container": "#fec64c",
            "background": "#fcf9f8",
            "tertiary-fixed-dim": "#ffb4a7",
            "surface-bright": "#fcf9f8",
            "on-secondary-container": "#725300",
            "on-tertiary-container": "#df7a69",
            "surface-container-highest": "#e4e2e1",
            "on-surface": "#1b1c1c",
            "on-tertiary-fixed": "#400200",
            "tertiary-fixed": "#ffdad4",
            "on-error-container": "#93000a",
            "tertiary": "#3e0100",
            "on-error": "#ffffff",
            "on-tertiary": "#ffffff",
            "outline": "#737780",
            "on-tertiary-fixed-variant": "#7b2d21",
            "secondary-fixed": "#ffdea3",
            "primary-fixed": "#d5e3ff",
            "surface-container-high": "#eae7e7",
            "surface-container": "#f0eded",
            "tertiary-container": "#5b160c",
            "on-surface-variant": "#43474f",
            "outline-variant": "#c3c6d0",
            "surface-variant": "#e4e2e1",
            "primary-fixed-dim": "#a6c8ff",
            "secondary": "#7a5900",
            "error-container": "#ffdad6",
            "on-primary-fixed": "#001c3b",
            "on-primary-fixed-variant": "#234776",
            "inverse-primary": "#a6c8ff",
            "on-primary-container": "#7798cc",
            "primary": "#001a39",
            "on-background": "#1b1c1c",
            "on-secondary": "#ffffff",
            "inverse-surface": "#303030",
            "primary-container": "#002f5d",
            "on-primary": "#ffffff",
            "surface": "#fcf9f8",
            "surface-tint": "#3d5f90",
            "surface-container-lowest": "#ffffff",
            "on-secondary-fixed": "#261900",
            "on-secondary-fixed-variant": "#5c4200",
            "secondary-fixed-dim": "#f5be45",
            "inverse-on-surface": "#f3f0f0",
            "error": "#ba1a1a",
            "surface-dim": "#dcd9d9"
        },
        "borderRadius": {
            "DEFAULT": "0.125rem",
            "lg": "0.25rem",
            "xl": "0.5rem",
            "full": "0.75rem"
        },
        "spacing": {
            "xs": "4px",
            "gutter": "24px",
            "md": "16px",
            "sm": "8px",
            "unit": "4px",
            "margin-mobile": "16px",
            "lg": "24px",
            "container-max": "1200px",
            "xl": "32px"
        },
        "fontFamily": {
            "headline-xl": ["Public Sans"],
            "headline-lg-mobile": ["Public Sans"],
            "headline-md": ["Public Sans"],
            "body-lg": ["Public Sans"],
            "body-md": ["Public Sans"],
            "headline-lg": ["Public Sans"],
            "label-md": ["Work Sans"],
            "label-sm": ["Work Sans"]
        },
        "fontSize": {
            "headline-xl": ["48px", {"lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
            "headline-lg-mobile": ["24px", {"lineHeight": "32px", "fontWeight": "700"}],
            "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
            "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
            "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
            "headline-lg": ["32px", {"lineHeight": "40px", "fontWeight": "700"}],
            "label-md": ["14px", {"lineHeight": "20px", "fontWeight": "600"}],
            "label-sm": ["12px", {"lineHeight": "16px", "fontWeight": "500"}]
        }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
