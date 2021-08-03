import { variantModule, TypeNames, VariantOf, fields } from 'variant';

export type Meetup = {
  __version: 1;
  id: string;
  title: string;
  description: string;
  timestamp: string;
  createdBy: string;
  announcementId: AnnouncementIds;
};

export const AnnouncementIds = variantModule ({
  notPosted: {},
  v1:        fields<{ messageId: string }> (),
  v0:        fields<{ announcementId: string, rsvpId: string }> ()
});

export type AnnouncementIds<T extends TypeNames<typeof AnnouncementIds> = undefined> 
  = VariantOf<typeof AnnouncementIds, T>;


// --------------------------------------------------------------------------------
//
// Migrations
//
// --------------------------------------------------------------------------------


type Versions = 
  | Meetup 
  | Schema__V0;

const migrate = (model: Versions) : Meetup => {
  if (!('__version' in model)) {
    return migrations.v0 (model);
  }

  return model;
}

const migrations = {
  v0: (model: Schema__V0) : Meetup => ({
    __version:      1,
    id:             model.id,
    title:          model.options.name,
    description:    model.options.description,
    createdBy:      model.userID,
    // TODO: MAKE SURE FORMATTING
    timestamp:      model.timestamp,
    announcementId: AnnouncementIds.v0 ({
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