import { db } from '@sjbha/app';
import { FilterQuery } from 'mongodb';
import { nanoid } from 'nanoid';
import { variantModule, TypeNames, VariantOf, fields } from 'variant';
import { EventEmitter } from 'tsee';

const collection = db<AllSchemas> ('meetups');

export const events = new EventEmitter<{
  'change': () => void;
}>();

export type MeetupProps = {
  title: string;
  description: string;
  timestamp: string;
  organizerId: string;
};


export const AnnouncementState = variantModule ({
  inChannel:     fields<{ channelId: string, messageId: string }> (),
  announcements: fields<{ announcementId: string; rsvpId: string; }> ()
});

export type AnnouncementState<T extends TypeNames<typeof AnnouncementState> = undefined> 
  = VariantOf<typeof AnnouncementState, T>;


export type Meetup = MeetupProps & {
  __version: 1;
  id: string;
  announcement: AnnouncementState;
};

type AllSchemas = 
  | Meetup 
  | Schema__V0;

export async function insert(options: MeetupProps, channelId: string, messageId: string) : Promise<Meetup> {
  const meetup: Meetup = {
    ...options,
    __version:    1,
    id:           nanoid (),
    announcement: AnnouncementState.inChannel ({ channelId, messageId })
  };

  await collection ().insertOne (meetup);
  events.emit ('change');

  return meetup;
}

export const find = (q: FilterQuery<Meetup> = {}) : Promise<Meetup[]> =>
  collection ()
    .find (q)
    .toArray ()
    .then (meetups => meetups.map (migrate));
    

// --------------------------------------------------------------------------------
//
// Migrations
//
// --------------------------------------------------------------------------------


const migrate = (model: AllSchemas) : Meetup => {
  if (!('__version' in model)) {
    return migrations.v0 (model);
  }

  return model;
}

const migrations = {
  v0: (model: Schema__V0) : Meetup => ({
    __version:   1,
    id:          model.id,
    title:       model.options.name,
    description: model.options.description,
    organizerId: model.userID,
    // TODO: MAKE SURE TIME IS FORMATTED properly
    timestamp:   model.timestamp,
    
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