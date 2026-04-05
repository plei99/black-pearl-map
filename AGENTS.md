# AGENTS.md - Project Context

## Overview
This project is a web app for finding Black Pearl (黑珍珠) restaurants in China, featuring filtering by cost, distance, and cuisine, along with map integration.

## Guidelines for AI Agents (Claude Code / Codex)
- **Stack**: Use React (Vite) + Tailwind CSS for a fast, modern pure web app.
- **Design**: Mobile-first design (since users will look for restaurants on their phones on the go).
- **Maps**: Use Google Maps (`@vis.gl/react-google-maps`) for mapping. API key via `VITE_GOOGLE_MAPS_API_KEY` env var.
- **Data**: Create placeholder static JSON data for a few sample Black Pearl restaurants (e.g., in Shanghai or Beijing). Schema should include: `id`, `name`, `cuisine`, `cost_per_person`, `location` (lat/lng), `city`, and `diamonds` (1, 2, or 3).
- **Anti-Scraping**: Do not attempt to write live scrapers for Meituan/Dianping; stick to static data loading for the MVP.
- **Hosting**: Ensure the configuration is standard and Netlify-compatible.