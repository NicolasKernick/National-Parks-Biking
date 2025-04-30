# US National Parks Explorer

An interactive map application for exploring US National Parks, featuring:
- Topographic visualization of all US National Parks
- Highest peaks and elevations for each park
- Bike route planning between parks
- Distance and elevation gain calculations for routes

## Features
- 🗺️ Interactive map with park boundaries
- 🏔️ Highest peak information for each park
- 🚲 Bike route planning between visitor centers
- 📏 Distance and elevation calculations
- 🎯 Park selection and route visualization

## Technologies Used
- React
- Leaflet (react-leaflet)
- OpenRouteService API for routing
- OpenTopoMap for base layer
- Turf.js for geospatial calculations

## Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with your OpenRouteService API key:
   ```
   VITE_ORS_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage
- Click on any park label to select it
- Select two parks to calculate a bike route between them
- View route distance and elevation gain in the info panel
- Click park labels for detailed information about each park

## Data Sources
- National Park boundaries: GeoJSON data
- Visitor center locations: Manually curated dataset
- Peak elevations: Compiled from official National Park Service data

## License
MIT License
