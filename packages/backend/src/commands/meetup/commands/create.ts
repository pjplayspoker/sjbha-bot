import { MessageHandler } from '@sjbha/app';
import { MessageEmbed } from 'discord.js';
import parseMessageOptions from '@sjbha/utils/message-parser';
import { formatErrors } from '@sjbha/utils/zod';
import { MeetupOptions } from '../common/MeetupOptions';

const emoji = {
  rsvp:  '✅',
  maybe: '🤔'
};

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

  const options = input.data;
  const embed = new MessageEmbed ();

  embed.setTitle (options.title);
  embed.setDescription (options.description);

  const date = options.date.toLocaleString ({ 
    weekday: 'short', 
    month:   'short', 
    day:     '2-digit', 
    hour:    '2-digit', 
    minute:  '2-digit' 
  });

  embed.addField ('Time', date, true);

  embed.addField (`${emoji.rsvp} Yes`, 'some list', true);
  embed.addField (`${emoji.maybe} Maybe`, 'some list', true);

  // Post the announcement
  const announcement = await message.channel.send (embed);
  await announcement.react (emoji.rsvp);
  await announcement.react (emoji.maybe);
}