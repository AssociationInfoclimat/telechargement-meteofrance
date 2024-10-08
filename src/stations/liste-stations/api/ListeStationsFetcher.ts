import { TooManyRetriesError, UnexpectedResponseError } from '@/api/APIResponse.js';
import { wait } from '@/lib/wait.js';
import { ListeStationsAPIFetcher } from '@/stations/liste-stations/api/ListeStationsAPIFetcher.js';
import { ListeStationsData } from '@/stations/liste-stations/api/ListeStationsData.js';
import { DataFrequency } from '@/stations/liste-stations/DataFrequency.js';
import { Departement } from '@/stations/liste-stations/departements/Departement.js';
import { z } from 'zod';

export class ListeStationsFetcher {
    private readonly callListeStationsAPI: ListeStationsAPIFetcher;
    private readonly retries: number;
    private readonly waitingTimeInMs: number;

    constructor({
        listeStationsAPIFetcher,
        retries = 3,
        waitingTimeInMs = 5 * 1000,
    }: {
        listeStationsAPIFetcher: ListeStationsAPIFetcher;
        retries?: number;
        waitingTimeInMs?: number;
    }) {
        this.callListeStationsAPI = listeStationsAPIFetcher;
        this.retries = retries;
        this.waitingTimeInMs = waitingTimeInMs;
    }

    async fetchListeStations({
        frequence,
        departement,
    }: {
        frequence: DataFrequency;
        departement: Departement;
    }): Promise<ListeStationsData> {
        const response = await this.callListeStationsAPI({ frequence, departement });
        if (response.code !== 200 && this.retries <= 0) {
            throw new TooManyRetriesError(response);
        }
        if ([500, 502].includes(response.code)) {
            await wait(this.waitingTimeInMs);
            const fetcher = new ListeStationsFetcher({
                listeStationsAPIFetcher: this.callListeStationsAPI,
                retries: response.code === 502 ? this.retries : this.retries - 1,
                waitingTimeInMs: this.waitingTimeInMs,
            });
            return await fetcher.fetchListeStations({ frequence, departement });
        }
        if (response.code !== 200) {
            throw new UnexpectedResponseError(response);
        }
        const listResponseSchema = z.array(
            z.object({
                id: z.string(),
                nom: z.string(),
                posteOuvert: z.boolean(),
                typePoste: z.number(),
                lon: z.number(),
                lat: z.number(),
                alt: z.number(),
                postePublic: z.boolean(),
            })
        );
        return listResponseSchema.parse(response.data);
    }
}
