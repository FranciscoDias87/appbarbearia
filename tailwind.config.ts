import type { Config } from 'tailwindcss';
const config: Config = { content: ['./src/**/*.{js,ts,jsx,tsx}'], theme: { extend: { colors: { ink: '#15120f', leather: '#a76535', cream: '#f6f0e7', gold: '#d69d45' }, boxShadow: { warm: '0 14px 40px rgba(57,35,20,.12)' } } }, plugins: [] };
export default config;
