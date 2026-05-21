module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#1B4332',
        'primary-light': '#2D6A4F',
        accent: '#D4A843',
        'accent-light': '#F5E6C0',
        surface: '#FFFFFF',
        background: '#F8F9FA',
        border: '#E9ECEF',
        'text-primary': '#1A1A1A',
        'text-secondary': '#6C757D',
        'text-muted': '#ADB5BD',
      },
    },
  },
};
