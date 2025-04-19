// tailwind.config.js
module.exports = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/pages/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        border: 'hsl(var(--border))',
        navbar: 'hsl(var(--navbar))',
        'navbar-foreground': 'hsl(var(--navbar-foreground))',
        footer: 'hsl(var(--footer))',
        'footer-foreground': 'hsl(var(--footer-foreground))',
      },
    },
  },
  darkMode: ['class'],
  plugins: [],
};
