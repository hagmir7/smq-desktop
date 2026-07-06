/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  corePlugins: {
    // Ant Design ships its own CSS reset. Tailwind's preflight reset
    // fights with it (buttons, inputs, tables all get restyled twice),
    // so we disable it and rely on utility classes only.
    preflight: false
  },
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1677ff',
          dark: '#0958d9'
        }
      }
    }
  },
  plugins: []
};
