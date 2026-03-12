/// <reference lib="webworker" />
import { ServiceWorkerMLCEngineHandler } from '@mlc-ai/web-llm';

// 1. Give Web-LLM its native handler. It will intercept standard postMessages.
let handler: ServiceWorkerMLCEngineHandler | undefined;
try {
  handler = new ServiceWorkerMLCEngineHandler();
} catch (e) {
  console.error('AI Handler initialization failed:', e);
}

const sw = self as unknown as ServiceWorkerGlobalScope;

// 2. Create our totally private intercom that Web-LLM cannot hear.
const syncChannel = new BroadcastChannel('kitchen_state_channel');

interface KitchenState {
  activeModel: string | null;
  isBusy: boolean;
  isLoading: boolean;
  progressText: string;
  progress: number;
}

let kitchenState: KitchenState = {
  activeModel: null,
  isBusy: false,
  isLoading: false,
  progressText: '',
  progress: 0,
};

// Listen ONLY on our private channel
syncChannel.onmessage = (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'KITCHEN_REQUEST_STATE':
      syncChannel.postMessage({ type: 'KITCHEN_STATE_UPDATE', state: kitchenState });
      break;
    case 'KITCHEN_MUTATE_STATE':
      kitchenState = { ...kitchenState, ...payload };
      syncChannel.postMessage({ type: 'KITCHEN_STATE_UPDATE', state: kitchenState });
      break;
    default:
      console.warn('👨‍🍳 Service Worker: Unknown message type:', type);
  }
};

// Force the SW to update instantly in the future
sw.addEventListener('install', () => sw.skipWaiting());
sw.addEventListener('activate', (event) => {
  event.waitUntil(sw.clients.claim());
  console.log('👨‍🍳 Service Worker: Active on isolated BroadcastChannel.');
});