import { MessageHandler } from '@sjbha/app';
import parseMessageOptions from '@sjbha/utils/message-parser';
import { formatErrors } from '@sjbha/utils/zod';

import { MeetupOptions } from '../core/MeetupOptions';
import Announcement from '../core/Announcement';


/**
 * Creates a new meetup
 */
export const create : MessageHandler = async (message) => {
  const messageOptions = parseMessageOptions (message.content);
  const input = MeetupOptions.safeParse (messageOptions);

  if (!input.success) {
    const [firstError] = formatErrors (input.error);
    message.channel.send (`Meetup wasn't created: ${firstError}`);

    return;
  }

  await Announcement.post (message.channel.id, {
    title:       input.data.title,
    description: input.data.description,
    timestamp:   input.data.date.toISO (),
    organizerId: message.author.id
  });
}