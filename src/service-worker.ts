/// <reference lib="webworker" />
import { ServiceWorkerMLCEngineHandler } from '@mlc-ai/web-llm';

/**
 * ServiceWorkerMLCEngineHandler gestisce la comunicazione tra il thread principale
 * e il worker, permettendo al modello di restare caricato anche se l'utente
 * naviga tra le pagine o ricarica la tab.
 */
let handler: ServiceWorkerMLCEngineHandler | undefined;

// Inizializzazione posticipata per sicurezza
try {
	handler = new ServiceWorkerMLCEngineHandler();
} catch (e) {
	console.error('AI Handler initialization failed:', e);
}

const sw = self as unknown as ServiceWorkerGlobalScope;

// Forza il Service Worker a diventare attivo immediatamente,
// senza aspettare che le vecchie versioni vengano chiuse.
sw.addEventListener('install', () => {
	return sw.skipWaiting();
});

// Prende il controllo di tutte le tab aperte non appena attivato.
sw.addEventListener('activate', (event) => {
	event.waitUntil(sw.clients.claim());
	console.log('👨‍🍳 ASP Chef AI Service Worker: Kitchen is open and active!');
});
