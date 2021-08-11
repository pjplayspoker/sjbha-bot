import { DateTime } from 'luxon';
import { derived, writable } from 'svelte/store';
import * as regex from './regex';
import { nanoid } from 'nanoid';

export const MAX_DESCRIPTION_LENGTH = 1200;

export const MAX_LOCATION_COMMENTS_LENGTH = 300;

export const title = writable ('Placeholder Meetup Title');

export const date = writable (DateTime.now ());
export const description = writable ('Lorum ipsum');

export const Location = {
  NONE:    'NONE',
  ADDRESS: 'ADDRESS',
  PRIVATE: 'PRIVATE',
  VOICE:   'VOICE'
};

export const locationType = writable (Location.ADDRESS);
export const location = writable ('1337 Willow st, San Jose, CA');
export const locationComments = writable ('');

export type Link = {
  id: string;
  name: string;
  url: string;
}

export const links = writable <Record<string, Link>> ({});

export const errors = {
  title: derived (title, val => {
    if (!val.length)
      return 'Title is required';

    return '';
  }),

  description: derived (description, val => {
    if (val.length >= MAX_DESCRIPTION_LENGTH)
      return 'Description is too long';

    return '';
  }),

  locationComments: derived (locationComments, val => {
    if (val.length >= MAX_LOCATION_COMMENTS_LENGTH)
      return 'Location Comments is too long';

    return '';
  }),

  links: derived (links, val => {
    // Lets remove the empty fieldsets
    const errors = Object
      .values (val)
      .map (link => {
        if (link.url && !regex.url.test (link.url))
          return 'Not a valid url';

        if (link.name.length && !link.url.length)
          return 'Link is missing a URL';

        return '';
      });

    return errors[0] || '';
  })
}

export const valid = derived (
  Object.values (errors),
  (errs) => !errs.some (e => e.length)
);