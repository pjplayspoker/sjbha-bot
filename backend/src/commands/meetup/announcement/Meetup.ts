import { Collection, Message, MessageEmbed } from 'discord.js';
import { Option } from 'prelude-ts';
import { isType, lookup, match } from 'variant';
import { DateTime } from 'luxon';

import { Instance } from '@sjbha/app';

import * as MeetupsDb from '../db/meetups';
import type { MeetupProps } from '../db/meetups';

import RsvpManager from './RsvpManager';


const linkify = (url: string, name?: string) : string =>
  (!name) ? url : `[${name}](${url})`;

/**
 * Represents the meetup announcement, and should be regarded as the source of truth for meetup data
 */
export default class Meetup {
  // We need to maintain a cache of Announcements 
  // because they need to listen to react events
  private static cache = new Collection<string, Meetup> ();

  private meetup: MeetupsDb.MeetupSchema;

  private readonly message: Message;

  private readonly rsvps: RsvpManager;

  get id() : string {
    return this.meetup.id;
  }

  get title() : string {
    return this.meetup.title;
  }

  get organizerId() : string {
    return this.meetup.organizerId;
  }

  /** Whether this meetup is still something you can plan on attending */
  get isLive() : boolean {
    return isType (this.meetup.state, MeetupsDb.MeetupState.created);
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

  private constructor(meetup: MeetupsDb.MeetupSchema, rsvps: RsvpManager, message: Message) {
    this.meetup = meetup;
    this.rsvps = rsvps;
    this.message = message;

    this.render ();
    rsvps.events.on ('change', () => this.render ());
  }

  private async render() : Promise<void> {
    const embed = match (this.meetup.state, {
      created:   _ => this.announcement (),
      cancelled: ({ reason }) => this.cancelledAnnouncement (reason),
      // todo: Update
      ended:     _ => this.announcement ()
    })

    await this.message.edit ({
      content: '',
      embed
    });
  }
  
  private announcement() : MessageEmbed {
    const meetup = this.meetup;
  
    // todo: MOVE
    const attending = this.rsvps.attendees
      .mapValues (u => u.nickname)
      .array ();

    const attendingCount = attending.length
      ? `(${attending.length})`
      : '';

    const maybes = this.rsvps.maybes
      .mapValues (u => u.nickname)
      .array ();

    const maybeCount = maybes.length
      ? `(${maybes.length})`
      : '';

    return new MessageEmbed ({
      title:       meetup.title,
      description: meetup.description,
      fields:      [
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

        {
          name:   `${this.rsvps.emojis.attending} Going! ${attendingCount}`,
          value:  attending.length ? attending.join ('\n') : '-',
          inline: true
        },

        {
          name:   `${this.rsvps.emojis.maybe} Maybe ${maybeCount}`,
          value:  maybes.length ? maybes.join ('\n') : '-',
          inline: true
        }
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

  // todo
  edit() : void { /** */ }

  async cancel(reason: string) : Promise<void> {
    const updated = await MeetupsDb.update ({
      ...this.meetup,
      state: MeetupsDb.MeetupState.cancelled (reason)
    });

    this.meetup = updated;
    await this.render ();
  }

  /**
   * Post a new meetup to a channel
   * 
   * @param channelId The channel the meetup should be posted in
   * @param props The options for creating a meetup
   */
  static async post (channelId: string, organizerId: string, props: MeetupProps) : Promise<Meetup> {
    const message = await Instance
      .fetchChannel (channelId)
      .then (c => c.send ('*Creating Meetup*'));

    const rsvps = await RsvpManager.setupReactions (message);
    const meetup = await MeetupsDb.insert ({
      ...props,
      organizerId,
      state:        MeetupsDb.MeetupState.created (),
      announcement: MeetupsDb.AnnouncementState.inChannel ({
        channelId,
        messageId: message.id
      })
    });

    const announcement = new Meetup (meetup, rsvps, message);
    Meetup.cache.set (announcement.id, announcement);
    
    return announcement;
  }

  /**
   * Fetches all meetups from the database and instantiates the Announcement cache
   * 
   * This is necessary because we need to load all old messages to listen
   * to reaction events and any changes
   */
  static async updateCache() : Promise<void> {
    Meetup.cache = new Collection<string, Meetup> ();

    const meetups = await MeetupsDb.find ();

    for (const meetup of meetups) {
      const message = await match (meetup.announcement, {
        inChannel: ({ channelId, messageId }) =>
          Instance.fetchMessage (channelId, messageId),
  
        announcements: _ => {
          throw new Error ('Not yet implemented');
        }
      });

      const rsvps = await RsvpManager.fromExisting (message);
      const announcement = new Meetup (meetup, rsvps, message);
      Meetup.cache.set (announcement.id, announcement);
    }
  }

  static get count() : number {
    return Meetup.cache.size;
  }

  static find(f: (a: Meetup) => boolean) : Collection<string, Meetup> {
    return Meetup.cache.filter (announcement => f (announcement));
  }
}