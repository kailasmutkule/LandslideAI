// MOCK DATA — replace by setting VITE_USE_MOCK_DATA=false once backend is live
/**
 * LANDSLIDE AI - Mock API Service Layer
 * Simulates the SIH26001 FastAPI Backend and ML Inference engine.
 * Implements identical signatures to api.ts.
 */

import type {
  RiskLocation,
  Alert,
  SensorItem,
  TimeSeriesDataPoint,
  HistoricalLandslideRecord,
  HistoricalYearSummary,
  SystemHealth,
  PredictionRequest,
  PredictionResult,
  ReportType,
  GeneratedReport,
  LoginCredentials,
  AuthUser
} from '../types';
import type { LocationFilters, AlertFilters, SensorFilters, HistoricalFilters } from './api';

// =========================================================================
// 1. INITIAL 18 REALISTIC NORTH EASTERN REGION LOCATIONS
// =========================================================================
let locationsState: RiskLocation[] = [
  {
    id: "loc-sk-01",
    location: "Gangtok – 9th Mile (NH-10 Corridor)",
    state: "Sikkim",
    district: "East Sikkim",
    latitude: 27.3389,
    longitude: 88.6065,
    elevation: 1650,
    riskScore: 89,
    probability: 88,
    confidence: 94,
    rainfall24h: 142.5,
    soilMoisture: 88.2,
    slope: 44.5,
    groundSaturation: 91.0,
    vegetationLoss: 42.0,
    riskLevel: "Critical",
    trend: "Rising",
    expectedWindow: "3-6 Hours",
    primaryTrigger: "Continuous Heavy Rainfall (>140mm) & Toe Cutting",
    recommendedAction: "Halt heavy vehicles on NH-10. Activate SDRF sector platoon.",
    lastUpdated: new Date().toISOString(),
    historicalIncidentsCount: 14,
    lastMajorIncident: "July 2023 (Major Road Blockage, 48h)",
    predictionTimeline: [
      { time: "Now", label: "Current", score: 89, rainfall: 142.5, moisture: 88.2 },
      { time: "+6h", label: "Evening", score: 92, rainfall: 165.0, moisture: 92.4 },
      { time: "+12h", label: "Midnight", score: 94, rainfall: 180.0, moisture: 95.0 },
      { time: "+24h", label: "Tomorrow", score: 78, rainfall: 65.0, moisture: 89.0 },
      { time: "+48h", label: "+2 Days", score: 55, rainfall: 22.0, moisture: 78.5 }
    ],
    sopSteps: [
      "1. Issue Immediate Flash Broadcast via SDMA SatCom relay.",
      "2. Alert Border Roads Organisation (Project Swastik) for heavy clearing equipment standby.",
      "3. Divert Gangtok-bound civil traffic via Lava-Algarah route.",
      "4. Sound village early warning sirens at Singtam and Rangpo checkpoints."
    ],
    factors: [
      { factor: "Rainfall 24h", label: "Antecedent 24h Rainfall", value: "142.5 mm", contribution_percentage: 42, is_critical_driver: true },
      { factor: "Slope Angle", label: "Critical Slope Angle", value: "44.5°", contribution_percentage: 26, is_critical_driver: true },
      { factor: "Soil Saturation", label: "Pore Water Saturation", value: "88.2%", contribution_percentage: 18, is_critical_driver: false },
      { factor: "Vegetation Scarp", label: "Recent NDVI Scarp Loss", value: "42.0%", contribution_percentage: 14, is_critical_driver: false }
    ]
  },
  {
    id: "loc-sk-02",
    location: "Dzongu Valley (Passingdang Scarp)",
    state: "Sikkim",
    district: "North Sikkim",
    latitude: 27.5312,
    longitude: 88.5412,
    elevation: 2100,
    riskScore: 84,
    probability: 82,
    confidence: 91,
    rainfall24h: 128.0,
    soilMoisture: 84.5,
    slope: 52.0,
    groundSaturation: 86.5,
    vegetationLoss: 38.5,
    riskLevel: "Critical",
    trend: "Rising",
    expectedWindow: "6-12 Hours",
    primaryTrigger: "Perched Debris Runoff & Teesta Tributary Swell",
    recommendedAction: "Pre-position civil defense teams. Precautionary valley evacuation.",
    lastUpdated: new Date().toISOString(),
    historicalIncidentsCount: 9,
    lastMajorIncident: "Oct 2023 (Teesta Flash Surge & Glacial Overspill)",
    predictionTimeline: [
      { time: "Now", label: "Current", score: 84, rainfall: 128.0, moisture: 84.5 },
      { time: "+6h", label: "Evening", score: 87, rainfall: 145.0, moisture: 88.0 },
      { time: "+12h", label: "Midnight", score: 85, rainfall: 110.0, moisture: 87.0 },
      { time: "+24h", label: "Tomorrow", score: 68, rainfall: 45.0, moisture: 79.0 },
      { time: "+48h", label: "+2 Days", score: 48, rainfall: 15.0, moisture: 68.0 }
    ],
    sopSteps: [
      "1. Alert North Sikkim District Magistrate and Mangan Disaster Cell.",
      "2. Monitor InSAR corner reflector displacement rate.",
      "3. Open emergency radio communication channel via wireless police net."
    ],
    factors: [
      { factor: "Slope Angle", label: "Extremely Steep Scarp", value: "52.0°", contribution_percentage: 38, is_critical_driver: true },
      { factor: "Rainfall 24h", label: "High Himalayan Rainfall", value: "128.0 mm", contribution_percentage: 34, is_critical_driver: true },
      { factor: "Soil Moisture", label: "Saturated Colluvium", value: "84.5%", contribution_percentage: 28, is_critical_driver: false }
    ]
  },
  {
    id: "loc-mz-01",
    location: "Aizawl West – Hunthar Subsidence Zone",
    state: "Mizoram",
    district: "Aizawl",
    latitude: 23.7271,
    longitude: 92.7176,
    elevation: 1132,
    riskScore: 92,
    probability: 91,
    confidence: 96,
    rainfall24h: 168.0,
    soilMoisture: 93.4,
    slope: 39.0,
    groundSaturation: 94.0,
    vegetationLoss: 55.0,
    riskLevel: "Critical",
    trend: "Rising",
    expectedWindow: "Immediate (<3h)",
    primaryTrigger: "Prolonged Storm + Urban Drainage Surcharge",
    recommendedAction: "Order immediate evacuation of 45 vulnerable households in Sector 3.",
    lastUpdated: new Date().toISOString(),
    historicalIncidentsCount: 22,
    lastMajorIncident: "May 2024 (Cyclone Remal Remnants, 14 Houses Damaged)",
    predictionTimeline: [
      { time: "Now", label: "Current", score: 92, rainfall: 168.0, moisture: 93.4 },
      { time: "+6h", label: "Evening", score: 95, rainfall: 195.0, moisture: 96.0 },
      { time: "+12h", label: "Midnight", score: 91, rainfall: 140.0, moisture: 94.0 },
      { time: "+24h", label: "Tomorrow", score: 72, rainfall: 50.0, moisture: 82.0 },
      { time: "+48h", label: "+2 Days", score: 45, rainfall: 10.0, moisture: 70.0 }
    ],
    sopSteps: [
      "1. Activate Aizawl District Emergency Operations Centre (DEOC).",
      "2. Police siren dispatch and public address vans deployed to Hunthar.",
      "3. Close Hunthar road bypass; reroute through Durtlang.",
      "4. Setup emergency shelter at Govt Mizo High School relief camp."
    ],
    factors: [
      { factor: "Rainfall 24h", label: "Continuous Monsoon Downpour", value: "168.0 mm", contribution_percentage: 45, is_critical_driver: true },
      { factor: "Drainage Saturation", label: "Perched Water Table", value: "93.4%", contribution_percentage: 30, is_critical_driver: true },
      { factor: "Historical Active Creep", label: "InSAR Surface Creep", value: "3.2 mm/day", contribution_percentage: 25, is_critical_driver: false }
    ]
  },
  {
    id: "loc-nl-01",
    location: "Kohima – Zubza Section (NH-29 Bypass)",
    state: "Nagaland",
    district: "Kohima",
    latitude: 25.6751,
    longitude: 94.1086,
    elevation: 1444,
    riskScore: 78,
    probability: 76,
    confidence: 88,
    rainfall24h: 96.0,
    soilMoisture: 79.2,
    slope: 36.8,
    groundSaturation: 82.0,
    vegetationLoss: 31.0,
    riskLevel: "High",
    trend: "Rising",
    expectedWindow: "12-24 Hours",
    primaryTrigger: "Road Cutting Surcharge & Continuous Drizzle",
    recommendedAction: "BRO Task Force patrol on alert. Impose night travel advisory.",
    lastUpdated: new Date().toISOString(),
    historicalIncidentsCount: 16,
    lastMajorIncident: "Aug 2023 (Debris blocked Dimapur supply corridor)",
    predictionTimeline: [
      { time: "Now", label: "Current", score: 78, rainfall: 96.0, moisture: 79.2 },
      { time: "+6h", label: "Evening", score: 81, rainfall: 110.0, moisture: 82.0 },
      { time: "+12h", label: "Midnight", score: 84, rainfall: 125.0, moisture: 85.0 },
      { time: "+24h", label: "Tomorrow", score: 70, rainfall: 40.0, moisture: 75.0 },
      { time: "+48h", label: "+2 Days", score: 50, rainfall: 15.0, moisture: 64.0 }
    ],
    sopSteps: [
      "1. Notice to Nagaland State Disaster Management Authority (NSDMA).",
      "2. Restrict commercial multi-axle freight between 20:00 and 06:00.",
      "3. Earth-moving machinery positioned at Old Kahu bridge."
    ],
    factors: [
      { factor: "Rainfall", label: "72h Cumulative Rainfall", value: "192 mm", contribution_percentage: 36, is_critical_driver: true },
      { factor: "Slope", label: "Cut-Slope Instability", value: "36.8°", contribution_percentage: 34, is_critical_driver: true },
      { factor: "Saturation", label: "Clay-Shale Subsoil", value: "79.2%", contribution_percentage: 30, is_critical_driver: false }
    ]
  },
  {
    id: "loc-ml-01",
    location: "Cherrapunji – Mawkdok Dympep Valley",
    state: "Meghalaya",
    district: "East Khasi Hills",
    latitude: 25.3524,
    longitude: 91.7341,
    elevation: 1300,
    riskScore: 74,
    probability: 71,
    confidence: 93,
    rainfall24h: 215.0,
    soilMoisture: 89.0,
    slope: 41.2,
    groundSaturation: 90.5,
    vegetationLoss: 18.0,
    riskLevel: "High",
    trend: "Stable",
    expectedWindow: "12-24 Hours",
    primaryTrigger: "World-Record Monsoon Plume (215mm/24h)",
    recommendedAction: "Inspect culverts along Sohra-Shillong corridor.",
    lastUpdated: new Date().toISOString(),
    historicalIncidentsCount: 31,
    lastMajorIncident: "June 2022 (Massive Limestone Escarpment Rockfall)",
    predictionTimeline: [
      { time: "Now", label: "Current", score: 74, rainfall: 215.0, moisture: 89.0 },
      { time: "+6h", label: "Evening", score: 76, rainfall: 230.0, moisture: 90.0 },
      { time: "+12h", label: "Midnight", score: 75, rainfall: 190.0, moisture: 89.0 },
      { time: "+24h", label: "Tomorrow", score: 62, rainfall: 80.0, moisture: 80.0 },
      { time: "+48h", label: "+2 Days", score: 42, rainfall: 30.0, moisture: 65.0 }
    ],
    sopSteps: [
      "1. Continuous telemetry check on automatic tipping bucket rain gauges.",
      "2. Issue landslide advisory to East Khasi Hills District Commissioner.",
      "3. Drone survey of Mawkdok bridge foundations."
    ],
    factors: [
      { factor: "Precipitation", label: "Extreme Cloudburst Volume", value: "215.0 mm", contribution_percentage: 55, is_critical_driver: true },
      { factor: "Sandstone Joints", label: "Fractured Joint Planes", value: "Grade IV", contribution_percentage: 25, is_critical_driver: false },
      { factor: "Slope", label: "Gorge Wall Gradient", value: "41.2°", contribution_percentage: 20, is_critical_driver: false }
    ]
  },
  {
    id: "loc-ar-01",
    location: "Tawang – Sela Pass Approach Road",
    state: "Arunachal Pradesh",
    district: "Tawang",
    latitude: 27.5861,
    longitude: 91.8594,
    elevation: 3400,
    riskScore: 71,
    probability: 69,
    confidence: 86,
    rainfall24h: 62.0,
    soilMoisture: 72.5,
    slope: 48.0,
    groundSaturation: 75.0,
    vegetationLoss: 22.0,
    riskLevel: "High",
    trend: "Rising",
    expectedWindow: "24-48 Hours",
    primaryTrigger: "Freeze-Thaw Rock Splitting & Sleet Runoff",
    recommendedAction: "Issue high-altitude convoy advisory to Indian Army / BRO.",
    lastUpdated: new Date().toISOString(),
    historicalIncidentsCount: 8,
    lastMajorIncident: "April 2024 (Rockfall blocked Sela Tunnel western portal)",
    predictionTimeline: [
      { time: "Now", label: "Current", score: 71, rainfall: 62.0, moisture: 72.5 },
      { time: "+6h", label: "Evening", score: 73, rainfall: 75.0, moisture: 74.0 },
      { time: "+12h", label: "Midnight", score: 75, rainfall: 80.0, moisture: 76.0 },
      { time: "+24h", label: "Tomorrow", score: 65, rainfall: 30.0, moisture: 68.0 },
      { time: "+48h", label: "+2 Days", score: 45, rainfall: 10.0, moisture: 55.0 }
    ],
    sopSteps: [
      "1. Notify Project Vartak (BRO) emergency snow and rock clearing units.",
      "2. Monitor Sela tunnel approach sensor telemetry."
    ],
    factors: [
      { factor: "Permafrost / Slope", label: "Steep High-Alpine Escarpment", value: "48.0°", contribution_percentage: 40, is_critical_driver: true },
      { factor: "Sleet / Rain", label: "Meltwater Surcharge", value: "62.0 mm", contribution_percentage: 35, is_critical_driver: true },
      { factor: "Seismic Micro-tremor", label: "Tectonic Lineament Proximity", value: "Zone V", contribution_percentage: 25, is_critical_driver: false }
    ]
  },
  {
    id: "loc-ar-02",
    location: "Bhalukpong – Bomdila Highway (NH-13)",
    state: "Arunachal Pradesh",
    district: "West Kameng",
    latitude: 27.0125,
    longitude: 92.6450,
    elevation: 850,
    riskScore: 68,
    probability: 65,
    confidence: 84,
    rainfall24h: 88.0,
    soilMoisture: 76.0,
    slope: 38.5,
    groundSaturation: 78.0,
    vegetationLoss: 28.0,
    riskLevel: "Moderate",
    trend: "Stable",
    expectedWindow: "24-48 Hours",
    primaryTrigger: "Kameng River Scouring & Active Road Widening",
    recommendedAction: "Monitor retaining walls along curve KM 34.",
    lastUpdated: new Date().toISOString(),
    historicalIncidentsCount: 12,
    lastMajorIncident: "July 2023 (Mudslide halted tourist transport)",
    predictionTimeline: [
      { time: "Now", label: "Current", score: 68, rainfall: 88.0, moisture: 76.0 },
      { time: "+6h", label: "Evening", score: 69, rainfall: 92.0, moisture: 77.0 },
      { time: "+12h", label: "Midnight", score: 70, rainfall: 95.0, moisture: 78.0 },
      { time: "+24h", label: "Tomorrow", score: 58, rainfall: 35.0, moisture: 68.0 },
      { time: "+48h", label: "+2 Days", score: 40, rainfall: 12.0, moisture: 58.0 }
    ],
    sopSteps: [
      "1. Inspect geo-mesh stabilization barriers at KM 34.",
      "2. Maintain one-lane standby traffic control."
    ],
    factors: [
      { factor: "Rainfall", label: "Sub-Himalayan Downpour", value: "88.0 mm", contribution_percentage: 38, is_critical_driver: true },
      { factor: "River Scour", label: "Kameng Hydrological Thrust", value: "Moderate", contribution_percentage: 32, is_critical_driver: false },
      { factor: "Slope Angle", label: "Talus Slope", value: "38.5°", contribution_percentage: 30, is_critical_driver: false }
    ]
  },
  {
    id: "loc-mn-01",
    location: "Tamenglong Hill Ridge (NH-37)",
    state: "Manipur",
    district: "Tamenglong",
    latitude: 24.9862,
    longitude: 93.4912,
    elevation: 1260,
    riskScore: 82,
    probability: 80,
    confidence: 89,
    rainfall24h: 135.0,
    soilMoisture: 86.4,
    slope: 42.0,
    groundSaturation: 88.0,
    vegetationLoss: 34.0,
    riskLevel: "Critical",
    trend: "Rising",
    expectedWindow: "6-12 Hours",
    primaryTrigger: "Saturated Clay Strata on Steep Ridge Spoil",
    recommendedAction: "Issue high alert to Tamenglong DC. Check Barak bridge approaches.",
    lastUpdated: new Date().toISOString(),
    historicalIncidentsCount: 18,
    lastMajorIncident: "June 2022 (Tupul Railway Yard Catastrophic Landslide)",
    predictionTimeline: [
      { time: "Now", label: "Current", score: 82, rainfall: 135.0, moisture: 86.4 },
      { time: "+6h", label: "Evening", score: 85, rainfall: 150.0, moisture: 89.0 },
      { time: "+12h", label: "+12h", score: 86, rainfall: 160.0, moisture: 90.5 },
      { time: "+24h", label: "+24h", score: 72, rainfall: 60.0, moisture: 81.0 },
      { time: "+48h", label: "+48h", score: 48, rainfall: 20.0, moisture: 68.0 }
    ],
    sopSteps: [
      "1. Alert Manipur Disaster Management Authority (MDMA).",
      "2. Evacuate construction camps adjacent to Ijei river valley.",
      "3. Drone reconnaissance along Railway tunnel portal 12."
    ],
    factors: [
      { factor: "Rainfall Volume", label: "Heavy Inflow", value: "135.0 mm", contribution_percentage: 44, is_critical_driver: true },
      { factor: "Geology", label: "Disang Shale Fragility", value: "High", contribution_percentage: 32, is_critical_driver: true },
      { factor: "Slope", label: "Ridge Angle", value: "42.0°", contribution_percentage: 24, is_critical_driver: false }
    ]
  },
  {
    id: "loc-as-01",
    location: "Dima Hasao – Jatinga Valley (Hill Railway)",
    state: "Assam",
    district: "Dima Hasao",
    latitude: 25.1234,
    longitude: 93.0315,
    elevation: 650,
    riskScore: 86,
    probability: 84,
    confidence: 92,
    rainfall24h: 154.0,
    soilMoisture: 91.2,
    slope: 37.0,
    groundSaturation: 92.5,
    vegetationLoss: 46.0,
    riskLevel: "Critical",
    trend: "Rising",
    expectedWindow: "3-6 Hours",
    primaryTrigger: "Sudden Flash Torrent & Saturated Sandstone Washout",
    recommendedAction: "Suspend Northeast Frontier Railway passenger services between Lumding & Badarpur.",
    lastUpdated: new Date().toISOString(),
    historicalIncidentsCount: 25,
    lastMajorIncident: "May 2022 (New Haflong Station submerged by mud debris)",
    predictionTimeline: [
      { time: "Now", label: "Current", score: 86, rainfall: 154.0, moisture: 91.2 },
      { time: "+6h", label: "Evening", score: 89, rainfall: 175.0, moisture: 93.5 },
      { time: "+12h", label: "+12h", score: 87, rainfall: 130.0, moisture: 92.0 },
      { time: "+24h", label: "+24h", score: 68, rainfall: 45.0, moisture: 80.0 },
      { time: "+48h", label: "+48h", score: 45, rainfall: 15.0, moisture: 66.0 }
    ],
    sopSteps: [
      "1. Immediate emergency telegraph to NFR Railway control room.",
      "2. Haflong district administration to inspect NH-54E road cuttings.",
      "3. Standby NDRF 1st Battalion platoon at Silchar."
    ],
    factors: [
      { factor: "Extreme Rain", label: "Hill Catchment Deluge", value: "154.0 mm", contribution_percentage: 48, is_critical_driver: true },
      { factor: "Soil Saturation", label: "Mudflow Liquefaction Threshold", value: "91.2%", contribution_percentage: 30, is_critical_driver: true },
      { factor: "Erosion Cut", label: "Unstabilized Track Cut", value: "Severe", contribution_percentage: 22, is_critical_driver: false }
    ]
  },
  {
    id: "loc-mz-02",
    location: "Lunglei Town – Venglai Slopes",
    state: "Mizoram",
    district: "Lunglei",
    latitude: 22.8842,
    longitude: 92.7358,
    elevation: 722,
    riskScore: 64,
    probability: 61,
    confidence: 85,
    rainfall24h: 74.0,
    soilMoisture: 71.0,
    slope: 34.0,
    groundSaturation: 73.0,
    vegetationLoss: 25.0,
    riskLevel: "Moderate",
    trend: "Stable",
    expectedWindow: "24-48 Hours",
    primaryTrigger: "Moderate Continuous Rain on Settlement Slopes",
    recommendedAction: "Local Disaster Task Force monitoring.",
    lastUpdated: new Date().toISOString(),
    historicalIncidentsCount: 7,
    lastMajorIncident: "July 2021 (Retaining wall collapse)",
    predictionTimeline: [
      { time: "Now", label: "Current", score: 64, rainfall: 74.0, moisture: 71.0 },
      { time: "+6h", label: "Evening", score: 65, rainfall: 80.0, moisture: 72.0 },
      { time: "+12h", label: "+12h", score: 66, rainfall: 82.0, moisture: 73.0 },
      { time: "+24h", label: "+24h", score: 55, rainfall: 25.0, moisture: 64.0 },
      { time: "+48h", label: "+48h", score: 38, rainfall: 10.0, moisture: 54.0 }
    ],
    sopSteps: ["1. Clear stormwater drain blockages across Venglai municipal zone."],
    factors: [
      { factor: "Rainfall", label: "Steady Rain", value: "74.0 mm", contribution_percentage: 40, is_critical_driver: false },
      { factor: "Slope", label: "Urbanized Terrace", value: "34.0°", contribution_percentage: 35, is_critical_driver: false },
      { factor: "Moisture", label: "Moderate Moisture", value: "71.0%", contribution_percentage: 25, is_critical_driver: false }
    ]
  },
  {
    id: "loc-ml-02",
    location: "Jowai – Ratacherra Highway (NH-06)",
    state: "Meghalaya",
    district: "East Jaintia Hills",
    latitude: 25.1845,
    longitude: 92.4210,
    elevation: 1100,
    riskScore: 76,
    probability: 74,
    confidence: 88,
    rainfall24h: 112.0,
    soilMoisture: 81.5,
    slope: 37.5,
    groundSaturation: 84.0,
    vegetationLoss: 39.0,
    riskLevel: "High",
    trend: "Rising",
    expectedWindow: "12-24 Hours",
    primaryTrigger: "Heavy Precipitation & Coal Overburden Instability",
    recommendedAction: "Patrol Sonapur tunnel entry and exit portals.",
    lastUpdated: new Date().toISOString(),
    historicalIncidentsCount: 19,
    lastMajorIncident: "June 2023 (Sonapur Tunnel Mud Blockade for 5 Days)",
    predictionTimeline: [
      { time: "Now", label: "Current", score: 76, rainfall: 112.0, moisture: 81.5 },
      { time: "+6h", label: "+6h", score: 79, rainfall: 130.0, moisture: 84.0 },
      { time: "+12h", label: "+12h", score: 81, rainfall: 140.0, moisture: 86.0 },
      { time: "+24h", label: "+24h", score: 68, rainfall: 50.0, moisture: 76.0 },
      { time: "+48h", label: "+48h", score: 45, rainfall: 20.0, moisture: 62.0 }
    ],
    sopSteps: [
      "1. Alert NHAI Project Director and East Jaintia Hills Police.",
      "2. Stage excavators at Sonapur tunnel mouth."
    ],
    factors: [
      { factor: "Rainfall", label: "Continuous Jaintia Storms", value: "112.0 mm", contribution_percentage: 42, is_critical_driver: true },
      { factor: "Mining Spoil", label: "Loose Coal Overburden", value: "High", contribution_percentage: 32, is_critical_driver: true },
      { factor: "Slope", label: "Highway Cut", value: "37.5°", contribution_percentage: 26, is_critical_driver: false }
    ]
  },
  {
    id: "loc-nl-02",
    location: "Mokokchung – Changki Valley Road",
    state: "Nagaland",
    district: "Mokokchung",
    latitude: 26.3245,
    longitude: 94.5120,
    elevation: 1320,
    riskScore: 59,
    probability: 57,
    confidence: 82,
    rainfall24h: 58.0,
    soilMoisture: 68.0,
    slope: 31.0,
    groundSaturation: 70.0,
    vegetationLoss: 21.0,
    riskLevel: "Moderate",
    trend: "Stable",
    expectedWindow: ">48 Hours",
    primaryTrigger: "Scattered Showers on Weathered Siltstone",
    recommendedAction: "Routine road maintenance monitoring.",
    lastUpdated: new Date().toISOString(),
    historicalIncidentsCount: 5,
    lastMajorIncident: "Aug 2022 (Minor slip cleared in 4 hours)",
    predictionTimeline: [
      { time: "Now", label: "Current", score: 59, rainfall: 58.0, moisture: 68.0 },
      { time: "+6h", label: "+6h", score: 60, rainfall: 62.0, moisture: 69.0 },
      { time: "+12h", label: "+12h", score: 61, rainfall: 65.0, moisture: 70.0 },
      { time: "+24h", label: "+24h", score: 52, rainfall: 20.0, moisture: 61.0 },
      { time: "+48h", label: "+48h", score: 35, rainfall: 8.0, moisture: 50.0 }
    ],
    sopSteps: ["1. Regular check of culverts by PWD Road Division."],
    factors: [
      { factor: "Rainfall", label: "Moderate Showers", value: "58.0 mm", contribution_percentage: 45, is_critical_driver: false },
      { factor: "Slope", label: "Rolling Terrain", value: "31.0°", contribution_percentage: 30, is_critical_driver: false },
      { factor: "Soil", label: "Residual Soil", value: "68.0%", contribution_percentage: 25, is_critical_driver: false }
    ]
  },
  {
    id: "loc-mn-02",
    location: "Senapati – Karong Section (NH-02)",
    state: "Manipur",
    district: "Senapati",
    latitude: 25.2678,
    longitude: 94.0156,
    elevation: 1080,
    riskScore: 72,
    probability: 70,
    confidence: 87,
    rainfall24h: 92.0,
    soilMoisture: 78.0,
    slope: 35.0,
    groundSaturation: 80.0,
    vegetationLoss: 29.0,
    riskLevel: "High",
    trend: "Rising",
    expectedWindow: "12-24 Hours",
    primaryTrigger: "Heavy Showers along Barak Tributary Headwaters",
    recommendedAction: "Traffic police to regulate single-line flow at Karong bridge.",
    lastUpdated: new Date().toISOString(),
    historicalIncidentsCount: 11,
    lastMajorIncident: "July 2023 (Debris blocked Imphal supply trucks)",
    predictionTimeline: [
      { time: "Now", label: "Current", score: 72, rainfall: 92.0, moisture: 78.0 },
      { time: "+6h", label: "+6h", score: 75, rainfall: 105.0, moisture: 80.5 },
      { time: "+12h", label: "+12h", score: 77, rainfall: 115.0, moisture: 82.0 },
      { time: "+24h", label: "+24h", score: 62, rainfall: 35.0, moisture: 72.0 },
      { time: "+48h", label: "+48h", score: 42, rainfall: 10.0, moisture: 60.0 }
    ],
    sopSteps: ["1. Inform Senapati District Emergency Response cell."],
    factors: [
      { factor: "Rainfall", label: "Monsoon Surge", value: "92.0 mm", contribution_percentage: 42, is_critical_driver: true },
      { factor: "Slope", label: "Valley Wall Slope", value: "35.0°", contribution_percentage: 33, is_critical_driver: false },
      { factor: "Soil Moisture", label: "Moisture Level", value: "78.0%", contribution_percentage: 25, is_critical_driver: false }
    ]
  },
  {
    id: "loc-tr-01",
    location: "Dhalai – Ambassa Atharamura Ridge",
    state: "Tripura",
    district: "Dhalai",
    latitude: 23.9214,
    longitude: 91.8543,
    elevation: 380,
    riskScore: 52,
    probability: 49,
    confidence: 81,
    rainfall24h: 48.0,
    soilMoisture: 62.0,
    slope: 28.0,
    groundSaturation: 65.0,
    vegetationLoss: 16.0,
    riskLevel: "Moderate",
    trend: "Falling",
    expectedWindow: ">48 Hours",
    primaryTrigger: "Intermittent Rain on Compacted Red Laterite",
    recommendedAction: "Monitor NH-08 connectivity across Atharamura range.",
    lastUpdated: new Date().toISOString(),
    historicalIncidentsCount: 6,
    lastMajorIncident: "June 2022 (Minor culvert breach)",
    predictionTimeline: [
      { time: "Now", label: "Current", score: 52, rainfall: 48.0, moisture: 62.0 },
      { time: "+6h", label: "+6h", score: 50, rainfall: 42.0, moisture: 60.0 },
      { time: "+12h", label: "+12h", score: 46, rainfall: 30.0, moisture: 58.0 },
      { time: "+24h", label: "+24h", score: 38, rainfall: 15.0, moisture: 52.0 },
      { time: "+48h", label: "+48h", score: 28, rainfall: 5.0, moisture: 45.0 }
    ],
    sopSteps: ["1. Normal alert state for Tripura State Disaster Management."],
    factors: [
      { factor: "Rainfall", label: "Low-Moderate Rain", value: "48.0 mm", contribution_percentage: 40, is_critical_driver: false },
      { factor: "Slope", label: "Gentle Ridge", value: "28.0°", contribution_percentage: 35, is_critical_driver: false },
      { factor: "Soil", label: "Lateritic Binding", value: "Good", contribution_percentage: 25, is_critical_driver: false }
    ]
  },
  {
    id: "loc-sk-03",
    location: "Pelling – Rimbi Waterfall Road",
    state: "Sikkim",
    district: "West Sikkim",
    latitude: 27.3150,
    longitude: 88.2410,
    elevation: 1980,
    riskScore: 66,
    probability: 63,
    confidence: 86,
    rainfall24h: 84.0,
    soilMoisture: 75.0,
    slope: 39.0,
    groundSaturation: 77.0,
    vegetationLoss: 26.0,
    riskLevel: "Moderate",
    trend: "Stable",
    expectedWindow: "24-48 Hours",
    primaryTrigger: "Waterfall Plunge Pool Scour & Moderate Rain",
    recommendedAction: "Advisory to tourist vehicle operators.",
    lastUpdated: new Date().toISOString(),
    historicalIncidentsCount: 8,
    lastMajorIncident: "July 2023 (Water runoff over road)",
    predictionTimeline: [
      { time: "Now", label: "Current", score: 66, rainfall: 84.0, moisture: 75.0 },
      { time: "+6h", label: "+6h", score: 68, rainfall: 90.0, moisture: 76.5 },
      { time: "+12h", label: "+12h", score: 69, rainfall: 92.0, moisture: 77.0 },
      { time: "+24h", label: "+24h", score: 56, rainfall: 30.0, moisture: 68.0 },
      { time: "+48h", label: "+48h", score: 39, rainfall: 10.0, moisture: 56.0 }
    ],
    sopSteps: ["1. Station PWD flagman at Rimbi bridge."],
    factors: [
      { factor: "Rainfall", label: "Sub-Alpine Rain", value: "84.0 mm", contribution_percentage: 42, is_critical_driver: false },
      { factor: "Slope", label: "Gneissic Slope", value: "39.0°", contribution_percentage: 33, is_critical_driver: false },
      { factor: "Moisture", label: "Moisture Index", value: "75.0%", contribution_percentage: 25, is_critical_driver: false }
    ]
  },
  {
    id: "loc-as-02",
    location: "Guwahati – Khanapara & Narakasur Slopes",
    state: "Assam",
    district: "Kamrup Metro",
    latitude: 26.1215,
    longitude: 91.8021,
    elevation: 180,
    riskScore: 61,
    probability: 58,
    confidence: 87,
    rainfall24h: 78.0,
    soilMoisture: 74.0,
    slope: 33.0,
    groundSaturation: 76.0,
    vegetationLoss: 48.0,
    riskLevel: "Moderate",
    trend: "Stable",
    expectedWindow: "24-48 Hours",
    primaryTrigger: "Unplanned Earth Cutting on Urban Fringe",
    recommendedAction: "Prohibit unauthorized hillside construction cutting.",
    lastUpdated: new Date().toISOString(),
    historicalIncidentsCount: 14,
    lastMajorIncident: "June 2022 (Slope slide near GMCH campus)",
    predictionTimeline: [
      { time: "Now", label: "Current", score: 61, rainfall: 78.0, moisture: 74.0 },
      { time: "+6h", label: "+6h", score: 63, rainfall: 82.0, moisture: 75.0 },
      { time: "+12h", label: "+12h", score: 62, rainfall: 70.0, moisture: 74.0 },
      { time: "+24h", label: "+24h", score: 50, rainfall: 25.0, moisture: 64.0 },
      { time: "+48h", label: "+48h", score: 32, rainfall: 8.0, moisture: 52.0 }
    ],
    sopSteps: ["1. Kamrup Metro DDMA to inspect retention walls."],
    factors: [
      { factor: "Urban Cutting", label: "Artificial Hill Cutting", value: "High", contribution_percentage: 45, is_critical_driver: true },
      { factor: "Rainfall", label: "Urban Downpour", value: "78.0 mm", contribution_percentage: 35, is_critical_driver: false },
      { factor: "Slope", label: "Residual Hill", value: "33.0°", contribution_percentage: 20, is_critical_driver: false }
    ]
  },
  {
    id: "loc-mz-03",
    location: "Champhai – Zokhawthar Border Highway",
    state: "Mizoram",
    district: "Champhai",
    latitude: 23.4732,
    longitude: 93.3289,
    elevation: 1380,
    riskScore: 48,
    probability: 45,
    confidence: 80,
    rainfall24h: 38.0,
    soilMoisture: 58.0,
    slope: 30.0,
    groundSaturation: 60.0,
    vegetationLoss: 18.0,
    riskLevel: "Low",
    trend: "Falling",
    expectedWindow: ">48 Hours",
    primaryTrigger: "Low Rainfall; Stable Dry Season Subgrade",
    recommendedAction: "Routine border commerce transport clear.",
    lastUpdated: new Date().toISOString(),
    historicalIncidentsCount: 4,
    lastMajorIncident: "Sept 2021 (Minor culvert slide)",
    predictionTimeline: [
      { time: "Now", label: "Current", score: 48, rainfall: 38.0, moisture: 58.0 },
      { time: "+6h", label: "+6h", score: 45, rainfall: 32.0, moisture: 56.0 },
      { time: "+12h", label: "+12h", score: 40, rainfall: 20.0, moisture: 52.0 },
      { time: "+24h", label: "+24h", score: 32, rainfall: 10.0, moisture: 48.0 },
      { time: "+48h", label: "+48h", score: 25, rainfall: 5.0, moisture: 42.0 }
    ],
    sopSteps: ["1. Standard monitoring by Champhai PWD."],
    factors: [
      { factor: "Rainfall", label: "Subdued Rain", value: "38.0 mm", contribution_percentage: 40, is_critical_driver: false },
      { factor: "Slope", label: "Moderate Slope", value: "30.0°", contribution_percentage: 35, is_critical_driver: false },
      { factor: "Moisture", label: "Moderate Moisture", value: "58.0%", contribution_percentage: 25, is_critical_driver: false }
    ]
  },
  {
    id: "loc-nl-03",
    location: "Tuensang – Kiphire Hill Traverse",
    state: "Nagaland",
    district: "Tuensang",
    latitude: 26.2812,
    longitude: 94.8320,
    elevation: 1370,
    riskScore: 45,
    probability: 42,
    confidence: 79,
    rainfall24h: 32.0,
    soilMoisture: 54.0,
    slope: 32.0,
    groundSaturation: 56.0,
    vegetationLoss: 14.0,
    riskLevel: "Low",
    trend: "Stable",
    expectedWindow: ">48 Hours",
    primaryTrigger: "Mild Showers on Vegetated Ridge",
    recommendedAction: "All routes open with standard vigilance.",
    lastUpdated: new Date().toISOString(),
    historicalIncidentsCount: 3,
    lastMajorIncident: "July 2020 (Small boulder roll)",
    predictionTimeline: [
      { time: "Now", label: "Current", score: 45, rainfall: 32.0, moisture: 54.0 },
      { time: "+6h", label: "+6h", score: 44, rainfall: 30.0, moisture: 53.0 },
      { time: "+12h", label: "+12h", score: 42, rainfall: 25.0, moisture: 51.0 },
      { time: "+24h", label: "+24h", score: 35, rainfall: 10.0, moisture: 46.0 },
      { time: "+48h", label: "+48h", score: 26, rainfall: 4.0, moisture: 40.0 }
    ],
    sopSteps: ["1. Standard village council observation network active."],
    factors: [
      { factor: "Slope", label: "Stable Ridge", value: "32.0°", contribution_percentage: 40, is_critical_driver: false },
      { factor: "Vegetation", label: "Intact Canopy Coverage", value: "86.0%", contribution_percentage: 35, is_critical_driver: false },
      { factor: "Rainfall", label: "Light Precipitation", value: "32.0 mm", contribution_percentage: 25, is_critical_driver: false }
    ]
  }
];

// =========================================================================
// 2. INITIAL ALERTS STATE
// =========================================================================
let alertsState: Alert[] = [
  {
    id: "alt-001",
    locationId: "loc-mz-01",
    location: "Aizawl West – Hunthar Subsidence Zone",
    state: "Mizoram",
    district: "Aizawl",
    severity: "Critical",
    triggerReason: "Continuous Storm Surcharge (168mm/24h) & Pore Pressure Limit",
    triggeredAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    recommendedAction: "Mandatory evacuation of Sector 3. Close Hunthar bypass.",
    notificationStatus: "Pending",
    probability: 91,
    riskScore: 92
  },
  {
    id: "alt-002",
    locationId: "loc-sk-01",
    location: "Gangtok – 9th Mile (NH-10 Corridor)",
    state: "Sikkim",
    district: "East Sikkim",
    severity: "Critical",
    triggerReason: "Extreme Runoff Rate (142mm/24h) destabilizing toe slope on NH-10",
    triggeredAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    recommendedAction: "Suspend heavy freight. Deploy BRO Task Force Project Swastik.",
    notificationStatus: "Acknowledged",
    probability: 88,
    riskScore: 89
  },
  {
    id: "alt-003",
    locationId: "loc-as-01",
    location: "Dima Hasao – Jatinga Valley (Hill Railway)",
    state: "Assam",
    district: "Dima Hasao",
    severity: "Critical",
    triggerReason: "High Deluge (154mm/24h) & Slurry Liquefaction Threshold Reached",
    triggeredAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    recommendedAction: "Emergency telegraph to NFR Railway control. Suspend trains.",
    notificationStatus: "Dispatched",
    probability: 84,
    riskScore: 86
  },
  {
    id: "alt-004",
    locationId: "loc-mn-01",
    location: "Tamenglong Hill Ridge (NH-37)",
    state: "Manipur",
    district: "Tamenglong",
    severity: "Critical",
    triggerReason: "Disang Shale Saturated on 42° Slope Angle",
    triggeredAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    recommendedAction: "Evacuate river valley road camps. Police checkposts alerted.",
    notificationStatus: "Pending",
    probability: 80,
    riskScore: 82
  },
  {
    id: "alt-005",
    locationId: "loc-nl-01",
    location: "Kohima – Zubza Section (NH-29 Bypass)",
    state: "Nagaland",
    district: "Kohima",
    severity: "High",
    triggerReason: "Cut-slope instability with 96mm 24h accumulation",
    triggeredAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    recommendedAction: "Impose night travel restrictions between 20:00 and 06:00.",
    notificationStatus: "Acknowledged",
    probability: 76,
    riskScore: 78
  },
  {
    id: "alt-006",
    locationId: "loc-ml-02",
    location: "Jowai – Ratacherra Highway (NH-06)",
    state: "Meghalaya",
    district: "East Jaintia Hills",
    severity: "High",
    triggerReason: "Loose Coal Overburden Slumping near Sonapur Tunnel Mouth",
    triggeredAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    recommendedAction: "Stage excavators at tunnel entrance. Restrict lane traffic.",
    notificationStatus: "Dispatched",
    probability: 74,
    riskScore: 76
  },
  {
    id: "alt-007",
    locationId: "loc-ar-01",
    location: "Tawang – Sela Pass Approach Road",
    state: "Arunachal Pradesh",
    district: "Tawang",
    severity: "High",
    triggerReason: "Freeze-thaw expansion and high-altitude sleet runoff",
    triggeredAt: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    recommendedAction: "Issue convoy speed restriction and rockfall caution.",
    notificationStatus: "Pending",
    probability: 69,
    riskScore: 71
  },
  {
    id: "alt-008",
    locationId: "loc-sk-03",
    location: "Pelling – Rimbi Waterfall Road",
    state: "Sikkim",
    district: "West Sikkim",
    severity: "Moderate",
    triggerReason: "Waterfall pool surcharge spilling onto lower carriage way",
    triggeredAt: new Date(Date.now() - 480 * 60 * 1000).toISOString(),
    recommendedAction: "Traffic police stationed for single-lane flow.",
    notificationStatus: "Acknowledged",
    probability: 63,
    riskScore: 66
  },
  {
    id: "alt-009",
    locationId: "loc-mz-02",
    location: "Lunglei Town – Venglai Slopes",
    state: "Mizoram",
    district: "Lunglei",
    severity: "Moderate",
    triggerReason: "Surface stormwater drainage overflow",
    triggeredAt: new Date(Date.now() - 600 * 60 * 1000).toISOString(),
    recommendedAction: "Municipal drain clearance teams deployed.",
    notificationStatus: "Dispatched",
    probability: 61,
    riskScore: 64
  },
  {
    id: "alt-010",
    locationId: "loc-tr-01",
    location: "Dhalai – Ambassa Atharamura Ridge",
    state: "Tripura",
    district: "Dhalai",
    severity: "Resolved",
    triggerReason: "Debris cleared by PWD fast response team; rain receded below 15mm/h",
    triggeredAt: new Date(Date.now() - 1200 * 60 * 1000).toISOString(),
    recommendedAction: "Normal two-way traffic restored on NH-08.",
    notificationStatus: "Acknowledged",
    probability: 35,
    riskScore: 38
  }
];

// =========================================================================
// 3. SENSORS STATE
// =========================================================================
const sensorsState: SensorItem[] = [
  {
    id: "sns-rg-01",
    name: "Tipping Bucket RG-SK-01",
    location: "9th Mile, Gangtok",
    state: "Sikkim",
    type: "rain_gauge",
    status: "online",
    battery: 94,
    lastReading: "142.5 mm / 24h",
    signalQuality: "4G LTE (Strong)",
    solarCharging: true,
    latitude: 27.3412,
    longitude: 88.6110
  },
  {
    id: "sns-sm-01",
    name: "TDR Soil Moisture SM-MZ-04",
    location: "Hunthar Ridge, Aizawl",
    state: "Mizoram",
    type: "soil_moisture",
    status: "online",
    battery: 88,
    lastReading: "93.4% Saturation (0-30cm)",
    signalQuality: "SatCom Relay",
    solarCharging: true,
    latitude: 23.7290,
    longitude: 92.7195
  },
  {
    id: "sns-inc-01",
    name: "MEMS Inclinometer INC-NL-02",
    location: "Zubza Bypass, Kohima",
    state: "Nagaland",
    type: "inclinometer",
    status: "warning",
    battery: 62,
    lastReading: "3.4 mm/day Tilt Creep",
    signalQuality: "4G LTE (Fair)",
    solarCharging: false,
    latitude: 25.6790,
    longitude: 94.1120
  },
  {
    id: "sns-ws-01",
    name: "Automatic Weather Stn AWS-ML-01",
    location: "Sohra Plateau, Cherrapunji",
    state: "Meghalaya",
    type: "weather_station",
    status: "online",
    battery: 98,
    lastReading: "215 mm rain | 18.2°C | 98% RH",
    signalQuality: "Fiber / 4G Backup",
    solarCharging: true,
    latitude: 25.3550,
    longitude: 91.7380
  },
  {
    id: "sns-pz-01",
    name: "Vibrating Wire Piezometer PZ-AS-03",
    location: "Jatinga Hill Cut, Dima Hasao",
    state: "Assam",
    type: "piezometer",
    status: "online",
    battery: 82,
    lastReading: "4.8 bar Pore Pressure",
    signalQuality: "LoRaWAN Gateway",
    solarCharging: true,
    latitude: 25.1260,
    longitude: 93.0350
  },
  {
    id: "sns-ins-01",
    name: "InSAR Corner Reflector CR-SK-02",
    location: "Passingdang, Dzongu",
    state: "Sikkim",
    type: "insar_reflector",
    status: "online",
    battery: 100,
    lastReading: "Sentinel-1 Ascending Pass (12d Δ -8.2mm)",
    signalQuality: "Passive Synthetic Radar",
    solarCharging: true,
    latitude: 27.5340,
    longitude: 88.5440
  },
  {
    id: "sns-rg-02",
    name: "Optical Rain Sensor RG-AR-02",
    location: "Sela Pass Portal, Tawang",
    state: "Arunachal Pradesh",
    type: "rain_gauge",
    status: "warning",
    battery: 45,
    lastReading: "62.0 mm Sleet-Rain Equivalent",
    signalQuality: "Army Wireless Net",
    solarCharging: false,
    latitude: 27.5890,
    longitude: 91.8620
  },
  {
    id: "sns-sm-02",
    name: "Multi-depth Moisture Probe SM-MN-01",
    location: "Tamenglong Ridge",
    state: "Manipur",
    type: "soil_moisture",
    status: "online",
    battery: 91,
    lastReading: "86.4% Volumetric Content",
    signalQuality: "4G LTE (Strong)",
    solarCharging: true,
    latitude: 24.9890,
    longitude: 93.4940
  },
  {
    id: "sns-ws-02",
    name: "Weather Station AWS-TR-01",
    location: "Atharamura Range, Dhalai",
    state: "Tripura",
    type: "weather_station",
    status: "offline",
    battery: 12,
    lastReading: "Connection timeout (>3 hours)",
    signalQuality: "No Signal (Maintenance Required)",
    solarCharging: false,
    latitude: 23.9240,
    longitude: 91.8570
  }
];

// =========================================================================
// 4. HISTORICAL RECORDS (1998-2025)
// =========================================================================
const historicalRecordsState: HistoricalLandslideRecord[] = [
  {
    id: "hist-01",
    year: 2024,
    month: "May",
    state: "Mizoram",
    district: "Aizawl",
    location: "Hunthar & Melthum Quarry Slopes",
    fatalities: 17,
    roadBlocked: "NH-54 Supply Corridor (5 Days)",
    rainfallMm: 294.0,
    severity: "Critical",
    trigger: "Cyclone Remal extreme cloudburst"
  },
  {
    id: "hist-02",
    year: 2023,
    month: "Oct",
    state: "Sikkim",
    district: "North Sikkim",
    location: "Chungthang & Dzongu Teesta Valley",
    fatalities: 42,
    roadBlocked: "NH-10 & Mangan-Lachen Highway (18 Days)",
    rainfallMm: 310.0,
    severity: "Critical",
    trigger: "South Lhonak GLOF + Intense Torrential Rain"
  },
  {
    id: "hist-03",
    year: 2022,
    month: "June",
    state: "Manipur",
    district: "Noney / Tamenglong",
    location: "Tupul Railway Construction Yard",
    fatalities: 61,
    roadBlocked: "Jiribam-Imphal Railway Works & Ijei River Block",
    rainfallMm: 245.0,
    severity: "Critical",
    trigger: "Cut-slope liquefaction after 72 hours downpour"
  },
  {
    id: "hist-04",
    year: 2022,
    month: "May",
    state: "Assam",
    district: "Dima Hasao",
    location: "New Haflong & Jatinga Valley",
    fatalities: 8,
    roadBlocked: "Lumding-Badarpur Railway Line (32 Days)",
    rainfallMm: 330.0,
    severity: "Critical",
    trigger: "Continuous flash torrent washing out railway base"
  },
  {
    id: "hist-05",
    year: 2023,
    month: "July",
    state: "Meghalaya",
    district: "East Jaintia Hills",
    location: "Sonapur Tunnel Portal (NH-06)",
    fatalities: 2,
    roadBlocked: "NH-06 Silchar-Shillong Lifeline (6 Days)",
    rainfallMm: 260.0,
    severity: "High",
    trigger: "Coal overburden slide engulfing highway mouth"
  },
  {
    id: "hist-06",
    year: 2021,
    month: "Aug",
    state: "Nagaland",
    district: "Kohima",
    location: "Old Kahu Zubza Bypass (NH-29)",
    fatalities: 0,
    roadBlocked: "Dimapur-Kohima Highway (3 Days)",
    rainfallMm: 180.0,
    severity: "High",
    trigger: "Toe erosion by torrential mountain brook"
  },
  {
    id: "hist-07",
    year: 2020,
    month: "Sept",
    state: "Arunachal Pradesh",
    district: "West Kameng",
    location: "Bhalukpong Sessa Rock Wall",
    fatalities: 3,
    roadBlocked: "Trans-Arunachal Highway NH-13 (4 Days)",
    rainfallMm: 210.0,
    severity: "High",
    trigger: "Wedge rock failure on jointed quartzite"
  },
  {
    id: "hist-08",
    year: 2024,
    month: "July",
    state: "Sikkim",
    district: "East Sikkim",
    location: "29th Mile & Setijhora (NH-10)",
    fatalities: 1,
    roadBlocked: "NH-10 Siliguri-Gangtok (7 Days)",
    rainfallMm: 220.0,
    severity: "High",
    trigger: "Teesta river bank erosion cutting road base"
  }
];

const historicalYearSummaries: HistoricalYearSummary[] = [
  { year: 2020, incidents: 84, criticalEvents: 12, avgRainfall: 2150, modelAccuracy: 88.4 },
  { year: 2021, incidents: 98, criticalEvents: 16, avgRainfall: 2320, modelAccuracy: 89.8 },
  { year: 2022, incidents: 142, criticalEvents: 28, avgRainfall: 2890, modelAccuracy: 91.2 },
  { year: 2023, incidents: 126, criticalEvents: 24, avgRainfall: 2650, modelAccuracy: 93.1 },
  { year: 2024, incidents: 138, criticalEvents: 27, avgRainfall: 2780, modelAccuracy: 94.6 },
  { year: 2025, incidents: 72, criticalEvents: 14, avgRainfall: 1620, modelAccuracy: 95.2 }
];

// =========================================================================
// 5. LIVE SIMULATION SUBSCRIPTION LOGIC (Frontend Only)
// =========================================================================
const listeners = new Set<() => void>();

// Run simulation loop every 22 seconds
if (typeof window !== 'undefined') {
  setInterval(() => {
    // Nudge locations with gentle realistic micro-variations
    locationsState = locationsState.map(loc => {
      const rainDelta = (Math.random() - 0.45) * 1.8;
      const moistureDelta = (Math.random() - 0.48) * 0.9;
      const newRain = Math.max(10, Math.min(300, +(loc.rainfall24h + rainDelta).toFixed(1)));
      const newMoisture = Math.max(30, Math.min(99, +(loc.soilMoisture + moistureDelta).toFixed(1)));
      
      // Slightly adjust risk score based on rainfall changes
      let newScore = loc.riskScore;
      if (newRain > 140 && loc.riskScore < 95) newScore = Math.min(98, loc.riskScore + 1);
      if (newRain < 50 && loc.riskScore > 35) newScore = Math.max(30, loc.riskScore - 1);

      return {
        ...loc,
        rainfall24h: newRain,
        soilMoisture: newMoisture,
        riskScore: newScore,
        probability: Math.min(99, Math.max(20, newScore - Math.floor(Math.random() * 4))),
        lastUpdated: new Date().toISOString()
      };
    });

    // Notify registered subscribers
    listeners.forEach(cb => cb());
  }, 22000);
}

// =========================================================================
// 6. MOCK API IMPLEMENTATION (EXACT SAME INTERFACE AS API.TS)
// =========================================================================
export const mockApi = {
  /**
   * Return simulated locations with optional filters
   */
  async getLocations(filters?: LocationFilters): Promise<RiskLocation[]> {
    // Simulate brief network latency (80ms)
    await new Promise(r => setTimeout(r, 80));
    let result = [...locationsState];

    if (filters?.state && filters.state !== 'ALL') {
      result = result.filter(l => l.state.toLowerCase() === filters.state?.toLowerCase());
    }
    if (filters?.district) {
      result = result.filter(l => l.district?.toLowerCase().includes(filters.district!.toLowerCase()));
    }
    if (filters?.riskLevel && filters.riskLevel !== 'ALL') {
      result = result.filter(l => l.riskLevel.toLowerCase() === filters.riskLevel?.toLowerCase());
    }
    if (filters?.minRisk) {
      result = result.filter(l => l.riskScore >= filters.minRisk!);
    }

    return result;
  },

  /**
   * Return single simulated location
   */
  async getLocationById(id: string): Promise<RiskLocation | null> {
    await new Promise(r => setTimeout(r, 60));
    const loc = locationsState.find(l => l.id === id);
    return loc ? { ...loc } : null;
  },

  /**
   * Return simulated alerts with optional filters
   */
  async getAlerts(filters?: AlertFilters): Promise<Alert[]> {
    await new Promise(r => setTimeout(r, 70));
    let result = [...alertsState];

    if (filters?.severity && filters.severity !== 'ALL') {
      result = result.filter(a => a.severity.toLowerCase() === filters.severity?.toLowerCase());
    }
    if (filters?.locationId) {
      result = result.filter(a => a.locationId === filters.locationId);
    }

    return result;
  },

  /**
   * Update alert status in local state (Acknowledge, Escalate, Dispatched)
   */
  async updateAlertStatus(
    alertId: string,
    action: 'Acknowledge' | 'Escalate' | 'Dispatched',
    _customMessage?: string
  ): Promise<Alert> {
    await new Promise(r => setTimeout(r, 120));
    const idx = alertsState.findIndex(a => a.id === alertId);
    if (idx === -1) throw new Error(`Alert with id ${alertId} not found.`);

    if (action === 'Dispatched') {
      alertsState[idx] = {
        ...alertsState[idx],
        notificationStatus: 'Dispatched'
      };
    } else if (action === 'Acknowledge') {
      alertsState[idx] = {
        ...alertsState[idx],
        notificationStatus: 'Acknowledged'
      };
    } else if (action === 'Escalate') {
      alertsState[idx] = {
        ...alertsState[idx],
        severity: 'Critical'
      };
    }

    listeners.forEach(cb => cb());
    return { ...alertsState[idx] };
  },

  /**
   * Return simulated sensors
   */
  async getSensors(filters?: SensorFilters): Promise<SensorItem[]> {
    await new Promise(r => setTimeout(r, 75));
    let result = [...sensorsState];

    if (filters?.type && filters.type !== 'ALL') {
      result = result.filter(s => s.type === filters.type);
    }
    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter(s => s.status === filters.status);
    }

    return result;
  },

  /**
   * Generate realistic 24h / 7d / 30d time series points
   */
  async getEnvironmentalTimeSeries(
    locationId?: string,
    range: '24h' | '7d' | '30d' = '24h'
  ): Promise<TimeSeriesDataPoint[]> {
    await new Promise(r => setTimeout(r, 90));
    const loc = locationsState.find(l => l.id === locationId) || locationsState[0];
    const baseRain = loc.rainfall24h;
    const baseMoisture = loc.soilMoisture;

    const points: TimeSeriesDataPoint[] = [];

    if (range === '24h') {
      for (let i = 24; i >= 0; i -= 2) {
        const d = new Date(Date.now() - i * 3600 * 1000);
        const timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const factor = Math.sin((24 - i) / 4) * 15;
        points.push({
          timestamp: d.toISOString(),
          timeLabel,
          rainfall: +(Math.max(2, (baseRain / 12) + factor + (Math.random() * 4))).toFixed(1),
          soilMoisture: +(Math.min(98, baseMoisture - (i * 0.4) + (Math.random() * 2))).toFixed(1),
          groundSaturation: +(Math.min(96, baseMoisture - 5 + (Math.random() * 3))).toFixed(1),
          temperature: +(22 - (Math.sin(i / 3) * 4)).toFixed(1)
        });
      }
    } else if (range === '7d') {
      for (let i = 7; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400 * 1000);
        const timeLabel = d.toLocaleDateString([], { weekday: 'short' });
        points.push({
          timestamp: d.toISOString(),
          timeLabel,
          rainfall: +(Math.max(10, baseRain * (0.6 + Math.random() * 0.8))).toFixed(1),
          soilMoisture: +(Math.min(95, baseMoisture - (i * 1.5) + (Math.random() * 4))).toFixed(1),
          groundSaturation: +(Math.min(92, baseMoisture - 8 + (Math.random() * 5))).toFixed(1),
          temperature: +(23 + (Math.random() * 3)).toFixed(1)
        });
      }
    } else {
      // 30d
      for (let i = 30; i >= 0; i -= 3) {
        const d = new Date(Date.now() - i * 86400 * 1000);
        const timeLabel = `${d.getDate()} ${d.toLocaleDateString([], { month: 'short' })}`;
        points.push({
          timestamp: d.toISOString(),
          timeLabel,
          rainfall: +(Math.max(5, (baseRain * 0.7) + (Math.random() * 40))).toFixed(1),
          soilMoisture: +(Math.min(95, 60 + (Math.random() * 30))).toFixed(1),
          groundSaturation: +(Math.min(90, 55 + (Math.random() * 30))).toFixed(1),
          temperature: +(24 + (Math.random() * 4)).toFixed(1)
        });
      }
    }

    return points;
  },

  /**
   * Return historical records
   */
  async getHistoricalRecords(filters?: HistoricalFilters): Promise<HistoricalLandslideRecord[]> {
    await new Promise(r => setTimeout(r, 70));
    let result = [...historicalRecordsState];

    if (filters?.year) {
      result = result.filter(h => h.year === filters.year);
    }
    if (filters?.state && filters.state !== 'ALL') {
      result = result.filter(h => h.state.toLowerCase() === filters.state?.toLowerCase());
    }
    if (filters?.severity && filters.severity !== 'ALL') {
      result = result.filter(h => h.severity.toLowerCase() === filters.severity?.toLowerCase());
    }

    return result;
  },

  /**
   * Multi-year statistics for historical charts
   */
  async getHistoricalYearSummaries(): Promise<HistoricalYearSummary[]> {
    await new Promise(r => setTimeout(r, 60));
    return [...historicalYearSummaries];
  },

  /**
   * System health status probe matching backend spec
   */
  async getSystemHealth(): Promise<SystemHealth> {
    await new Promise(r => setTimeout(r, 50));
    return {
      status: "OPERATIONAL",
      service: "LANDSLIDE AI – NER Command Center",
      version: "1.2.0-PROTOTYPE",
      environment: "SIH26001 Evaluation Suite",
      subsystems: {
        ai_inference_engine: "ONLINE (LandslideAI-LSTM v1.0 / SHAP Active)",
        hydrometeorological_pipeline: "ONLINE (Open-Meteo & NASA GPM Proxy)",
        cap_alert_relay: "ONLINE (ITU-T X.1303 CAP v1.2)",
        field_report_sync: "ONLINE (Offline-first SQLite sync)",
        geospatial_engine: "ONLINE (ISRO Bhuvan CartoDEM & Copernicus S1/S2)"
      },
      monitored_region: "North Eastern Region (NER), India (8 States)",
      active_corridors: ["NH-10 (Sikkim)", "NH-29 (Nagaland)", "NH-54 (Mizoram)", "NH-13 (Arunachal)", "NH-06 (Meghalaya)"]
    };
  },

  /**
   * Interactive What-If simulation engine with explainable AI factors
   */
  async runCustomPrediction(request: PredictionRequest): Promise<PredictionResult> {
    await new Promise(r => setTimeout(r, 350));

    // Dynamic heuristic modeling Kailas's LSTM inference
    const rainWeight = 0.45;
    const slopeWeight = 0.35;
    const moistureWeight = 0.20;

    // Normalize
    const normalizedRain = Math.min(100, (request.rainfall_24h / 200) * 100);
    const normalizedSlope = Math.min(100, (request.slope / 60) * 100);
    const normalizedMoisture = request.soil_moisture;

    const rawScore = (normalizedRain * rainWeight) + (normalizedSlope * slopeWeight) + (normalizedMoisture * moistureWeight);
    const riskScore = Math.min(99, Math.max(12, Math.round(rawScore)));
    const probability = Math.min(98, Math.max(10, Math.round(rawScore * 0.96)));
    const confidence = Math.min(96, Math.max(82, 85 + Math.round(Math.random() * 10)));

    let riskLevel: "Low" | "Moderate" | "High" | "Critical" = "Low";
    let expectedWindow = ">48 Hours";
    if (riskScore >= 80) {
      riskLevel = "Critical";
      expectedWindow = "3-6 Hours";
    } else if (riskScore >= 68) {
      riskLevel = "High";
      expectedWindow = "12-24 Hours";
    } else if (riskScore >= 50) {
      riskLevel = "Moderate";
      expectedWindow = "24-48 Hours";
    }

    const factors = [
      {
        factor: "Rainfall 24h",
        label: "24-Hour Precipitation Load",
        value: `${request.rainfall_24h} mm`,
        contribution_percentage: Math.round((normalizedRain * rainWeight / rawScore) * 100),
        is_critical_driver: request.rainfall_24h > 120
      },
      {
        factor: "Slope Angle",
        label: "Topographic Gradient",
        value: `${request.slope}°`,
        contribution_percentage: Math.round((normalizedSlope * slopeWeight / rawScore) * 100),
        is_critical_driver: request.slope > 40
      },
      {
        factor: "Soil Moisture",
        label: "Pore Water Saturation",
        value: `${request.soil_moisture}%`,
        contribution_percentage: Math.round((normalizedMoisture * moistureWeight / rawScore) * 100),
        is_critical_driver: request.soil_moisture > 85
      }
    ];

    return {
      location_name: request.location_name || "Custom NER Coordinates",
      latitude: request.latitude,
      longitude: request.longitude,
      risk_score: riskScore,
      probability,
      confidence,
      risk_level: riskLevel,
      expected_window: expectedWindow,
      primary_trigger: request.rainfall_24h > 120 ? `Torrential Rain Surge (${request.rainfall_24h}mm)` : `Steep Terrain Slope (${request.slope}°)`,
      plain_language_reasoning: `Based on an antecedent 24-hour rainfall of ${request.rainfall_24h}mm combined with a steep slope of ${request.slope}° and soil saturation at ${request.soil_moisture}%, the hydrological shear stress exceeds the basal threshold, generating a ${riskLevel} hazard profile.`,
      recommended_sop: riskLevel === 'Critical' 
        ? "Issue immediate evacuation order and dispatch NDRF platoon. Halt heavy transport."
        : riskLevel === 'High' 
        ? "Issue caution notice, stage earthmoving machinery, and enforce night movement advisory."
        : "Maintain standard observation through automatic rain gauge telemetry.",
      factors,
      prediction_trajectory: [
        { time: "Now", label: "Current", score: riskScore, rainfall: request.rainfall_24h, moisture: request.soil_moisture },
        { time: "+6h", label: "+6 Hours", score: Math.min(99, riskScore + 3), rainfall: request.rainfall_24h + 15, moisture: Math.min(98, request.soil_moisture + 2) },
        { time: "+12h", label: "+12 Hours", score: Math.min(99, riskScore + 5), rainfall: request.rainfall_24h + 30, moisture: Math.min(99, request.soil_moisture + 3) },
        { time: "+24h", label: "+24 Hours", score: Math.max(20, riskScore - 12), rainfall: Math.max(5, request.rainfall_24h * 0.4), moisture: Math.max(30, request.soil_moisture - 8) },
        { time: "+48h", label: "+48 Hours", score: Math.max(15, riskScore - 25), rainfall: Math.max(2, request.rainfall_24h * 0.15), moisture: Math.max(25, request.soil_moisture - 18) }
      ]
    };
  },

  /**
   * Generate simulated authoritative reports
   */
  async generateReport(type: ReportType, district?: string): Promise<GeneratedReport> {
    await new Promise(r => setTimeout(r, 250));
    const now = new Date();
    const criticals = alertsState.filter(a => a.severity === 'Critical');
    const highRisks = locationsState.filter(l => l.riskLevel === 'Critical');

    return {
      id: `rep-${Date.now().toString().slice(-6)}`,
      type,
      title: `${type} Disaster Intelligence & Landslide Hazard Briefing`,
      generatedAt: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'medium' }),
      scope: district ? `District: ${district} (NER)` : `All 8 North Eastern States (MDoNER Region)`,
      summary: `Automated situational assessment generated by LANDSLIDE AI for early warning response teams. Active monitoring covers ${locationsState.length} critical highway sectors and community ridges across Sikkim, Mizoram, Nagaland, Meghalaya, Arunachal Pradesh, Manipur, Assam, and Tripura.`,
      keyMetrics: {
        criticalAlertsCount: criticals.length,
        activeHotspotsCount: highRisks.length,
        highestRiskLocation: highRisks[0]?.location || "Hunthar, Aizawl",
        avgRainfallMm: +(locationsState.reduce((acc, l) => acc + l.rainfall24h, 0) / locationsState.length).toFixed(1),
        aiModelAccuracy: "94.6% (Validated vs GSI Inventory)"
      },
      highRiskLocations: highRisks.map(l => `${l.location} (Score: ${l.riskScore}/100, Rain: ${l.rainfall24h}mm)`),
      recommendedDirectives: [
        "Maintain continuous SatCom radio connectivity with all District Emergency Operations Centres (DEOCs).",
        "Enforce one-way or night transit restrictions across NH-10 (Sikkim) and NH-29 (Nagaland).",
        "Pre-position BRO Task Force clearance machinery at identified high-susceptibility road cuts.",
        "Issue Common Alerting Protocol (CAP v1.2) cellular warnings to residents in Hunthar (Aizawl) and Passingdang (Dzongu)."
      ]
    };
  },

  /**
   * Demo authentication service
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    await new Promise(r => setTimeout(r, 180));
    const user: AuthUser = {
      id: "usr-sdma-01",
      name: credentials.email.split('@')[0].toUpperCase() || "OFFICER PRATHAM",
      email: credentials.email || "duty.officer@sdma.ner.gov.in",
      role: "SDMA_OFFICER",
      jurisdiction: "North Eastern Region (All 8 States)",
      token: "demo-jwt-token-sih26001-active"
    };
    localStorage.setItem('landslide_user', JSON.stringify(user));
    return user;
  },

  /**
   * Return logged in user or default demo officer
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    const stored = localStorage.getItem('landslide_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // fallback
      }
    }
    // Default demo user
    const defaultUser: AuthUser = {
      id: "usr-sdma-01",
      name: "Duty Officer (Pratham)",
      email: "sdma.command@ner.gov.in",
      role: "SDMA_OFFICER",
      jurisdiction: "North Eastern Region (NER)",
      token: "demo-jwt-token-sih26001-active"
    };
    localStorage.setItem('landslide_user', JSON.stringify(defaultUser));
    return defaultUser;
  },

  /**
   * Subscribe to the 22-second live simulation pulse
   */
  subscribeLiveUpdates(callback: () => void): () => void {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  isMockSimulationActive(): boolean {
    return true;
  }
};
