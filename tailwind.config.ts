import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#29D4F5',
          50: '#e6fbff',
          100: '#ccf6ff',
          200: '#99ecff',
          300: '#66e3ff',
          400: '#33d9ff',
          500: '#29D4F5',
          600: '#21a9c4',
          700: '#197f93',
          800: '#115562',
          900: '#092a31',
        },
        secondary: {
          DEFAULT: '#7B4FBF',
          50: '#f3e8ff',
          100: '#e4d1ff',
          200: '#c9a3ff',
          300: '#ae75ff',
          400: '#9347ff',
          500: '#7B4FBF',
          600: '#623f99',
          700: '#492f73',
          800: '#301f4c',
          900: '#170f26',
        },
        dark: {
          DEFAULT: '#0A0A0A',
          50: '#1a1a1a',
          100: '#333333',
          200: '#4d4d4d',
          300: '#666666',
          400: '#808080',
          500: '#999999',
          600: '#b3b3b3',
          700: '#cccccc',
          800: '#e6e6e6',
          900: '#f2f2f2',
        },
      },
    },
  },
  plugins: [],
};
export default config;