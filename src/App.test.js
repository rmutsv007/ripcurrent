import { render, screen, waitFor } from '@testing-library/react';

jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  WMSTileLayer: () => null,
  useMap: () => ({
    invalidateSize: jest.fn(),
    closePopup: jest.fn(),
    getBounds: jest.fn(),
    getCenter: jest.fn(),
    getZoom: jest.fn(() => 9),
    fitBounds: jest.fn(),
    setView: jest.fn(),
  }),
}));

jest.mock('leaflet', () => ({
  geoJSON: jest.fn(() => ({
    getBounds: () => ({
      isValid: () => false,
    }),
  })),
  latLng: jest.fn((lat, lng) => ({ lat, lng })),
  divIcon: jest.fn(() => ({})),
  marker: jest.fn(() => ({
    addTo: jest.fn(),
    setLatLng: jest.fn(),
    setOpacity: jest.fn(),
    getElement: jest.fn(() => null),
  })),
}));

jest.mock('./MapFeatureCircles', () => ({
  MapFeatureCircles: () => null,
}));

import App from './App';

beforeEach(() => {
  global.fetch = jest.fn(() => {
    return Promise.resolve({
      ok: true,
      json: async () => ({ features: [] }),
    });
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

test('renders the app header and loads default 	ChalatatSongkhla layer data', async () => {
  render(<App />);

  expect(screen.getByText('HydroGIS ชลาทัศน์ : ศูนย์แผนที่สำรวจและคุณภาพน้ำ')).toBeInTheDocument();

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      'https://map.surveywms.com/geoserver/	ChalatatSongkhla/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=	ChalatatSongkhla:%E0%B9%84%E0%B8%81%E0%B9%88&outputFormat=application/json&maxFeatures=100'
    );
  });
});
