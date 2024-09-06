import {
    createFetchListeStationsFrequency,
    ListeStationsFetcher,
} from '@/stations/liste-stations/api/adapters/meteofrance/fetchListeStationsFrequency.js';
import { ListeStationsAPIFetcher } from '@/stations/liste-stations/api/ListeStationsAPIFetcher.js';
import { ListeStationsData } from '@/stations/liste-stations/api/ListeStationsData.js';
import { DataFrequency } from '@/stations/liste-stations/DataFrequency.js';
import { Departement } from '@/stations/liste-stations/departements/Departement.js';

export const fetchListeStationsHoraire: ListeStationsAPIFetcher = createFetchListeStationsFrequency(
    DataFrequency.of('horaire')
);

export class ListeStationsHoraireFetcher extends ListeStationsFetcher {
    constructor({ retries = 3 }: { retries?: number } = {}) {
        super({ listeStationsAPIFetcher: fetchListeStationsHoraire, retries });
    }

    async fetchListeStationsHoraire(departement: Departement): Promise<ListeStationsData> {
        return this.fetchListeStationsFrequency(departement);
    }
}
