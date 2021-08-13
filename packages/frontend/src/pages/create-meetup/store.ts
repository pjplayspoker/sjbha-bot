import { DateTime } from 'luxon';
import { derived, writable } from 'svelte/store';
import { address, voiceChat } from './location/LocationType';
import YAML from 'yaml';

export const MAX_DESCRIPTION_LENGTH = 1200;

export const MAX_LOCATION_COMMENTS_LENGTH = 300;

export const url = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

export type Location = { type: string; value: string; comments: string; }
export const Location = (type: string, value = '', comments = '') : Location =>
  ({ type, value, comments });

export type Link = { id: symbol, url: string; name: string; }
export const Link = (url = '', name = '') : Link => ({ id: Symbol ('ID'), url, name });
  
type Store = {
  title: string;
  date: string;
  description: string;
  location: Location | null;
  links: Map<symbol, Link>;
}

const state = writable<Store> ({
  title:       '',
  date:        DateTime.now ().toISO (),
  description: '',
  location:    null,
  links:       new Map ()
});

export const store = {
  subscribe: state.subscribe,
  set<K extends keyof Store>(key: K, value: Store[K]) : void {
    state.update (current => ({
      ...current,
      [key]: value
    }));
  }
};

export const errors = derived (state, state$ => {
  const errors = new Map<string, string> ();

  if (!state$.title)
    errors.set ('title', 'Don\'t forget to give your meetup a title');

  if (DateTime.fromISO (state$.date).toMillis () <= DateTime.now ().toMillis ())
    errors.set ('date', 'Double check the date, it looks like the one you entered has already passed');

  if (state$.description.length > MAX_DESCRIPTION_LENGTH)
    errors.set ('description', 'Description is starting to get too long to fit');

  if (state$.location && state$.location.type !== voiceChat.id) {
    if (!state$.location.value.length)
      errors.set ('location', 'Location is required');

    else if (state$.location.type === address.id && url.test (state$.location.value))
      errors.set ('location', 'You don\'t need to paste a link to the address, the bot will link it for you. All you need is the address');

    else if (state$.location.comments.length > MAX_LOCATION_COMMENTS_LENGTH)
      errors.set ('location', 'Comments are too long');
  }

  const linkErrors = new Map<symbol, string> ();
  state$.links.forEach (link => {
    if (link.name && !link.url)
      linkErrors.set (link.id, 'Don\'t forget to paste in the URL!');
    
    console.log ('test link', link);
    if (link.url && !url.test (link.url))
      linkErrors.set (link.id, 'Are you sure you copied this right? The URL doesn\'t look valid');
  });

  return {
    get:     (key: keyof Store) : string => errors.get (key) || '',
    getLink: (id: symbol) : string => linkErrors.get (id) || '',
    valid:   !errors.size && !linkErrors.size
  }
});

export const toCommand = (store: Store) : string => {
  const output : Record<string, unknown> = {};

  output.title = store.title;
  output.date = DateTime.fromISO (store.date).toUTC ().toISO ();

  if (store.description)
    output.description = store.description;
  
  if (store.location) {
    output.location_type = store.location.type;
    output.location = store.location.value;

    if (store.location.comments)
      output.location_comments = store.location.comments;
  }

  const validLinks = Array
    .from (store.links.values ())
    .filter (link => link.url.length)
    .map (({ id, ...link }) => link); // omit ID

  if (validLinks.length)
    output.links = validLinks;

  return '!meetup create' + '\n' + YAML.stringify (output);
}