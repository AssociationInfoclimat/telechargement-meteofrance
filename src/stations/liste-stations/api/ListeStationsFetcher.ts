import { APIResponse } from '@/api/APIResponse.js';
import { ListeStationsData } from '@/stations/liste-stations/api/ListeStationsData.js';
import { Departement } from '@/stations/liste-stations/departements/Departement.js';

export type ListeStationsFetcher = (departement: Departement) => Promise<APIResponse<ListeStationsData>>;
