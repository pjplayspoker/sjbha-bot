import { MessageHandler } from '@sjbha/app';
import { nanoid } from 'nanoid';
import YAML from 'yaml';

import { mapOptionsToMeetup, ValidationError } from '../common/MeetupOptions';
import Meetup from '../core/Meetup';
import * as MeetupsDb from '../db/meetups';


/**
 * Creates a new meetup
 */
export const create : MessageHandler = async (message) => {
  const options = message.content.replace ('!meetup create', '');
  const messageOptions = YAML.parse (options);

  const meetup = mapOptionsToMeetup (messageOptions);
  
  if (meetup instanceof ValidationError) {
    message.reply (meetup.error);

    return;
  }

  await Meetup.post ({
    ...meetup,
    id:           nanoid (),
    organizerId:  message.author.id,
    state:        MeetupsDb.MeetupState.created (),
    announcement: MeetupsDb.AnnouncementState.pending ({ channelId: message.channel.id })
  });

  await message.delete ();
}