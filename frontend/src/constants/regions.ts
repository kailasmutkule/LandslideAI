/**
 * LANDSLIDE AI - North Eastern Region (NER) Geographic Constants
 * Covers the 8 North Eastern States: Sikkim, Mizoram, Nagaland, Meghalaya,
 * Arunachal Pradesh, Manipur, Assam, and Tripura.
 */

export interface NERState {
  name: string;
  code: string;
  capital: string;
  centerLat: number;
  centerLng: number;
  districts: string[];
}

export const NER_STATES: NERState[] = [
  {
    name: 'Sikkim',
    code: 'SK',
    capital: 'Gangtok',
    centerLat: 27.3389,
    centerLng: 88.6065,
    districts: ['East Sikkim', 'West Sikkim', 'North Sikkim', 'South Sikkim', 'Pakyong', 'Soreng']
  },
  {
    name: 'Mizoram',
    code: 'MZ',
    capital: 'Aizawl',
    centerLat: 23.7271,
    centerLng: 92.7176,
    districts: ['Aizawl', 'Lunglei', 'Champhai', 'Kolasib', 'Serchhip', 'Lawngtlai', 'Saiha', 'Mamit', 'Hnahthial']
  },
  {
    name: 'Nagaland',
    code: 'NL',
    capital: 'Kohima',
    centerLat: 25.6751,
    centerLng: 94.1086,
    districts: ['Kohima', 'Dimapur', 'Mokokchung', 'Wokha', 'Phek', 'Mon', 'Tuensang', 'Zunheboto']
  },
  {
    name: 'Meghalaya',
    code: 'ML',
    capital: 'Shillong',
    centerLat: 25.5788,
    centerLng: 91.8933,
    districts: ['East Khasi Hills', 'West Khasi Hills', 'Ri-Bhoi', 'West Garo Hills', 'East Jaintia Hills', 'South Garo Hills']
  },
  {
    name: 'Arunachal Pradesh',
    code: 'AR',
    capital: 'Itanagar',
    centerLat: 27.0844,
    centerLng: 93.6053,
    districts: ['Papum Pare', 'Tawang', 'West Kameng', 'East Kameng', 'Lower Subansiri', 'Changlang', 'Lohit']
  },
  {
    name: 'Manipur',
    code: 'MN',
    capital: 'Imphal',
    centerLat: 24.8170,
    centerLng: 93.9368,
    districts: ['Imphal East', 'Imphal West', 'Churachandpur', 'Ukhrul', 'Senapati', 'Tamenglong', 'Chandel']
  },
  {
    name: 'Assam',
    code: 'AS',
    capital: 'Dispur / Guwahati',
    centerLat: 26.1445,
    centerLng: 91.7362,
    districts: ['Kamrup Metro', 'Dima Hasao', 'Karbi Anglong', 'Cachar', 'Hailakandi', 'Karimganj']
  },
  {
    name: 'Tripura',
    code: 'TR',
    capital: 'Agartala',
    centerLat: 23.8315,
    centerLng: 91.2868,
    districts: ['West Tripura', 'Dhalai', 'North Tripura', 'South Tripura', 'Gomati', 'Khowai']
  }
];

export const NER_CENTER = {
  lat: 26.2006,
  lng: 92.9376,
  defaultZoom: 7
};

export const CRITICAL_CORRIDORS = [
  { name: 'NH-10', route: 'Siliguri – Gangtok (Sikkim Lifeline)', risk: 'Critical', lengthKm: 114 },
  { name: 'NH-29', route: 'Dimapur – Kohima – Imphal (Nagaland/Manipur)', risk: 'High', lengthKm: 216 },
  { name: 'NH-54 / NH-306', route: 'Silchar – Aizawl (Mizoram Supply Arterial)', risk: 'High', lengthKm: 180 },
  { name: 'NH-13', route: 'Trans-Arunachal Highway (Bomdila/Tawang)', risk: 'Moderate', lengthKm: 310 },
  { name: 'NH-06', route: 'Shillong – Jowai – Silchar (Meghalaya Plateau)', risk: 'Critical', lengthKm: 220 },
  { name: 'LUMDING-BADARPUR', route: 'Dima Hasao Hill Section Railway Corridor', risk: 'Critical', lengthKm: 170 }
];
