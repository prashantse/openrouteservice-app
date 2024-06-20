
const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;
const orsApiKey = "5b3ce3597851110001cf624886d287ad988d41008c15517bac6a2327";

app.get('/travel-time', async (req, res) => {
    const { origin, destination } = req.query;
  
    if (!origin || !destination) {
      return res.status(400).send('Origin and destination coordinates are required');
    }
  
    const [originLat, originLng] = origin.split(',').map(Number);
    const [destinationLat, destinationLng] = destination.split(',').map(Number);
  
    if (!originLat || !originLng || !destinationLat || !destinationLng) {
      return res.status(400).send('Invalid coordinates format. Use "lat,lng"');
    }
  
    try {
      const response = await axios.get(`https://api.openrouteservice.org/v2/directions/driving-car`, {
        params: {
          api_key: orsApiKey,
          start: `${originLng},${originLat}`,
          end: `${destinationLng},${destinationLat}`
        }
      });
  
      const data = response.data;
      const travelTime = data.features[0].properties.segments[0].duration; // Duration in seconds
      const travelDistance = data.features[0].properties.segments[0].distance; // Distance in meters
  
      res.json({
        travelTimeHours: ((travelTime)/60)/60,
        travelDistanceKM: travelDistance/1000
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error calculating travel time');
    }
  });


app.get('/route', async (req, res) => {
  const { locations } = req.query;

  if (!locations) {
    return res.status(400).send('Locations parameter is required');
  }

  const coordinates = locations.split('|').map(loc => loc.split(',').map(Number));
  
  if (coordinates.length < 2) {
    return res.status(400).send('At least two locations are required');
  }

  try {
    const response = await axios.post('https://api.openrouteservice.org/v2/directions/driving-car', {
        coordinates: coordinates
      }, {
        headers: {
          'Authorization': orsApiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status !== 200) {
        return res.status(500).send('Error fetching data from OpenRouteService API');
      }
      
      const route = response.data.routes[0];
      if (!route) {
        return res.status(500).send('No route found');
      }
      
      const travelTime = route.summary.duration; // Duration in seconds
      const travelDistance = route.summary.distance; // Distance in meters
            
      res.json({
        travelTimeSeconds: travelTime,
        travelDistanceMeters: travelDistance,
      });
      
  } catch (error) {
    console.error(error);
    res.status(500).send('Error calculating route');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
