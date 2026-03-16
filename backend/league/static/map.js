window.onload = function() {
    // Log to confirm the script is loaded
    console.log("Initializing map...");

    // Fetch coordinates and polygons from hidden fields
    const coordinates = JSON.parse(document.getElementById('coordinates').value);
    const polygons = JSON.parse(document.getElementById('polygons').value);

    console.log("Coordinates: ", coordinates);
    console.log("Polygons: ", polygons);

    // Check if coordinates and polygons are valid
    if (!coordinates || !coordinates.length) {
        console.log("No valid coordinates to display.");
        return;
    }

    // Initialize the map
    const platform = new H.service.Platform({
        'apikey': '3i6_xUsn7eU66y5VdaXzha5qwP_lFolNDSH9NUuPerc'
    });

    const defaultLayers = platform.createDefaultLayers();
    
    const map = new H.Map(
        document.getElementById('map'),
        defaultLayers.vector.normal.map,
        {
            zoom: 10,
            center: { lat: parseFloat(document.getElementById('latitude').value), lng: parseFloat(document.getElementById('longitude').value) }
        }
    );

    // Add markers
    coordinates.forEach(function(coord) {

        const marker = new H.map.Marker({ lat: coord[0], lng: coord[1] });
        map.addObject(marker);
    });

    // Add polygons
    polygons.forEach(function(polygonCoords) {
        
        const latLngs = polygonCoords.map(function(coord) {
            return { lat: coord[0], lng: coord[1] };
        });
        const polygon = new H.map.Polygon(latLngs);
        map.addObject(polygon);
    });

    // Enable the map's UI (zoom and pan controls)
    const ui = H.ui.UI.createDefault(map, defaultLayers);
    const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
};