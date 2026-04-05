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
        // New refined color palette
        background: {
          light: '#F4F6FB',
          dark: '#12121F',
        },
        surface: {
          DEFAULT: '#ECEEF5',
          light: '#ECEEF5',
          dark: '#1C1C2E',
        },
        text: {
          primary: {
            light: '#1A1A2E',
            dark: '#E8EAF6',
          },
          secondary: {
            light: '#4A4A6A',
            dark: '#9FA8DA',
          },
        },
        dark: {
          DEFAULT: '#12121F',
          50: '#1C1C2E',
          100: '#1C1C2E',
          200: '#252540',
          300: '#2E2E50',
          400: '#373760',
          500: '#404070',
          600: '#494980',
          700: '#525290',
          800: '#9FA8DA',
          900: '#E8EAF6',
        },
      },
    },
  },
  plugins: [],
};
export default config;