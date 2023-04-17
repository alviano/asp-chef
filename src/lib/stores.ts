import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const privacy_policy = writable(browser ? localStorage.getItem('privacy-policy') : '');
export const pause_baking = writable(false);
export const recipe = writable([]);
export const show_ingredient_details = writable(true);
export const errors_at_index = writable([]);
export const processing_index = writable(1);

privacy_policy.subscribe(value => {
  if (value) {
    localStorage.setItem('privacy-policy', value);
  }
});
