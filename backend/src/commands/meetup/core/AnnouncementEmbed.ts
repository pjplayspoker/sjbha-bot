import { EmbedField, MessageEmbed } from 'discord.js';
import { Option } from 'prelude-ts';
import { DateTime } from 'luxon';
import { match } from 'variant';
import { Link, Location, MeetupProps } from '../db/meetups';


function linkify(url: string, name?: string) : string {
  if (!name)
    return url;

  return `[${name}](${url})`;
}


export default class AnnouncementEmbed {
  private readonly meetup : MeetupProps;

  readonly embed: MessageEmbed;

  constructor(meetup: MeetupProps) {
    this.meetup = meetup;
    this.embed = this.create ();
  }

  create() : MessageEmbed {
    const embed = new MessageEmbed ({
      title:       this.meetup.title,
      description: this.meetup.description,
      fields:      [
        { name: 'Organized By', value: 's3b', inline: true }
      ]
    });

    const timestamp = DateTime
      .fromISO (this.meetup.timestamp)
      .toLocaleString ({ 
        weekday: 'short', month:   'short', 
        day:     '2-digit', hour:    '2-digit', minute:  '2-digit' 
      });

    embed.addField ('Time', timestamp, true);


    if (this.meetup.location) {
      let location = match (this.meetup.location, {
        ADDRESS: ({ value }) => {
          const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent (value)}`;

          return linkify (url, value);
        },
        PRIVATE: ({ value }) => value,
        VOICE:   _ => 'Voice Chat'
      });

      if (this.meetup.location.comments) {
        location += '\n' + this.meetup.location.comments;
      }

      embed.addField ('Location', location, true);
    }


    const links = [
      ...this.meetup.links.map (link => linkify (link.url, link.name)),
      linkify ('Add to Google Calendar', 'https://www.google.com')
    ];

    embed.addField ('Links', links.join ('\n'), true);

    return embed;
  }

  addRsvpList(nicknames: string[], title: string) : void {
    const list = (nicknames.length)
      ? nicknames.map (n => '> ' + n)
      : ['> -'];

    this.embed.addField (title, list.join ('\n'), true);
  }
}