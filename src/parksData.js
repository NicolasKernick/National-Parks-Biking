// Sample data for a few national parks. You can expand this or load from an external file/service.
export const parks = [
  {
    name: "Rocky Mountain National Park",
    boundary: {
      "type": "Feature",
      "properties": { "name": "Rocky Mountain National Park" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-105.8, 40.4],
          [-105.5, 40.4],
          [-105.5, 40.2],
          [-105.8, 40.2],
          [-105.8, 40.4]
        ]]
      }
    },
    highPoint: {
      name: "Longs Peak",
      elevation: 14259,
      coordinates: [40.2549, -105.615]
    }
  },
  {
    name: "Yosemite National Park",
    boundary: {
      "type": "Feature",
      "properties": { "name": "Yosemite National Park" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-119.8, 37.9],
          [-119.2, 37.9],
          [-119.2, 37.5],
          [-119.8, 37.5],
          [-119.8, 37.9]
        ]]
      }
    },
    highPoint: {
      name: "Mount Lyell",
      elevation: 13114,
      coordinates: [37.7426, -119.2626]
    }
  },
  {
    name: "Grand Canyon National Park",
    boundary: {
      "type": "Feature",
      "properties": { "name": "Grand Canyon National Park" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-112.5, 36.4],
          [-111.7, 36.4],
          [-111.7, 35.8],
          [-112.5, 35.8],
          [-112.5, 36.4]
        ]]
      }
    },
    highPoint: {
      name: "Grandview Point",
      elevation: 7400,
      coordinates: [36.0544, -112.0931]
    }
  }
]; 