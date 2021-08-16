import { Collection, MessageEmbed, User } from 'discord.js';
import { Option } from 'prelude-ts';
import { lookup, match } from 'variant';
import { DateTime } from 'luxon';
import * as MeetupsDb from '../db/meetups';


const linkify = (url: string, name?: string) : string =>
  (!name) ? url : `[${name}](${url})`;

export type Reaction = {
  emoji: string;
  name: string;
  users: Collection<string, User>;
}

export const Reaction = (emoji: string, name: string, users: Collection<string, User>): Reaction =>
  ({ emoji, name, users });

/**
 * Represents the meetup announcement, and should be regarded as the source of truth for meetup data
 */
export default class AnnouncementEmbed {

  private meetup: MeetupsDb.Meetup;

  private reactions: Reaction[];

  get title() : string {
    return this.meetup.title;
  }

  get time() : string {
    return DateTime
      .fromISO (this.meetup.timestamp)
      .toLocaleString ({ weekday: 'long', month: 'long',  day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  get location() : Option<string> {
    const location = Option.of (this.meetup.location);

    const comments = location
      .mapNullable (({ comments }) => '\n' + comments)
      .getOrElse ('');

    const value =  location.map (location => lookup (location, {
      ADDRESS: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent (location.value)}`,
      PRIVATE: location.value,
      VOICE:   'Voice Chat'
    }));

    return value.map (str => str + comments);
  }

  get links(): string {
    const userlinks = this.meetup.links.map (link => linkify (link.url, link.name));
    const gcalLink = linkify ('https://www.google.com', 'Add to Google Calendar');

    return [...userlinks, gcalLink].join ('\n');
  }

  private constructor(meetup: MeetupsDb.Meetup, reactions: Reaction[]) {
    this.meetup = meetup;
    this.reactions = reactions;
  }

  private render() : MessageEmbed {
    return match (this.meetup.state, {
      created:   _ => this.announcement (),
      cancelled: ({ reason }) => this.cancelledAnnouncement (reason),
      // todo: Update to a different design
      ended:     _ => this.announcement ()
    })
  }
  
  private announcement() : MessageEmbed {
    const meetup = this.meetup;
  
    const reactions = this.reactions.map (reaction => {
      let name = `${reaction.emoji} ${reaction.name}`;

      const users = reaction.users.mapValues (u => u.username).array ();
      const value = (users.length)
        ? users.join ('\n')
        : '-';

      if (users.length) {
        name += ` (${users.length})`;
      }

      return { name, value, inline: true }
    });

    return new MessageEmbed ({
      title:       meetup.title,
      description: meetup.description,
      
      fields: [
        { 
          name:   'Organized By', 
          value:  `<@${this.meetup.organizerId}>`, 
          inline: true 
        },

        ...(this.location.map (value => [{ 
          name: 'Location', 
          value 
        }]).getOrElse ([])),

        { name: 'Time', value: this.time },
        { name: 'Links',  value: this.links },
        ...reactions
      ]
    })
  }

  private cancelledAnnouncement(reason: string) : MessageEmbed {
    return new MessageEmbed ({
      title:  '~~' + this.title + '~~',
      fields: [
        {
          name:  '🚫 Meetup was cancelled',
          value: reason
        }
      ]
    });
  }

  static create (meetup: MeetupsDb.Meetup, reactions: Reaction[]) : MessageEmbed {
    return new AnnouncementEmbed (meetup, reactions).render ();
  }
}