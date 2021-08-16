import { DateTime } from 'luxon';
import { derived, writable } from 'svelte/store';
import { API_URL } from '../../env';
import { address, voiceChat } from './form/LocationType';

export const isEditing = writable<boolean>(false);

export const MAX_DESCRIPTION_LENGTH = 1200;

export const MAX_LOCATION_COMMENTS_LENGTH = 300;

export const url = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

export type Location = { type: string; value: string; comments: string; }
export const Location = (type: string, value = '', comments = '') : Location =>
  ({ type, value, comments });

export type Link = { id: symbol, url: string; name: string; }
export const Link = (url = '', name = '') : Link => ({ id: Symbol ('ID'), url, name });
  
export type Store = {
  id?: string;
  title: string;
  date: string;
  description: string;
  location: Location | null;
  links: Map<symbol, Link>;
}

const state = writable<Store> ({
  title: '',
  date:  DateTime.now ()
    .set ({ minute: 0 })  // Looks better in the input field
    .plus ({ hours: 1 })  // Prevents 'Meetup is in the past' error on load
    .toISO (),
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


type MeetupResponse = {
  id: string;
  details: {
    title: string;
    description: string;
    timestamp: string;
    location:
      | { type: 'None' }
      | { type: 'Address'; value: string; comments: string; }
    links: [{ name: string; url: string; }]
  }
}

export const fetchFromServer = async (id: string) : Promise<void> => {
  const meetup = await fetch(`${API_URL}/meetup/${id}`)
    .then<MeetupResponse>(r => r.json());

  console.log(meetup);
  let location : Location | null = null;

  if (meetup.details.location.type !== 'None') {
    location = Location('address', meetup.details.location.value, meetup.details.location.comments);
  }

  const linkMap = new Map <symbol, Link>();
  meetup.details.links.forEach (data => {
    const link = Link (data.url, data.name);
    linkMap.set (link.id, link);
  });

  state.set ({
    id: meetup.id,
    title: meetup.details.title,
    description: meetup.details.description,
    date: meetup.details.timestamp,
    location: location,
    links: linkMap
  });

  isEditing.set (true);
}