import { Collection, Message } from 'discord.js';
import { Instance } from '@sjbha/app';
import { match } from 'variant';

import * as MeetupsDb from '../db/meetups';
import type { MeetupProps } from '../db/meetups';

import AnnouncementEmbed from './AnnouncementEmbed';
import RsvpManager from './RsvpManager';

/**
 * Represents the meetup announcement, and should be regarded as the source of truth for meetup data
 */
export default class Announcement {
  // We need to maintain a cache of Announcements 
  // because they need to listen to react events
  private static cache = new Collection<string, Announcement> ();

  private meetup: MeetupsDb.MeetupSchema;

  private readonly message: Message;

  private readonly rsvps: RsvpManager;

  get id() : string {
    return this.meetup.id;
  }

  private constructor(meetup: MeetupsDb.MeetupSchema, rsvps: RsvpManager, message: Message) {
    this.meetup = meetup;
    this.rsvps = rsvps;
    this.message = message;

    this.updateEmbed ();
    rsvps.events.on ('change', () => this.updateEmbed ());
  }
  
  private async updateEmbed() : Promise<void> {
    const embed = new AnnouncementEmbed (this.meetup);

    const attending = this.rsvps.attendees
      .mapValues (u => u.nickname)
      .array ();

    const attendingCount = attending.length
      ? `(${attending.length})`
      : '';

    embed.addRsvpList (attending, `${this.rsvps.emojis.attending} Going! ${attendingCount}`);

    const maybes = this.rsvps.maybes
      .mapValues (u => u.nickname)
      .array ();

    const maybeCount = maybes.length
      ? `(${maybes.length})`
      : '';

    embed.addRsvpList (maybes, `${this.rsvps.emojis.maybe} Maybe ${maybeCount}`);
    
    await this.message.edit (embed);
  }

  // todo
  edit() : void { /** */ }

  // todo
  cancel() : void { /** */ }

  /**
   * Post a new meetup to a channel
   * 
   * @param channelId The channel the meetup should be posted in
   * @param props The options for creating a meetup
   */
  static async post (channelId: string, organizerId: string, props: MeetupProps) : Promise<Announcement> {
    const message = await Instance
      .fetchChannel (channelId)
      .then (c => c.send (new AnnouncementEmbed (props).embed));

    const rsvps = await RsvpManager.setupReactions (message);
    const meetup = await MeetupsDb.insert ({
      ...props,
      organizerId,
      announcement: MeetupsDb.AnnouncementState.inChannel ({
        channelId,
        messageId: message.id
      })
    });

    const announcement = new Announcement (meetup, rsvps, message);
    Announcement.cache.set (announcement.id, announcement);

    console.log ('posted', props);
    
    return announcement;
  }

  /**
   * Fetches all meetups from the database and instantiates the Announcement cache
   * 
   * This is necessary because we need to load all old messages to listen
   * to reaction events and any changes
   */
  static async loadAll() : Promise<void> {
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
      const announcement = new Announcement (meetup, rsvps, message);
      Announcement.cache.set (announcement.id, announcement);
    }
  }
}