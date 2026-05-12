export type CourtType = 'Fútbol 5' | 'Fútbol 7' | 'Pádel' | 'Tenis' | 'Básquet'

export interface Court {
  id: string
  name: string
  venueName: string
  type: CourtType
  neighborhood: string
  city: string
  distance: string
  rating: number
  reviewCount: number
  pricePerHour: number
  isFavorite: boolean
  image: string
  lat: number
  lng: number
}

export const MOCK_COURTS: Court[] = [
  {
    id: '1',
    name: 'Cancha Norte',
    venueName: 'Complejo Los Olivos',
    type: 'Fútbol 5',
    neighborhood: 'Palermo',
    city: 'Buenos Aires',
    distance: '0.8 km',
    rating: 4.8,
    reviewCount: 124,
    pricePerHour: 8500,
    isFavorite: false,
    image: 'https://picsum.photos/seed/court1/400/240',
    lat: -34.5885,
    lng: -58.4356,
  },
  {
    id: '2',
    name: 'Pista Central',
    venueName: 'El Potrero Sport Club',
    type: 'Pádel',
    neighborhood: 'Villa Crespo',
    city: 'Buenos Aires',
    distance: '1.2 km',
    rating: 4.6,
    reviewCount: 89,
    pricePerHour: 6000,
    isFavorite: true,
    image: 'https://picsum.photos/seed/court2/400/240',
    lat: -34.5972,
    lng: -58.4405,
  },
  {
    id: '3',
    name: 'Cancha Roja',
    venueName: 'Deporte & Vida',
    type: 'Tenis',
    neighborhood: 'Colegiales',
    city: 'Buenos Aires',
    distance: '1.7 km',
    rating: 4.9,
    reviewCount: 203,
    pricePerHour: 7200,
    isFavorite: false,
    image: 'https://picsum.photos/seed/court3/400/240',
    lat: -34.5761,
    lng: -58.4421,
  },
  {
    id: '4',
    name: 'Cancha 3',
    venueName: 'Mega Sport Palermo',
    type: 'Fútbol 7',
    neighborhood: 'Palermo Soho',
    city: 'Buenos Aires',
    distance: '2.1 km',
    rating: 4.5,
    reviewCount: 67,
    pricePerHour: 12000,
    isFavorite: false,
    image: 'https://picsum.photos/seed/court4/400/240',
    lat: -34.5929,
    lng: -58.4310,
  },
  {
    id: '5',
    name: 'Cancha A',
    venueName: 'Urban Sport Center',
    type: 'Básquet',
    neighborhood: 'Núñez',
    city: 'Buenos Aires',
    distance: '3.4 km',
    rating: 4.7,
    reviewCount: 156,
    pricePerHour: 5500,
    isFavorite: true,
    image: 'https://picsum.photos/seed/court5/400/240',
    lat: -34.5421,
    lng: -58.4499,
  },
  {
    id: '6',
    name: 'Pista 2',
    venueName: 'Club Atlético Norte',
    type: 'Pádel',
    neighborhood: 'Belgrano',
    city: 'Buenos Aires',
    distance: '4.0 km',
    rating: 4.4,
    reviewCount: 41,
    pricePerHour: 5800,
    isFavorite: false,
    image: 'https://picsum.photos/seed/court6/400/240',
    lat: -34.5566,
    lng: -58.4604,
  },
]

export const COURT_TYPES: CourtType[] = [
  'Fútbol 5',
  'Fútbol 7',
  'Pádel',
  'Tenis',
  'Básquet',
]
