import { MessageEmbed } from 'discord.js';
import { url } from 'inspector';
import { DateTime } from 'luxon';
import { match } from 'variant';
import { MeetupProps } from '../db/meetups';

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
      description: this.meetup.description
    });
  
    const timestamp = DateTime
      .fromISO (this.meetup.timestamp)
      .toLocaleString ({ 
        weekday: 'short', month:   'short', 
        day:     '2-digit', hour:    '2-digit', minute:  '2-digit' 
      });
  
    embed.addField ('Time', timestamp, true);
    embed.addField ('Organized By', 's3b', true);

    if (this.meetup.location) {
      const location = this.meetup.location.value;
      const comments = this.meetup.location.comments || '';

      embed.addField ('Location', match (this.meetup.location, {
        ADDRESS: _ => {
          const encoded = encodeURIComponent (location);
          const url = `https://www.google.com/maps/search/?api=1&query=${encoded}`;

          return `[${location}](${url})` + '\n' + comments;
        },

        PRIVATE: _ => location + '\n' + comments,

        VOICE: _ => 'Voice Chat'
      }));
    }

    if (this.meetup.links.length) {
      const links = this.meetup.links.map (({ name, url }) => (name)
        ? `[${name}](${url})`
        : url
      );

      embed.addField ('Links', [
        ...links,
        '[Add to Google Calendar](https://www.gmail.com "Testing a tooltip")'
      ].join ('\n'));
    }

    return embed;
  }

  addRsvpList(nicknames: string[], title: string) : void {
    const list = (nicknames.length)
      ? nicknames.map (n => '> ' + n)
      : ['> -'];

    this.embed.addField (title, list.join ('\n'), true);
  }
}