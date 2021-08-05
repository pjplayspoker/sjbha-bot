import { MessageEmbed } from 'discord.js';
import { DateTime } from 'luxon';
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
    embed.addField ('Organized By', 's3b');
    // embed.addField ('Organized By', 's3b');

    return embed;
  }

  addRsvpList(nicknames: string[], title: string) : void {
    const list = (nicknames.length)
      ? nicknames.map (n => '> ' + n)
      : ['> -'];

    this.embed.addField (title, list.join ('\n'), true);
  }
}