import { MessageHandler } from '@sjbha/app';
import { formatErrors } from '@sjbha/utils/zod';
import YAML from 'yaml';

import { Location, MeetupProps } from '../db/meetups';
import { MeetupOptions } from '../core/MeetupOptions';
import Announcement from '../core/Announcement';


/**
 * Creates a new meetup
 */
export const create : MessageHandler = async (message) => {
  const options = message.content.replace ('!meetup create', '');
  const messageOptions = YAML.parse (options);
  
  const input = MeetupOptions.safeParse (messageOptions);

  if (!input.success) {
    const [firstError] = formatErrors (input.error);
    message.channel.send (`Meetup wasn't created: ${firstError}`);

    return;
  }

  const meetup : MeetupProps = {
    title:       input.data.title,
    description: input.data.description,
    timestamp:   input.data.date.toISO (),
    organizerId: message.author.id,
    links:       input.data.links || []
  };

  if (input.data.location_type) {
    const type : Record<string, Location['type']> = {
      'address': 'ADDRESS',
      'private': 'PRIVATE',
      'voice':   'VOICE'
    };

    meetup.location = {
      type:  type[input.data.location_type] || 'NONE',
      value: input.data.location || 'Unknown'
    };

    if (input.data.location_comments)
      meetup.location.comments = input.data.location_comments;
  }


  await Announcement.post (message.channel.id, meetup);
}