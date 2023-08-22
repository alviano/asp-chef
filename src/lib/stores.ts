import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { consts } from "$lib/consts";

function int_in_range_or_default(key, min, max, default_value) {
  if (!browser) {
    return default_value;
  }
  const value = localStorage.getItem(key);
  return value >= min && value <= max ? value : default_value;
}

export const privacy_policy = writable(browser ? localStorage.getItem('privacy-policy') : '');
export const pause_baking = writable(false);
export const recipe = writable([]);
export const show_ingredient_details = writable(true);
export const errors_at_index = writable([]);
export const processing_index = writable(1);
export const drag_disabled = writable(true);
export const show_help = writable(true);
export const readonly_ingredients = writable(false);
export const show_ingredient_headers = writable(true);
export const operations_panel_width = writable(int_in_range_or_default('operations-panel-width', consts.OPERATIONS_PANEL_MIN_VALUE, consts.OPERATIONS_PANEL_MAX_VALUE, consts.OPERATIONS_PANEL_DEFAULT_VALUE));
export const io_panel_width = writable(int_in_range_or_default('io-panel-width', consts.IO_PANEL_MIN_VALUE, consts.IO_PANEL_MAX_VALUE, consts.IO_PANEL_DEFAULT_VALUE));
export const input_height = writable(int_in_range_or_default('input-height', consts.INPUT_HEIGHT_MIN_VALUE, consts.INPUT_HEIGHT_MAX_VALUE, consts.INPUT_HEIGHT_DEFAULT_VALUE));

privacy_policy.subscribe(value => {
  if (value) {
    localStorage.setItem('privacy-policy', value);
  }
});

operations_panel_width.subscribe(value => {
  if (value) {
    localStorage.setItem('operations-panel-width', '' + value);
  }
});

io_panel_width.subscribe(value => {
  if (value) {
    localStorage.setItem('io-panel-width', '' + value);
  }
});

input_height.subscribe(value => {
  if (value) {
    localStorage.setItem('input-height', '' + value);
  }
});
