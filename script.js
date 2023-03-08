/*--------------------------------------------------------------------
GGR472 Lab 3, continue building from Lab 2
--------------------------------------------------------------------*/

//Define my access token
mapboxgl.accessToken = 'pk.eyJ1IjoienNnZ3I0NzJoMSIsImEiOiJjbGU2MHQ4ZTYwaTZoM25xbDRnNXNhYWRvIn0.DOkNRgk75AzyG_TGFXMLqA'; //ADD YOUR ACCESS TOKEN HERE

//Initialize my map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/zsggr472h1/cldm11hr0000g01t10scgbyli',
    center:[ -79.37, 43.68 ], //I choose downtown coordiante as my start point.
    zoom: 10.5, //after checking several values, I find that 12 is the most suitable one
                //not zooming too out/in.
});



/*--------------------------------------------------------------------
ADD MAP LAYERS & MAPBOX CONTROLS (AS ELEMENTS) ON MAP
--------------------------------------------------------------------*/
//zoom/rotation controls.
map.addControl(new mapboxgl.NavigationControl());

//fullscreen control to the map
map.addControl(new mapboxgl.FullscreenControl());

//Create geocoder variable
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    countries: "ca"
});

//position geocoder on page by html div
document.getElementById('geocoder').appendChild(geocoder.onAdd(map));


//Add data source and draw initial visiualization of layer
map.on('load', () => {
    //I choose two data sources for my layers, the first one is COVID19 Immunization Clinics in Toronto.
    //And second source is the Fire Station locations in Toronto.
    //both sources come as the GeoJSON files.
    //From City of Toronto Open data Library.

    map.addSource('covid19immclinics', {
        type: 'geojson',
        data: 'https://zs106.github.io/ggr472lab2/covid-19-immunization-clinics.geojson'
   
    });
    map.addSource('firestation', {
        type: 'geojson',
        data: 'https://zs106.github.io/ggr472lab2/fire-station-locations.geojson'
   
    });

    //I draw GeoJSON point geometry as circles
    map.addLayer({
        'id': 'covid19immclinicslayer',
        'type': 'circle',
        'source': 'covid19immclinics',
        'paint': {
            'circle-radius': 5,//5 is suitable radius (not too large/small)
            'circle-color': 'blue' //blue is a typical color for hospital.
        }

    });
    //Draw GeoJSON point geometry as circles
    map.addLayer({
        'id': 'firestationlayer',
        'type': 'circle',
        'source': 'firestation',
        'paint': {
            'circle-radius': 5,
            'circle-color': 'red' //red is a typical color for fire department.
        }

    });


    //this layer is for highlight points of covid19immclinicslayer.
    map.addLayer(
        {
        'id': 'points-highlighted',
        'type': 'circle',
        'source': 'covid19immclinics',
        'paint': {
            'circle-radius': 7,
            'circle-color': 'yellow' //choose yellow to highlight
        },
        'filter': ['in', 'locationId', ''] //filter is a property at the layer level that determines which features should be rendered in a style layer.
        }                                  //In this case, I choose locationId as the determinator.

    );
    


    //I learn how to hightlight the selected point from drawing box from the Mapbox article (see Citation part on my HTML index page)
    const canvas = map.getCanvasContainer(); //Returns the HTMLElement that contains the map's HTMLCanvasElement. 
                                            //The map's events (e.g. panning and zooming) are attached to this element.
 
    // Variable store starting xy coordinates of drawing box
    // when `mousedown` occured.
    let start;    //Start xy coordinates of drawing box for mosue actions
    let current;  //current xy coordinates of drawing box for mosue actions
    let box; // Variable for the draw box element.

    // we must disable box zooming.
    map.boxZoom.disable();

    // Set `true` to dispatch the event before other functions call it.
    //  This is necessary for temporarily disable the map dragging
    canvas.addEventListener('mousedown', mouseDown, true); //attaches an event function

    // Return the xy coordinates of the mouse position
    function mousePos(e) {
        const rect = canvas.getBoundingClientRect(); //rectangular box
        return new mapboxgl.Point( 
            e.clientX - rect.left - canvas.clientLeft, //update position
            e.clientY - rect.top - canvas.clientTop
        );
    }

    function mouseDown(e) {
        // Continue the rest of function if the SHIFT is pressed.
        if (!(e.shiftKey && e.button === 0)) return;

        // Temporarily disable map drag zooming fucntion when the SHIFT is held down.
        map.dragPan.disable();

        // Call functions for the following events
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('keydown', onKeyDown);

        // Capture the first xy coordinates
        start = mousePos(e);
    }

    function onMouseMove(e) {
        // record the ongoing xy coordinates
        current = mousePos(e);

        // Append the box element if it doesnt exist
        if (!box) {
            box = document.createElement('div');
            box.classList.add('boxdraw');
            canvas.appendChild(box);
        }

        const minX = Math.min(start.x, current.x),//initialize the position variable
            maxX = Math.max(start.x, current.x),
            minY = Math.min(start.y, current.y),
            maxY = Math.max(start.y, current.y);

        // Adjust width and xy position of the box element ongoing
        const pos = `translate(${minX}px, ${minY}px)`;
        box.style.transform = pos;
        box.style.width = maxX - minX + 'px';
        box.style.height = maxY - minY + 'px';
    }

    function onMouseUp(e) {
        // record xy coordinates
        finish([start, mousePos(e)]);
    }

    function onKeyDown(e) {
        // If ESC is pressed
        if (e.keyCode === 27) finish();
    }

    function finish(bbox) {
        // Remove these events now that finish has been called.
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('mouseup', onMouseUp);

        if (box) {
            box.parentNode.removeChild(box);
            box = null;
        }

        // If bbox exists. use the 'highlight' layer name for `queryRenderedFeatures` (draw the new feature lawyer) based on original layer.
        if (bbox) {
            const features = map.queryRenderedFeatures(bbox, {
                layers: ['covid19immclinicslayer'] //original layer to highlight.
            });

            // Run through the selected features and set a filter
            // to match features with my filter in this case unique locationId to draw the targeted (selected) part of `points-highlighted` layer.
            const locationid = features.map((feature) => feature.properties.locationId);
            map.setFilter('points-highlighted', ['in', 'locationId', ...locationid]);
        }

        map.dragPan.enable();// restore the map drag zooming fucntion.1
    } 

})



/*--------------------------------------------------------------------
ADD POPUP FUNCTIONS TO THE MAP (MAIN INTERACTIVITY)
--------------------------------------------------------------------*/
//I learn how to display popup message based on selected point from the Mapbox article (see Citation part on my HTML index page)

//Welcoming Popup (include some smaller tutorials).
const popup = new mapboxgl.Popup({ closeOnClick: false })
.setLngLat([-79.1, 43.68]) //postion of Popup.
.setHTML('<h1>Hi!</h1> Welcome to visit this map, <br >you can click on each point to view more information!<br >' + 
            '<h1>Also,</h1> you could also hold SHIFT and moving your mouse to highlight COVID-19 Immunization Clinics. ')
.addTo(map);

// When a click event occurs on a feature in the places layer, open a popup at the
// location of the feature, with description HTML from its properties.

//the first one is the click Popup for the covid-19 immclinic layers points
map.on('click', 'covid19immclinicslayer', (e) => {
    // Copy coordinates array, name array, type array, address array, hours array and info array.
    const coordinates = e.features[0].geometry.coordinates.slice();
    const name = e.features[0].properties.locationName;
    const type = e.features[0].properties.locationType; 
    const address = e.features[0].properties.address;
    const hours = e.features[0].properties.hours;
    const info = e.features[0].properties.info;
    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }
     
    new mapboxgl.Popup()//Popup the targeted message 
    .setLngLat(coordinates)
    .setHTML('NAME: ' + name + ' <br />TYPE: ' + type + ' <br />ADDRESS: ' + address + 
    ' <br />HOURS: <br />' + hours + ' <br />INFOS: <br />' + info)
    .addTo(map);
});
     
    // Change the cursor to a pointer when the mouse is over the places layer.
map.on('mouseenter', 'covid19immclinicslayer', () => {
    map.getCanvas().style.cursor = 'pointer';
});
     
    // Change it back to a pointer when mouse leaves.
map.on('mouseleave', 'covid19immclinicslayer', () => {
    map.getCanvas().style.cursor = '';
});


    //// do the similar thing for the click Popup for the fire station layers points
map.on('click', 'firestationlayer', (e) => {
    // Copy coordinates array, station id, service area, and type arrarys.
    const coordinates = e.features[0].geometry.coordinates.slice();
    const id = e.features[0].properties.ADDRESS_NUMBER;
    const SERVICE = e.features[0].properties.WARD_NAME; 
    const TYPE = e.features[0].properties.TYPE_DESC;
    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }
     
    new mapboxgl.Popup()//Popup the target message.
    .setLngLat(coordinates)
    .setHTML('Station #: ' + id + ' <br />Service Area: ' + SERVICE + ' <br />Type: ' + TYPE)
    .addTo(map);
});
     
    // Change the cursor to a pointer when the mouse is over the places layer.
map.on('mouseenter', 'firestationlayer', () => {
    map.getCanvas().style.cursor = 'pointer';
});
     
    // Change it back to a pointer when it leaves.
map.on('mouseleave', 'firestationlayer', () => {
    map.getCanvas().style.cursor = '';
});

/*--------------------------------------------------------------------
ADD LEGEND TO THE MAP
--------------------------------------------------------------------*/
//Declare arrayy variables for labels and colours
const legendlabels = [
    'COVID-19 Immunization Clinics',
    'Fire Station',
    'Style layer features',
];

const legendcolours = [//lengend colours based on my point color choices above.
    'blue',
    'red',
    'brown',
];

//Declare legend variable using legend div
const legend = document.getElementById('legend');

//For each layer create a block to put the colour and label in
legendlabels.forEach((label, i) => {
    const color = legendcolours[i];

    const item = document.createElement('div'); //each layer gets a 'row'
    const key = document.createElement('span'); //add a 'key' to the row. A key will be the color circle

    key.className = 'legend-key'; //the key will take on the shape and style properties defined in css
    key.style.backgroundColor = color; // the background color is retreived from teh layers array

    const value = document.createElement('span'); //add a value variable to the 'row' in the legend
    value.innerHTML = `${label}`; //give the value variable text based on the label

    item.appendChild(key); //add the key (color cirlce) to the legend row
    item.appendChild(value); //add the value to the legend row

    legend.appendChild(item); //add row to the legend
});



/*--------------------------------------------------------------------
ADD OTHER INTERACTIVITY BASED ON HTML EVENT
--------------------------------------------------------------------*/

//Add event listeneer which returns map view to full screen on button click
document.getElementById('returnbutton').addEventListener('click', () => {
    map.flyTo({
        center:[ -79.37, 43.68 ], //my map start point
        zoom: 10.5,
        essential: true
    });
});

//Change display of legend based on check box
let legendcheck = document.getElementById('legendcheck');

legendcheck.addEventListener('click', () => {//dafault box is checked.
    if (legendcheck.checked) {
        legendcheck.checked = true;
        legend.style.display = 'block';
    }
    else {
        legend.style.display = "none";
        legendcheck.checked = false;
    }
});


//Change map layer display based on check box using setlayoutproperty
//I design so that the user could choose to display each layer independently.
//default boxes are checked.
document.getElementById('layercheck').addEventListener('change', (e) => {
    map.setLayoutProperty(
        'covid19immclinicslayer',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});

document.getElementById('layercheck2').addEventListener('change', (e) => {
    map.setLayoutProperty(
        'firestationlayer',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});


//END OF LAB 3.



