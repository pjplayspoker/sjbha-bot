import { z } from 'zod';
import { timestamp } from '@sjbha/utils/zod';
import { DateTime } from 'luxon';

const MAX_DESCRIPTION_SIZE = 2000;

/**
 * The options that a user passes in when creating or editing a meetup
 */
export const MeetupOptions = z.object ({
  title: z.string ()
    .transform (t => t.trim ()),

  description: z.string ()
    .refine (d => d.length <= MAX_DESCRIPTION_SIZE, d => ({ message: `Description is too long. Max limit is ${MAX_DESCRIPTION_SIZE}, your description is ${d.length}` })),

  date: timestamp
    .refine (d => d.toMillis () > DateTime.utc ().toMillis (),  'Can\'t create a meetup that is set to the past')
});

export type MeetupOptions = z.infer<typeof MeetupOptions>;