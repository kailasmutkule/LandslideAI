const API = 'http://127.0.0.1:8000';

let map;
let mapLayers = [];
let routeLayer = null;
let riskLayers = [];
let incidentLayers = [];


// =====================================================
// NORTH EAST REGION MAP BOUNDS
// =====================================================

const NER_BOUNDS = L.latLngBounds(
    [22.0, 88.0],
    [29.8, 97.5]
);


// =====================================================
// INITIALIZE MAP
// =====================================================

function initMap() {

    map = L.map('map', {

        maxBounds: NER_BOUNDS,

        maxBoundsViscosity: 1.0,

        minZoom: 7,

        maxZoom: 18,

        worldCopyJump: false

    }).setView(
        [25.8, 93.0],
        7
    );


    L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
            maxZoom: 19,

            noWrap: true,

            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(map);


    addMapLegend();
}


// =====================================================
// MAP LEGEND
// =====================================================

function addMapLegend() {

    const legend =
        L.control({
            position: 'bottomright'
        });


    legend.onAdd = function () {

        const div =
            L.DomUtil.create(
                'div',
                'map-legend'
            );


        div.innerHTML = `

            <div class="legend-title">
                NER GIS Map
            </div>

            <div>
                <span class="legend-box location"></span>
                Locations
            </div>

            <div>
                <span class="legend-box road"></span>
                Accessible Road
            </div>

            <div>
                <span class="legend-box blocked"></span>
                Blocked Road
            </div>

            <div>
                <span class="legend-circle low"></span>
                LOW Risk
            </div>

            <div>
                <span class="legend-circle medium"></span>
                MEDIUM Risk
            </div>

            <div>
                <span class="legend-circle high"></span>
                HIGH Risk
            </div>

            <div>
                <span class="legend-circle critical"></span>
                CRITICAL Risk
            </div>

            <hr>

            <div>
                🔴 Landslide
            </div>

            <div>
                🔵 Flood
            </div>

            <div>
                🟠 Road Blockage
            </div>

            <div>
                🟣 Flash Flood
            </div>

            <div>
                🟡 Slope Failure
            </div>

            <div>
                ⚫ Other Incident
            </div>

        `;


        return div;
    };


    legend.addTo(map);
}


// =====================================================
// NER COORDINATE VALIDATION
// =====================================================

function isValidNERCoordinate(lat, lon) {

    return (

        Number.isFinite(lat) &&

        Number.isFinite(lon) &&

        lat >= 20 &&

        lat <= 30 &&

        lon >= 88 &&

        lon <= 98

    );
}


// =====================================================
// CLEAR MAP LAYERS
// =====================================================

function clearMapLayers() {

    mapLayers.forEach(layer => {

        map.removeLayer(layer);

    });

    mapLayers = [];
}


// =====================================================
// CLEAR RISK LAYERS
// =====================================================

function clearRiskLayers() {

    riskLayers.forEach(layer => {

        map.removeLayer(layer);

    });

    riskLayers = [];
}


// =====================================================
// CLEAR INCIDENT LAYERS
// =====================================================

function clearIncidentLayers() {

    incidentLayers.forEach(layer => {

        map.removeLayer(layer);

    });

    incidentLayers = [];
}


// =====================================================
// LOAD MAP DATA
// =====================================================

async function loadMapData() {

    clearMapLayers();


    const points = [];


    try {

        // =================================================
        // LOCATIONS
        // =================================================

        const locationsResponse =
            await fetch(
                `${API}/api/locations`
            );


        if (!locationsResponse.ok) {

            throw new Error(
                `Locations API returned ${locationsResponse.status}`
            );

        }


        const locations =
            await locationsResponse.json();


        locations.forEach(location => {

            const lat =
                Number(location.lat);

            const lon =
                Number(location.lon);


            if (
                !isValidNERCoordinate(
                    lat,
                    lon
                )
            ) {

                console.warn(
                    'Ignoring location outside NER:',
                    location
                );

                return;
            }


            const marker =
                L.marker([
                    lat,
                    lon
                ]);


            marker.bindPopup(`

                <div>

                    <h3>
                        📍 ${location.name || 'Location'}
                    </h3>

                    <b>State:</b>
                    ${location.state || 'N/A'}
                    <br>

                    <b>District:</b>
                    ${location.district || 'N/A'}
                    <br><br>

                    <b>Latitude:</b>
                    ${lat}
                    <br>

                    <b>Longitude:</b>
                    ${lon}

                </div>

            `);


            marker.addTo(map);

            mapLayers.push(marker);

            points.push([
                lat,
                lon
            ]);

        });


        // =================================================
        // ROADS
        // =================================================

        const roadsResponse =
            await fetch(
                `${API}/api/roads`
            );


        if (!roadsResponse.ok) {

            throw new Error(
                `Roads API returned ${roadsResponse.status}`
            );

        }


        const roads =
            await roadsResponse.json();


        roads.forEach(road => {

            const startLat =
                Number(road.start_lat);

            const startLon =
                Number(road.start_lon);

            const endLat =
                Number(road.end_lat);

            const endLon =
                Number(road.end_lon);


            if (

                !isValidNERCoordinate(
                    startLat,
                    startLon
                )

                ||

                !isValidNERCoordinate(
                    endLat,
                    endLon
                )

            ) {

                console.warn(
                    'Ignoring road outside NER:',
                    road
                );

                return;
            }


            const blocked =
                road.is_blocked === true;


            const roadLine =
                L.polyline(

                    [
                        [
                            startLat,
                            startLon
                        ],

                        [
                            endLat,
                            endLon
                        ]
                    ],

                    {

                        weight:
                            blocked
                                ? 7
                                : 4,

                        dashArray:
                            blocked
                                ? '10,10'
                                : null,

                        opacity: 0.85

                    }

                );


            roadLine.bindPopup(`

                <div>

                    <h3>
                        🛣️ ${road.name || 'Road'}
                    </h3>

                    <b>State:</b>
                    ${road.state || 'N/A'}
                    <br>

                    <b>District:</b>
                    ${road.district || 'N/A'}
                    <br>

                    <b>Road Type:</b>
                    ${road.road_type || 'N/A'}
                    <br>

                    <b>Condition:</b>
                    ${road.condition || 'N/A'}
                    <br><br>

                    <b>Status:</b>

                    <strong>

                        ${
                            blocked
                                ? '🚫 BLOCKED'
                                : '✅ OPEN'
                        }

                    </strong>

                </div>

            `);


            roadLine.addTo(map);

            mapLayers.push(
                roadLine
            );


            points.push(
                [
                    startLat,
                    startLon
                ],

                [
                    endLat,
                    endLon
                ]
            );

        });


        // =================================================
        // MAP VIEW
        // =================================================

        if (points.length > 0) {

            const bounds =
                L.latLngBounds(points);


            if (
                NER_BOUNDS.contains(
                    bounds.getNorthEast()
                ) &&

                NER_BOUNDS.contains(
                    bounds.getSouthWest()
                )
            ) {

                map.fitBounds(
                    bounds,
                    {
                        padding: [
                            30,
                            30
                        ],

                        maxZoom: 9
                    }
                );

            } else {

                map.setView(
                    [
                        25.8,
                        93.0
                    ],
                    7
                );

            }

        } else {

            map.setView(
                [
                    25.8,
                    93.0
                ],
                7
            );

        }


    } catch (error) {

        console.error(
            'Map loading error:',
            error
        );


        map.setView(
            [
                25.8,
                93.0
            ],
            7
        );

    }


    await loadRiskZones();

    await loadIncidents();
}


// =====================================================
// AI RISK ZONES
// =====================================================

async function loadRiskZones() {

    clearRiskLayers();


    try {

        const response =
            await fetch(
                `${API}/api/risk/predictions`
            );


        if (!response.ok) {

            throw new Error(
                `Risk API returned ${response.status}`
            );

        }


        const predictions =
            await response.json();


        const latestByLocation = {};


        predictions.forEach(
            prediction => {

                const locationId =
                    prediction.location_id;


                if (

                    !latestByLocation[
                        locationId
                    ]

                    ||

                    new Date(
                        prediction.predicted_at
                    )

                    >

                    new Date(
                        latestByLocation[
                            locationId
                        ].predicted_at
                    )

                ) {

                    latestByLocation[
                        locationId
                    ] = prediction;

                }

            }
        );


        // =================================================
        // LOAD LOCATIONS
        // =================================================

        const locationsResponse =
            await fetch(
                `${API}/api/locations`
            );


        if (!locationsResponse.ok) {

            throw new Error(
                'Unable to load locations'
            );

        }


        const locations =
            await locationsResponse.json();


        const locationMap = {};


        locations.forEach(
            location => {

                locationMap[
                    location.id
                ] = location;

            }
        );


        // =================================================
        // CREATE RISK ZONES
        // =================================================

        Object.values(
            latestByLocation
        ).forEach(
            prediction => {

                const location =
                    locationMap[
                        prediction.location_id
                    ];


                if (!location) {
                    return;
                }


                const lat =
                    Number(location.lat);

                const lon =
                    Number(location.lon);


                if (
                    !isValidNERCoordinate(
                        lat,
                        lon
                    )
                ) {
                    return;
                }


                const riskLevel =
                    String(
                        prediction.risk_level ||
                        'LOW'
                    ).toUpperCase();


                const riskScore =
                    Number(
                        prediction.risk_score ||
                        0
                    );


                const style =
                    getRiskStyle(
                        riskLevel
                    );


                // =================================================
                // RISK AREA
                // =================================================

                const circle =
                    L.circle(
                        [
                            lat,
                            lon
                        ],
                        {

                            radius:
                                getRiskRadius(
                                    riskLevel
                                ),

                            color:
                                style.color,

                            fillColor:
                                style.color,

                            fillOpacity:
                                0.20,

                            weight: 3

                        }
                    );


                circle.addTo(map);


                // =================================================
                // CENTER MARKER
                // =================================================

                const marker =
                    L.circleMarker(
                        [
                            lat,
                            lon
                        ],
                        {

                            radius: 9,

                            color:
                                style.color,

                            fillColor:
                                style.color,

                            fillOpacity: 0.95,

                            weight: 3

                        }
                    );


                marker.addTo(map);


                // =================================================
                // RISK POPUP
                // =================================================

                const popup = `

                    <div style="
                        min-width:240px;
                        line-height:1.5;
                    ">

                        <h3 style="
                            margin:0 0 8px 0;
                        ">
                            🤖 AI Risk Zone
                        </h3>

                        <b>Location:</b>
                        ${location.name || 'Unknown'}
                        <br>

                        <b>District:</b>
                        ${location.district || 'N/A'}
                        <br>

                        <b>State:</b>
                        ${location.state || 'N/A'}

                        <hr>

                        <b>Risk Level:</b>

                        <span style="
                            color:${style.color};
                            font-weight:bold;
                        ">

                            ${riskLevel}

                        </span>

                        <br>

                        <b>Risk Score:</b>
                        ${riskScore.toFixed(2)}
                        / 100

                        <hr>

                        <b>
                            Environmental Data
                        </b>

                        <br>

                        🌧️ Rainfall:
                        ${prediction.rainfall_24h_mm ?? 'N/A'}
                        mm

                        <br>

                        🌡️ Temperature:
                        ${prediction.temperature_c ?? 'N/A'}
                        °C

                        <br>

                        💧 Humidity:
                        ${prediction.humidity_pct ?? 'N/A'}
                        %

                        <br>

                        💨 Wind:
                        ${prediction.wind_speed_kmh ?? 'N/A'}
                        km/h

                        <br>

                        Pressure:
                        ${prediction.pressure_hpa ?? 'N/A'}
                        hPa

                        <hr>

                        <b>AI Model:</b>
                        ${prediction.model_version || 'N/A'}

                        <br>

                        <small>
                            Updated:
                            ${formatDate(
                                prediction.predicted_at
                            )}
                        </small>

                    </div>

                `;


                circle.bindPopup(
                    popup
                );

                marker.bindPopup(
                    popup
                );


                riskLayers.push(
                    circle
                );

                riskLayers.push(
                    marker
                );

            }
        );


        console.log(
            'AI risk zones loaded:',
            Object.keys(
                latestByLocation
            ).length
        );


    } catch (error) {

        console.error(
            'Risk zone loading error:',
            error
        );

    }
}


// =====================================================
// RISK STYLE
// =====================================================

function getRiskStyle(level) {

    switch (level) {

        case 'LOW':

            return {
                color: '#22c55e'
            };


        case 'MEDIUM':

            return {
                color: '#eab308'
            };


        case 'HIGH':

            return {
                color: '#f97316'
            };


        case 'CRITICAL':

            return {
                color: '#ef4444'
            };


        default:

            return {
                color: '#6b7280'
            };

    }
}


// =====================================================
// RISK RADIUS
// =====================================================

function getRiskRadius(level) {

    switch (level) {

        case 'LOW':
            return 400;

        case 'MEDIUM':
            return 600;

        case 'HIGH':
            return 900;

        case 'CRITICAL':
            return 1200;

        default:
            return 500;

    }

}


// =====================================================
// INCIDENT MARKER STYLE
// =====================================================

function getIncidentStyle(type) {

    const incidentType =
        String(type || 'OTHER')
            .toUpperCase()
            .replace(/[-_\s]+/g, ' ');


    if (
        incidentType.includes('LANDSLIDE')
    ) {

        return {
            color: '#dc2626',
            icon: '🔴',
            label: 'LANDSLIDE'
        };

    }


    if (
        incidentType.includes('FLOOD')
        &&
        incidentType.includes('FLASH')
    ) {

        return {
            color: '#7c3aed',
            icon: '🟣',
            label: 'FLASH FLOOD'
        };

    }


    if (
        incidentType.includes('FLOOD')
    ) {

        return {
            color: '#2563eb',
            icon: '🔵',
            label: 'FLOOD'
        };

    }


    if (
        incidentType.includes('ROAD')
        &&
        (
            incidentType.includes('BLOCK')
            ||
            incidentType.includes('BLOCKAGE')
        )
    ) {

        return {
            color: '#f97316',
            icon: '🟠',
            label: 'ROAD BLOCKAGE'
        };

    }


    if (
        incidentType.includes('SLOPE')
    ) {

        return {
            color: '#eab308',
            icon: '🟡',
            label: 'SLOPE FAILURE'
        };

    }


    return {
        color: '#374151',
        icon: '⚫',
        label: incidentType || 'OTHER'
    };

}


// =====================================================
// INCIDENT MARKER
// =====================================================

function createIncidentMarker(
    incident,
    location
) {

    const lat =
        Number(
            incident.lat ??
            incident.latitude ??
            location?.lat
        );


    const lon =
        Number(
            incident.lon ??
            incident.longitude ??
            location?.lon
        );


    if (
        !isValidNERCoordinate(
            lat,
            lon
        )
    ) {

        console.warn(
            'Ignoring incident outside NER:',
            incident
        );

        return null;
    }


    const type =
        incident.incident_type ??
        incident.type ??
        incident.category ??
        incident.disaster_type ??
        'OTHER';


    const style =
        getIncidentStyle(
            type
        );


    const severity =
        String(
            incident.severity ||
            'UNKNOWN'
        ).toUpperCase();


    const status =
        String(
            incident.status ||
            'UNKNOWN'
        ).toUpperCase();


    const marker =
        L.circleMarker(
            [
                lat,
                lon
            ],
            {

                radius: 10,

                color: style.color,

                fillColor: style.color,

                fillOpacity: 0.95,

                weight: 3

            }
        );


    const locationName =
        location?.name ||
        incident.location_name ||
        'Unknown Location';


    const description =
        incident.description ||
        incident.details ||
        incident.message ||
        'No description available.';


    marker.bindPopup(`

        <div style="
            min-width:250px;
            line-height:1.5;
        ">

            <h3 style="
                margin:0 0 8px 0;
            ">

                ${style.icon}
                ${style.label}

            </h3>

            <b>Location:</b>
            ${locationName}

            <br>

            <b>District:</b>
            ${location?.district || 'N/A'}

            <br>

            <b>State:</b>
            ${location?.state || 'N/A'}

            <hr>

            <b>Severity:</b>

            <span style="
                font-weight:bold;
                color:${style.color};
            ">

                ${severity}

            </span>

            <br>

            <b>Status:</b>
            ${status}

            <hr>

            <b>Description:</b>

            <br>

            ${description}

            <hr>

            <b>Coordinates:</b>
            ${lat.toFixed(5)},
            ${lon.toFixed(5)}

            ${
                incident.created_at
                    ?

                    `<br><br>
                    <small>
                        Reported:
                        ${formatDate(
                            incident.created_at
                        )}
                    </small>`

                    : ''
            }

        </div>

    `);


    marker.addTo(map);


    return marker;
}


// =====================================================
// LOAD INCIDENTS
// =====================================================

async function loadIncidents() {

    clearIncidentLayers();


    try {

        const response =
            await fetch(
                `${API}/api/incidents`
            );


        if (!response.ok) {

            throw new Error(
                `Incidents API returned ${response.status}`
            );

        }


        const incidents =
            await response.json();


        if (!Array.isArray(incidents)) {

            console.warn(
                'Unexpected incidents API response:',
                incidents
            );

            return;
        }


        // =================================================
        // LOAD LOCATIONS
        // =================================================

        const locationsResponse =
            await fetch(
                `${API}/api/locations`
            );


        if (!locationsResponse.ok) {

            throw new Error(
                'Unable to load locations for incidents'
            );

        }


        const locations =
            await locationsResponse.json();


        const locationMap = {};


        locations.forEach(
            location => {

                locationMap[
                    location.id
                ] = location;

            }
        );


        // =================================================
        // CREATE INCIDENT MARKERS
        // =================================================

        incidents.forEach(
            incident => {

                const location =
                    locationMap[
                        incident.location_id
                    ];


                const marker =
                    createIncidentMarker(
                        incident,
                        location
                    );


                if (marker) {

                    incidentLayers.push(
                        marker
                    );

                }

            }
        );


        console.log(
            'Incident markers loaded:',
            incidentLayers.length
        );


    } catch (error) {

        console.error(
            'Incident loading error:',
            error
        );

    }

}


// =====================================================
// DATE FORMAT
// =====================================================

function formatDate(dateString) {

    if (!dateString) {
        return 'N/A';
    }


    const date =
        new Date(dateString);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateString;

    }


    return date.toLocaleString();
}


// =====================================================
// DASHBOARD SUMMARY
// =====================================================

async function loadSummary() {

    try {

        const response =
            await fetch(
                `${API}/api/dashboard/summary`
            );


        if (!response.ok) {

            throw new Error(
                `Summary API returned ${response.status}`
            );

        }


        const data =
            await response.json();


        updateElement(
            'system-status',
            data.system_status
        );


        updateElement(
            'total-locations',
            data.total_monitored_locations
        );


        updateElement(
            'total-roads',
            data.total_roads
        );


        updateElement(
            'blocked-roads',
            data.blocked_roads
        );


        updateElement(
            'active-alerts',
            data.active_alerts ?? 0
        );


    } catch (error) {

        console.error(
            'Summary loading error:',
            error
        );

    }
}


// =====================================================
// ALERTS
// =====================================================

async function loadAlerts() {

    try {

        const response =
            await fetch(
                `${API}/api/alerts`
            );


        if (!response.ok) {

            throw new Error(
                `Alerts API returned ${response.status}`
            );

        }


        const alerts =
            await response.json();


        const container =
            document.getElementById(
                'alerts-container'
            );


        if (!container) {
            return;
        }


        container.innerHTML = '';


        if (!alerts.length) {

            container.innerHTML = `

                <div class="empty-state">
                    No active alerts
                </div>

            `;

            return;
        }


        alerts.forEach(
            alert => {

                const div =
                    document.createElement(
                        'div'
                    );


                div.className =
                    'alert-card';


                div.innerHTML = `

                    <strong>
                        ${alert.severity || 'ALERT'}
                    </strong>

                    <div>
                        ${alert.title || 'Risk Alert'}
                    </div>

                    <small>
                        ${alert.message || ''}
                    </small>

                `;


                container.appendChild(
                    div
                );

            }
        );


    } catch (error) {

        console.error(
            'Alerts loading error:',
            error
        );

    }
}


// =====================================================
// UPDATE ELEMENT
// =====================================================

function updateElement(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value ?? 0;

    }
}


// =====================================================
// ROUTE PLANNER
// =====================================================

async function planRoute() {

    const startLat =
        Number(
            document.getElementById(
                'start-lat'
            )?.value
        );


    const startLon =
        Number(
            document.getElementById(
                'start-lon'
            )?.value
        );


    const destinationLat =
        Number(
            document.getElementById(
                'destination-lat'
            )?.value
        );


    const destinationLon =
        Number(
            document.getElementById(
                'destination-lon'
            )?.value
        );


    const emergency =
        document.getElementById(
            'emergency'
        )?.checked || false;


    if (

        !isValidNERCoordinate(
            startLat,
            startLon
        )

        ||

        !isValidNERCoordinate(
            destinationLat,
            destinationLon
        )

    ) {

        alert(
            'Please enter valid coordinates within the North Eastern Region.'
        );

        return;
    }


    try {

        const response =
            await fetch(
                `${API}/api/routes/plan`,
                {

                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({

                            start_lat:
                                startLat,

                            start_lon:
                                startLon,

                            destination_lat:
                                destinationLat,

                            destination_lon:
                                destinationLon,

                            emergency:
                                emergency

                        })

                }
            );


        if (!response.ok) {

            const errorText =
                await response.text();


            throw new Error(
                errorText
            );

        }


        const data =
            await response.json();


        console.log(
            'Route result:',
            data
        );


        // =================================================
        // REMOVE OLD ROUTE
        // =================================================

        if (routeLayer) {

            map.removeLayer(
                routeLayer
            );

            routeLayer = null;

        }


        // =================================================
        // DRAW MAPBOX ROUTE
        // =================================================

        if (

            data.mapbox_geometry &&

            data.mapbox_geometry.coordinates

        ) {

            const coordinates =
                data.mapbox_geometry.coordinates.map(
                    coord => [
                        coord[1],
                        coord[0]
                    ]
                );


            routeLayer =
                L.polyline(
                    coordinates,
                    {

                        weight: 6,

                        opacity: 0.9

                    }
                );


            routeLayer.addTo(
                map
            );


            map.fitBounds(
                routeLayer.getBounds(),
                {
                    padding: [
                        30,
                        30
                    ]
                }
            );

        }


        // =================================================
        // START MARKER
        // =================================================

        const startMarker =
            L.circleMarker(
                [
                    startLat,
                    startLon
                ],
                {

                    radius: 8,

                    weight: 3,

                    fillOpacity: 1

                }
            );


        startMarker
            .addTo(map)
            .bindPopup(
                '🚚 Route Start'
            );


        mapLayers.push(
            startMarker
        );


        // =================================================
        // DESTINATION MARKER
        // =================================================

        const destinationMarker =
            L.circleMarker(
                [
                    destinationLat,
                    destinationLon
                ],
                {

                    radius: 8,

                    weight: 3,

                    fillOpacity: 1

                }
            );


        destinationMarker
            .addTo(map)
            .bindPopup(
                '🎯 Destination'
            );


        mapLayers.push(
            destinationMarker
        );


        // =================================================
        // GOOGLE MAPS
        // =================================================

        try {

            const googleResponse =
                await fetch(
                    `${API}/api/integrations/google-maps/url`,
                    {

                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify({

                                start_lat:
                                    startLat,

                                start_lon:
                                    startLon,

                                destination_lat:
                                    destinationLat,

                                destination_lon:
                                    destinationLon

                            })

                    }
                );


            if (
                googleResponse.ok
            ) {

                const googleData =
                    await googleResponse.json();


                const googleButton =
                    document.getElementById(
                        'google-maps-link'
                    );


                if (googleButton) {

                    googleButton.href =
                        googleData.url;

                    googleButton.target =
                        '_blank';

                    googleButton.style.display =
                        'inline-block';

                }

            }


        } catch (googleError) {

            console.error(
                'Google Maps error:',
                googleError
            );

        }


        displayRouteResult(
            data
        );


    } catch (error) {

        console.error(
            'Route planning error:',
            error
        );


        alert(
            'Unable to plan route. Check backend.'
        );

    }
}


// =====================================================
// DISPLAY ROUTE RESULT
// =====================================================

function displayRouteResult(data) {

    const container =
        document.getElementById(
            'route-result'
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="route-result-card">

            <h3>
                🚚 Smart Route
            </h3>

            <p>
                <b>Status:</b>
                ${data.status || 'N/A'}
            </p>

            <p>
                <b>Distance:</b>
                ${data.total_distance_km ?? 'N/A'}
                km
            </p>

            <p>
                <b>Roads:</b>
                ${data.road_count ?? 'N/A'}
            </p>

            <p>
                <b>Route Score:</b>
                ${data.route_score ?? 'N/A'}
            </p>

            <p>
                <b>Risk Level:</b>
                ${data.route_risk_level || 'N/A'}
            </p>

            ${
                data.mapbox_distance_km != null

                ?

                `

                    <hr>

                    <p>

                        <b>
                            Mapbox Distance:
                        </b>

                        ${data.mapbox_distance_km}
                        km

                    </p>

                    <p>

                        <b>
                            Estimated Time:
                        </b>

                        ${data.mapbox_duration_minutes}
                        min

                    </p>

                `

                : ''
            }


            ${
                data.recommendation

                ?

                `

                    <p>

                        <b>
                            Recommendation:
                        </b>

                        <br>

                        ${data.recommendation}

                    </p>

                `

                : ''
            }

        </div>

    `;
}


// =====================================================
// NASA SEARCH
// =====================================================

async function searchNASA() {

    const keyword =
        document.getElementById(
            'nasa-keyword'
        )?.value ||

        'landslide';


    try {

        const response =
            await fetch(
                `${API}/api/integrations/nasa/search?keyword=${encodeURIComponent(keyword)}&page_size=10`
            );


        if (!response.ok) {

            throw new Error(
                `NASA API returned ${response.status}`
            );

        }


        const data =
            await response.json();


        const container =
            document.getElementById(
                'nasa-results'
            );


        if (!container) {
            return;
        }


        container.innerHTML = '';


        if (
            !data.items ||
            !data.items.length
        ) {

            container.innerHTML = `

                <div class="empty-state">
                    No NASA datasets found.
                </div>

            `;

            return;
        }


        data.items.forEach(
            item => {

                const div =
                    document.createElement(
                        'div'
                    );


                div.className =
                    'nasa-result-card';


                div.innerHTML = `

                    <h4>
                        ${item.title || 'NASA Dataset'}
                    </h4>

                    <p>
                        ${item.summary || ''}
                    </p>

                    ${
                        item.online_access_url

                        ?

                        `

                            <a
                                href="${item.online_access_url}"
                                target="_blank"
                            >
                                View Dataset
                            </a>

                        `

                        : ''
                    }

                `;


                container.appendChild(
                    div
                );

            }
        );


    } catch (error) {

        console.error(
            'NASA search error:',
            error
        );

    }
}


// =====================================================
// REFRESH DASHBOARD
// =====================================================

async function refreshDashboard() {

    await loadSummary();

    await loadMapData();

    await loadAlerts();

}


// =====================================================
// PAGE START
// =====================================================

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        initMap();

        await refreshDashboard();


        // =================================================
        // ROUTE BUTTON
        // =================================================

        const routeButton =
            document.getElementById(
                'plan-route'
            );


        if (routeButton) {

            routeButton.addEventListener(
                'click',
                planRoute
            );

        }


        // =================================================
        // NASA BUTTON
        // =================================================

        const nasaButton =
            document.getElementById(
                'nasa-search'
            );


        if (nasaButton) {

            nasaButton.addEventListener(
                'click',
                searchNASA
            );

        }


        // =================================================
        // AUTO REFRESH
        // =================================================

        setInterval(
            refreshDashboard,
            30000
        );

    }
);