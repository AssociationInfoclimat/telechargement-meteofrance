import { APIResponse, TooManyRetriesError, UnexpectedResponseError } from '@/api/APIResponse.js';
import { getMF } from '@/api/meteofrance/meteofrance-api-call.js';
import { TokenStorage } from '@/api/meteofrance/token/TokenStorage.js';
import { wait } from '@/lib/wait.js';
import { CommandeData, CommandeResult } from '@/telechargement/commande-fichier/api/CommandeResult.js';
import { z } from 'zod';

export function fetchCommandeFichier<T extends CommandeData>(
    idCommande: string
): Promise<APIResponse<CommandeResult<T>>> {
    return getMF({
        url: `https://public-api.meteofrance.fr/public/DPClim/v1/commande/fichier`,
        params: {
            'id-cmde': idCommande,
        },
    });
}

export class NonExistentCommandeError extends Error {
    constructor(commandeId: string) {
        super(`Commande '${commandeId}' does not exist`);
    }
}

export class AlreadyDownloadedError extends Error {
    constructor(commandeId: string) {
        super(`Commande '${commandeId}' has already been downloaded`);
    }
}

export class CommandeFichierFetcher {
    async fetchCommandeFichier<T extends CommandeData>(
        idCommande: string,
        { retries = 3 }: { retries?: number } = {}
    ): Promise<CommandeResult<T>> {
        const response = await fetchCommandeFichier(idCommande);

        if (response.code === 401) {
            const tokenStorage = TokenStorage.getSingleton();
            await tokenStorage.updateToken();
            return await this.fetchCommandeFichier(idCommande, { retries });
        }

        if (response.code === 502) {
            if (retries === 0) {
                throw new TooManyRetriesError(response);
            }
            await wait(5 * 1000);
            return await this.fetchCommandeFichier(idCommande, { retries: retries - 1 });
        }

        if (response.code === 404) {
            throw new NonExistentCommandeError(idCommande);
        }

        if (response.code === 410) {
            throw new AlreadyDownloadedError(idCommande);
        }

        if (response.code === 500) {
            return {
                type: 'failed',
                message: `${response.message} :\n${JSON.stringify(response.data)}`,
            };
        }

        if (response.code === 507) {
            return {
                type: 'too-big',
            };
        }

        if (response.code === 204) {
            return {
                type: 'pending',
            };
        }

        if (response.code === 201) {
            const listResponseSchema = z.string().min(1);
            const data = listResponseSchema.parse(response.data);
            return {
                type: 'ready',
                data: data as T,
            };
        }

        throw new UnexpectedResponseError(response);
    }
}
