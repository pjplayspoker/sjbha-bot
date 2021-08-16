import { db } from '@sjbha/app';
import { FilterQuery } from 'mongodb';
import { nanoid } from 'nanoid';
import { variantModule, TypeNames, VariantOf, fields, variantList } from 'variant';
import { EventEmitter } from 'tsee';
import { DateTime } from 'luxon';

const collection = db<AllSchemas> ('meetups');

export const events = new EventEmitter<{
  'change': () => void;
}>();

export type MeetupProps = {
  organizerId: string;
  title: string;
  description: string;
  timestamp: string;
  location?: Location;
  links: Link[];
}

export type Meetup = MeetupProps & {
  id: string;
  state: MeetupState;
  announcement: AnnouncementState;
}

export type Location = { 
  type: 'ADDRESS' | 'PRIVATE' | 'VOICE';
  value: string;
  comments?: string;
}

export type Link = {
  name?: string;
  url: string;
}

export const AnnouncementState = variantModule ({
  pending:       fields<{ channelId: string }> (),
  inChannel:     fields<{ channelId: string, messageId: string }> (),
  announcements: fields<{ announcementId: string; rsvpId: string; }> ()
});

export type AnnouncementState<T extends TypeNames<typeof AnnouncementState> = undefined> 
  = VariantOf<typeof AnnouncementState, T>;

export const MeetupState = variantModule ({
  created:   {},
  cancelled: (reason: string) => ({ 
    reason,
    cancelledOn: DateTime.now ()
      .toUTC ()
      .toISO ()
  }),
  ended: {}
});

export type MeetupState<T extends TypeNames<typeof MeetupState> = undefined> 
  = VariantOf<typeof MeetupState, T>;

export type MeetupSchema = Meetup & {
  __version: 1;
};

type AllSchemas = 
  | MeetupSchema 
  | Schema__V0;

export async function insert(options: Meetup) : Promise<MeetupSchema> {
  const meetup: MeetupSchema = {
    ...options,
    __version: 1,
    id:        nanoid ()
  };

  await collection ().insertOne (meetup);
  events.emit ('change');

  return meetup;
}

export async function update(meetup: MeetupSchema) : Promise<MeetupSchema> {
  await collection ().replaceOne ({ id: meetup.id }, meetup);

  return meetup;
}

export const find = (q: FilterQuery<MeetupSchema> = {}) : Promise<MeetupSchema[]> =>
  collection ()
    .find (q)
    .toArray ()
    .then (meetups => meetups.map (migrate));
    

// --------------------------------------------------------------------------------
//
// Migrations
//
// --------------------------------------------------------------------------------


const migrate = (model: AllSchemas) : MeetupSchema => {
  if (!('__version' in model)) {
    return migrations.v0 (model);
  }

  return model;
}

const migrations = {
  v0: (model: Schema__V0) : MeetupSchema => ({
    __version:   1,
    id:          model.id,
    title:       model.options.name,
    description: model.options.description,
    organizerId: model.userID,
    
    // TODO: MAKE SURE TIME IS FORMATTED properly
    timestamp: model.timestamp,
    
    location: (model.options.location)
      ? { type: 'ADDRESS', value: model.options.location }
      : undefined,
      
    links: (model.options.url)
      ? [{ url: model.options.url }]
      : [],

    state: MeetupState.created (),
    
    announcement: AnnouncementState.announcements ({
      announcementId: model.info_id,
      rsvpId:         model.rsvp_id
    })
  })
}

type Schema__V0 = {
  id: string;
  date: string;
  timestamp: string;
  info: string;
  userID: string;
  username: string;
  sourceChannelID: string;
  state: string;
  info_id: string;
  rsvp_id: string;
  options: {
    date: string;
    name: string;
    description: string;
    location: string;
    url: string;
    type: string;
  }
};