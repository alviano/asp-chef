// src/lib/operations/@DTDL/azure_dt.ts

export class AzureDT {
    public static STORAGE_CREDENTIALS_KEY() {
        return '@DTDL/Azure credentials';
    }

    public static credentials_in_session_storage() {
        return JSON.parse(sessionStorage.getItem(AzureDT.STORAGE_CREDENTIALS_KEY()) || 'null');
    }

    public static credentials_in_local_storage() {
        return JSON.parse(localStorage.getItem(AzureDT.STORAGE_CREDENTIALS_KEY()) || 'null');
    }

    public static save_credentials_in_session_storage(tenant_id: string, client_id: string, client_secret: string) {
        sessionStorage.setItem(AzureDT.STORAGE_CREDENTIALS_KEY(), JSON.stringify({ tenant_id, client_id, client_secret }));
    }

    public static save_credentials_in_local_storage(tenant_id: string, client_id: string, client_secret: string) {
        localStorage.setItem(AzureDT.STORAGE_CREDENTIALS_KEY(), JSON.stringify({ tenant_id, client_id, client_secret }));
        AzureDT.save_credentials_in_session_storage(tenant_id, client_id, client_secret);
    }

    public static remove_credentials() {
        sessionStorage.removeItem(AzureDT.STORAGE_CREDENTIALS_KEY());
        localStorage.removeItem(AzureDT.STORAGE_CREDENTIALS_KEY());
    }

    public static get_credentials(): { tenant_id: string; client_id: string; client_secret: string } | null {
        return AzureDT.credentials_in_session_storage() || AzureDT.credentials_in_local_storage();
    }

    // Token cache in memory (does not persist across reloads)
    private static _token: string | null = null;
    private static _token_expires_at: number = 0;

    public static async get_token(): Promise<string> {
        const now = Date.now();
        if (AzureDT._token && now < AzureDT._token_expires_at - 60_000) {
            return AzureDT._token;
        }

        const creds = AzureDT.get_credentials();
        if (!creds) {
            throw new Error('No Azure credentials found. Please use @DTDL/RegisterAzureKey first.');
        }

        const { tenant_id, client_id, client_secret } = creds;
        const body = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id,
            client_secret,
            scope: 'https://digitaltwins.azure.net/.default',
        });

        const response = await fetch(
            `https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/token`,
            { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }
        );

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Azure AD token error (${response.status}): ${err}`);
        }

        const data = await response.json();
        AzureDT._token = data.access_token;
        AzureDT._token_expires_at = now + data.expires_in * 1000;
        return AzureDT._token!;
    }

    // Query all twins (handles pagination via continuationToken)
    public static async query_twins(endpoint: string, api_version: string, query: string): Promise<any[]> {
        const token = await AzureDT.get_token();
        const url = `${endpoint}/query?api-version=${api_version}`;
        let results: any[] = [];
        let continuationToken: string | null = null;

        do {
            const body: any = { query };
            if (continuationToken) body.continuationToken = continuationToken;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Azure DT query error (${response.status}): ${err}`);
            }

            const data = await response.json();
            results = results.concat(data.value || []);
            continuationToken = data.continuationToken || null;
        } while (continuationToken);

        return results;
    }

    // Fetch all relationships for a twin (handles pagination)
    public static async get_relationships(endpoint: string, api_version: string, twin_id: string): Promise<any[]> {
        let results: any[] = [];
        let continuationToken: string | null = null;
        let pageCount = 0;

        do {
            if (pageCount >= 1000) {
                throw new Error('get_relationships: pagination limit exceeded (1000 pages)');
            }
            pageCount++;

            const token = await AzureDT.get_token();
            let url = `${endpoint}/digitaltwins/${encodeURIComponent(twin_id)}/relationships?api-version=${api_version}`;
            if (continuationToken) url += `&continuationToken=${encodeURIComponent(continuationToken)}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Azure DT get_relationships error (${response.status}): ${err}`);
            }

            const data = await response.json();
            results = results.concat(data.value || []);
            continuationToken = (typeof data.continuationToken === 'string' && data.continuationToken) ? data.continuationToken : null;
        } while (continuationToken);

        return results;
    }

    // Patch a twin property
    public static async patch_twin(
        endpoint: string,
        api_version: string,
        twin_id: string,
        patches: Array<{ op: string; path: string; value: any }>
    ): Promise<void> {
        const token = await AzureDT.get_token();
        const url = `${endpoint}/digitaltwins/${encodeURIComponent(twin_id)}?api-version=${api_version}`;

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json-patch+json',
            },
            body: JSON.stringify(patches),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Azure DT patch error (${response.status}): ${err}`);
        }
    }

}
