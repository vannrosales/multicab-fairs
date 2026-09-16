export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type SelectionState = 'pickup' | 'dropoff' | 'done';


export type SavedRoute = {
  id: string;
  name: string;
  pickup: Coordinate;
  dropoff: Coordinate;
  pickupName: string;
  dropoffName: string;
};
