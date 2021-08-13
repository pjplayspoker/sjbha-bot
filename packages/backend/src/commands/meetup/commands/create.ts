import { MessageHandler } from '@sjbha/app';
import { formatErrors } from '@sjbha/utils/zod';
import YAML from 'yaml';

import { Location, MeetupProps } from '../db/meetups';
import { mapOptionsToMeetup, ValidationError } from '../core/MeetupOptions';
import Announcement from '../core/Announcement';


/**
 * Creates a new meetup
 */
export const create : MessageHandler = async (message) => {
  const options = message.content.replace ('!meetup create', '');
  const messageOptions = YAML.parse (options);

  const meetup = mapOptionsToMeetup (messageOptions);
  
  if (meetup instanceof ValidationError) {
    return;
  }


  await Announcement.post (message.channel.id, message.author.id, meetup);
}