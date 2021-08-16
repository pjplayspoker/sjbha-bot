import { Collection, Message } from 'discord.js';
import { match } from 'variant';

import { Instance } from '@sjbha/app';

import {
  Meetup as DbMeetup,
  MeetupState,
  AnnouncementType,
  update,
  insert,
  find
} from '../db/meetups';
import * as Emojis from '../common/emojis';

import AnnouncementEmbed, { Reaction } from '../announcement/AnnouncementEmbed';
import RsvpManager from '../announcement/RsvpManager';
import { DateTime } from 'luxon';

export default class Meetup {
  // We need to maintain a cache of Announcements 
  // because they need to listen to react events
  private static cache = new Collection<string, Meetup> ();

  private meetup: DbMeetup;

  get id() : string {
    return this.meetup.id;
  }

  get organizerId() : string {
    return this.meetup.details.organizerId;
  }

  get isLive() : boolean {
    return match (this.meetup.state, {
      Created: _ => true,
      default: _ => false
    });
  }

  get time() : DateTime {
    return this.meetup.details.timestamp;
  }

  get title() : string {
    return this.meetup.details.title;
  }

  private readonly announcement: Message;

  private readonly rsvps: RsvpManager;

  constructor (meetup: DbMeetup, announcement: Message, rsvps: RsvpManager) {
    this.meetup = meetup;
    this.announcement = announcement;
    this.rsvps = rsvps;

    rsvps.events.on ('change', () => this.render ());
  }

  private async render() : Promise<void> {
    const embed = AnnouncementEmbed.create (this.meetup, []);

    await this.announcement.edit (embed);
  }

  async update (meetup: DbMeetup) : Promise<void> {
    this.meetup = meetup;
    await this.render ();
  }

  async cancel (reason: string) : Promise<void> {
    this.meetup = {
      ...this.meetup,
      state: MeetupState.Cancelled (reason)
    };

    await Promise.all ([
      update (this.meetup),
      this.render ()
    ]);
  }

  /**
   * Post a new meetup to a channel
   */
  static async post (props: DbMeetup) : Promise<Meetup> {
    const embed = AnnouncementEmbed.create (props, [
      Reaction (Emojis.RSVP, 'Attending', new Collection ()),
      Reaction (Emojis.Maybe, 'Maybe', new Collection ())
    ]);

    const channelId = match (props.announcement, {
      Pending: ({ channelId }) => channelId,
      default: _ => { throw new Error ('Meetup has already been posted'); }
    });

    const announcement = await Instance
      .fetchChannel (channelId)
      .then (c => c.send (embed));

    const data = await insert ({
      ...props,
      announcement: AnnouncementType.Inline (channelId, announcement.id)
    });

    const rsvps = await RsvpManager.fromMessage (announcement);

    const meetup = new Meetup (data, announcement, rsvps);
    Meetup.cache.set (meetup.id, meetup);
    
    return meetup;
  }

  /**
   * Fetches all meetups from the database and instantiates the Announcement cache
   * 
   * This is necessary because we need to load all old messages to listen
   * to reaction events and any changes
   */
   static async updateCache() : Promise<void> {
    Meetup.cache = new Collection ();

    const meetups = await find ();

    for (const data of meetups) {
      const announcement = await match (data.announcement, {
        Inline: ({ messageId, channelId }) => 
          Instance.fetchMessage (channelId, messageId),
  
        default: _ => { throw new Error ('Meetup wasnt created') }
      });
  
      const rsvps = await RsvpManager.fromMessage (announcement);
      const meetup = new Meetup (data, announcement, rsvps);
      await meetup.render ();

      Meetup.cache.set (meetup.id, meetup);
    }
  }

  /** How many total meetups are there (in the cache) */
  static get count() : number {
    return Meetup.cache.size;
  }

  static find(f: (a: Meetup) => boolean) : Collection<string, Meetup> {
    return Meetup.cache.filter (meetup => f (meetup));
  }
}