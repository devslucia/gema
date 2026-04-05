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
        background: {
          light: '#E8EAF2',
          dark: '#12121F',
        },
        surface: {
          DEFAULT: '#DADCE8',
          light: '#DADCE8',
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
      fontSize: {
        'display': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
        'heading': ['1.5rem', { lineHeight: '1.2', fontWeight: '600' }],
        'subheading': ['1.125rem', { lineHeight: '1.3', fontWeight: '600' }],
        'body': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
      },
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
        '22': '5.5rem',
      },
      boxShadow: {
        'elevation-1': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
        'elevation-2': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'elevation-3': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'elevation-4': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
      },
    },
  },
  plugins: [],
};
export default config;