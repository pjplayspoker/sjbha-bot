import { db } from '@sjbha/app';
import { FilterQuery } from 'mongodb';
import { variantModule, TypeNames, VariantOf } from 'variant';
import { EventEmitter } from 'tsee';
import { DateTime } from 'luxon';

const collection = db<AllSchemas> ('meetups');

export const events = new EventEmitter<{
  'change': () => void;
}>();

export const Location = variantModule ({
  None:    {},
  Address: (value: string, comments ='') => ({ value, comments }),
  Private: (value: string, comments ='') => ({ value, comments }),
  Voice:   {}
});

export type Location<T extends TypeNames<typeof Location> = undefined> 
  = VariantOf<typeof Location, T>;


export type Link = {
  name?: string;
  url: string;
}

export const Link = (name: string, url: string) : Link => ({ name, url });

export type Details = {
  organizerId: string;
  title: string;
  timestamp: DateTime;
  description: string;
  location: Location;
  links: Link[];
}

export const Details = (props: Details) : Details => props;

export const AnnouncementType = variantModule ({
  Pending:      (channelId: string) => ({ channelId }),
  Inline:       (channelId: string, messageId: string) => ({ channelId, messageId }),
  Announcement: (announcementId: string, rsvpId: string) => ({ announcementId, rsvpId })
});

export type AnnouncementType<T extends TypeNames<typeof AnnouncementType> = undefined> 
  = VariantOf<typeof AnnouncementType, T>;

export const MeetupState = variantModule ({
  Created:   {},
  Cancelled: (reason: string) => ({ 
    reason,
    cancelledOn: DateTime.now ()
      .toUTC ()
      .toISO ()
  }),
  Ended: {}
});

export type MeetupState<T extends TypeNames<typeof MeetupState> = undefined> 
  = VariantOf<typeof MeetupState, T>;

export type Meetup = {
  id: string;
  details: Details;
  state: MeetupState;
  announcement: AnnouncementType;
}

export const Meetup = (meetup: Meetup) : Meetup => meetup;
  
export type Schema = Meetup & { __version: 1 };

type AllSchemas = 
  | Schema 
  | Schema__V0;

      
const schemaToMeetup = ({ __version, ...schema }: Schema) : Meetup => schema;

const meetupToSchema = (meetup: Meetup) : Schema => ({ __version: 1, ...meetup });

export async function insert(meetup: Meetup) : Promise<Meetup> {
  await collection ().insertOne (meetupToSchema (meetup));
  events.emit ('change');

  return meetup;
}

export async function update(meetup: Meetup) : Promise<Meetup> {
  await collection ().replaceOne ({ id: meetup.id }, meetupToSchema (meetup));

  return meetup;
}

export const find = (q: FilterQuery<Schema> = {}) : Promise<Meetup[]> =>
  collection ()
    .find (q)
    .toArray ()
    .then (meetups => meetups.map (migrate))
    .then (meetups => meetups.map (schemaToMeetup));



// --------------------------------------------------------------------------------
//
// Migrations
//
// --------------------------------------------------------------------------------


const migrate = (model: AllSchemas) : Schema => {
  if (!('__version' in model)) {
    return migrate ({
      __version: 1,
      id:        model.id,
      details:   Details ({
        title:       model.options.name,
        description: model.options.description,
        organizerId: model.userID,
        
        // TODO: MAKE SURE TIME IS FORMATTED properly
        timestamp: DateTime.fromISO (model.timestamp),
        
        location: (model.options.location)
          ? Location.Address (model.options.location)
          : Location.None (),
          
        links: (model.options.url)
          ? [{ url: model.options.url }]
          : [],
      }),
  
      state: MeetupState.Created (),
      
      announcement: AnnouncementType.Announcement (model.info_id, model.rsvp_id)
    });
  }

  return model;
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