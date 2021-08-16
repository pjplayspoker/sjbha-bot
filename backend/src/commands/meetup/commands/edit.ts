import { MessageHandler, env } from '@sjbha/app';
import { Interaction } from '@sjbha/utils/interaction';
import { MessageEmbed } from 'discord.js';
import YAML from 'yaml';

import Meetup from '../core/Meetup';
import { mapOptionsToMeetup, ValidationError } from '../common/MeetupOptions';

/**
 * Will either try to update a meetup, or get a link to edit a meetup
 * If used alone (!meetup edit) will query user to pick a meetup
 * If passed with options (!meetup edit id: __) will try to update the meetup
 */
export const edit : MessageHandler = message =>
  message.content.split (' ').length > 2
    ? updateMeetup (message)
    : getEditLink (message);

/**
 * Cancel a meetup
 */
const updateMeetup : MessageHandler = async (message) => {
  const inputText = message.content.replace ('!meetup edit', '');
  const { id, ...parsed } = YAML.parse (inputText);

  if (!id) {
    message.reply ('Missing ID');

    return;
  }

  const options = mapOptionsToMeetup (parsed);

  if (options instanceof ValidationError) {
    message.reply (options.error);

    return;
  }

  const meetup = Meetup.get (id);

  if (!meetup) {
    message.reply ('Could not find the meetup');

    return;
  }

  if (!meetup.isLive) {
    message.reply ('That meetup cant be edited because it has ended or has been cancelled');

    return;
  }

  const changes = await meetup.edit (options);

  const embed = new MessageEmbed ({
    description: `✨ **${meetup.title}** was updated\nChanged ` + changes
      .map (key => '`' + key + '`')
      .join (', ')
  });

  await message.delete ();
  message.channel.send (embed);
}

const getEditLink : MessageHandler = async (message) => {
  const userMeetups = Meetup.find (meetup => meetup.isLive && meetup.organizerId === message.author.id)
  
  if (!userMeetups.size) {
    message.reply ('You have no meetups to edit');

    return;
  }

  // Pick a meetup they want to cancel
  const meetupPicker = new Interaction.Options <Meetup> ('Which meetup would you like to edit?');
  userMeetups.forEach (meetup => {
    meetupPicker.addOption (meetup.time.toLocaleString () + ' ' + meetup.title, meetup)
  });

  await message.reply (meetupPicker.prompt);
  const interaction = message.channel.createMessageCollector (m => m.author.id === message.author.id);
  const meetup = await interaction.next.then (meetupPicker.get);

  if (!meetup)
    return;

  const editUrl = env.UI_HOSTNAME + '/meetup#' + meetup.id;

  const embed = new MessageEmbed ({
    description: `:pencil2: [Click here to edit '**${meetup.title}**'](${editUrl})`,
    color:       '#d7d99e'
  });

  message.channel.send (embed);
}