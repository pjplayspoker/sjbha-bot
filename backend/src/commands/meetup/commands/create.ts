import { MessageHandler } from '@sjbha/app';
import YAML from 'yaml';

import { mapOptionsToMeetup, ValidationError } from '../common/MeetupOptions';
import Meetup from '../announcement/Meetup';


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

  await message.delete ();
  await Meetup.post (message.channel.id, message.author.id, meetup);
}