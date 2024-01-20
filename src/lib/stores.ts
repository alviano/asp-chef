import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { consts } from "$lib/consts";
import {v4 as uuidv4} from 'uuid';

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
export const registered_javascript = writable(browser ? JSON.parse(localStorage.getItem('registered-javascript') || "{}") : {});
export const registered_recipes = writable(browser ? JSON.parse(localStorage.getItem('registered-recipes') || "{}") : {});
export const baking_delay = writable(int_in_range_or_default('baking-delay', consts.BAKING_DELAY_MIN_VALUE, consts.BAKING_DELAY_MAX_VALUE, consts.BAKING_DELAY_DEFAULT_VALUE));
export const clingo_remote_uuid = writable((browser ? localStorage.getItem('clingo-remote-uuid') : '') || uuidv4());
export const clingo_remote_url = writable((browser ? localStorage.getItem('clingo-remote-url') : '') || 'http://localhost:8000');
export const clingo_remote_on = writable((browser ? localStorage.getItem('clingo-remote-on') : 'false') === 'true');
export const github_api_token = writable((browser ? localStorage.getItem('github-api-token') : '') || '');
export const github_username = writable((browser ? localStorage.getItem('github-username') : '') || '');
export const github_repository = writable((browser ? localStorage.getItem('github-repository') : '') || '');
export const github_path = writable((browser ? localStorage.getItem('github-slug') : '') || '');

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

registered_javascript.subscribe(value => {
  localStorage.setItem('registered-javascript', JSON.stringify(value));
});

registered_recipes.subscribe(value => {
  localStorage.setItem('registered-recipes', JSON.stringify(value));
});

baking_delay.subscribe(value => {
  localStorage.setItem('baking-delay', '' + value);
});

clingo_remote_uuid.subscribe(value => {
  localStorage.setItem('clingo-remote-uuid', '' + value);
});

clingo_remote_url.subscribe(value => {
  localStorage.setItem('clingo-remote-url', '' + value);
});

clingo_remote_on.subscribe(value => {
  localStorage.setItem('clingo-remote-on', '' + value);
});

github_api_token.subscribe(value => {
  localStorage.setItem('github-api-token', '' + value);
});

github_username.subscribe(value => {
  localStorage.setItem('github-username', '' + value);
});

github_repository.subscribe(value => {
  localStorage.setItem('github-repository', '' + value);
});

github_path.subscribe(value => {
  localStorage.setItem('github-slug', '' + value);
});
