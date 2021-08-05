import { Collection, Message, MessageReaction, ReactionCollector, User } from 'discord.js';
import { EventEmitter } from 'tsee';

const Emojis = {
  RSVP:  '✅',
  Maybe: '🤔'
};

/**
 * The RsvpManager's keeps track of which users RSVP to a meetup via the reactions
 * and enforces a policy that you either Rsvp or Maybe, but not both
 * 
 */
export default class RsvpManager {

  /** List of users who've reacted to one of the RSVP reactions */
  private readonly guestlist = new Collection<string, Participant> ();

  readonly events = new EventEmitter<{
    'change': () => void;
  }> ();

  /** Emits events based on new reactions */
  private readonly collector : ReactionCollector;

  /** The emoji reactions manager for "YES" */
  private readonly attendingReaction : MessageReaction;

  /** The emoji reaction manager for "MAYBE" */
  private readonly maybeReaction : MessageReaction;

  constructor (attending: MessageReaction, maybe: MessageReaction) {
    this.attendingReaction = attending;
    this.maybeReaction = maybe;

    this.collector = attending.message.createReactionCollector (
      reaction => this.isRsvpReaction (reaction),
      { dispose: true }
    );

    this.collector.on ('collect', this.onCollect);
    this.collector.on ('remove', this.onRemove);

    // todo: Check if this ever gets called, and maybe handle restart
    this.collector.on ('end', () => {
      console.log ('#end collection');
    });
  }
  
  get emojis() : {attending: string; maybe: string;} {
    return {
      attending: Emojis.RSVP,
      maybe:     Emojis.Maybe
    };
  }

  /**
   * Collection of users who've reacted that they are "Attending"
   */
  get attendees() : Collection<string, Participant> {
    return this.guestlist.filter (u => u.isAttending);
  }

  /**
   * Collection of users who've reacted that they are a "Maybe"
   */
  get maybes() : Collection<string, Participant> {
    return this.guestlist.filter (u => u.isMaybe);
  }

  //
  // When fetching reactions from an old message, the users aren't loaded into the cache by default
  // So we need to take an extra step and `fetch` the users to populate the cache
  //
  private async initCache() : Promise<void> {
    await Promise.all ([
      this.attendingReaction.users.fetch (),
      this.maybeReaction.users.fetch ()
    ]);

    const maybes = this.maybeReaction.users.cache
      .filter (u => !u.bot);

    for (const [_, user] of maybes) {
      await this.addParticipantToList (user, this.maybeReaction);
    }

    const attending = this.attendingReaction.users.cache
      .filter (u => !u.bot);

    for (const [_, user] of attending) {
      await this.addParticipantToList (user, this.attendingReaction);
    }
  }

  //
  // Will switch a user from their current list to their new list
  // if they're already RSVP'd. Otherwise, initializes a participant
  //
  private async addParticipantToList(user: User, list: MessageReaction) : Promise<void> {
    const rsvp = this.guestlist.get (user.id);

    if (rsvp) {
      await rsvp.switchTo (list);
    }
    else {
      const participant = new Participant (user, list);
      this.guestlist.set (user.id, participant);
    }
  }

  //
  // Used for filtering reaction events for emojis that we don't care about
  //
  private isRsvpReaction(reaction: MessageReaction) : boolean {
    return [Emojis.RSVP, Emojis.Maybe].includes (reaction.emoji.name);
  }

  //
  // Event handler for when a user adds a reaction
  //
  private onCollect = async (reaction: MessageReaction, user: User) => {
    await this.addParticipantToList (user, reaction);
    this.events.emit ('change');
  }

  //
  // Event handler for when user removes a reaction
  //
  private onRemove = async (reaction: MessageReaction, user: User) => {
    const rsvp = this.guestlist.get (user.id);

    if (rsvp && rsvp.isInList (reaction)) {
      this.guestlist.delete (user.id);
      this.events.emit ('change');
    }
  }

  /**
   * Create a new RSVP Manager for a new announcement.
   * Appends the reactions
   * 
   * @param message The announcement to attach the reactions to
   */
  static async setupReactions(message: Message) : Promise<RsvpManager> {
    const yes = await message.react (Emojis.RSVP);
    const maybe = await message.react (Emojis.Maybe);

    return new RsvpManager (yes, maybe);
  }

  /**
   * If reactions already exist on a message, this will load them from discord
   * 
   * Will attempt to re-add the reactions if they're missing for some reason
   * 
   * @param message The announcement
   */
  static async fromExisting(message: Message) : Promise<RsvpManager> {
    const yes = 
      message.reactions.cache.get (Emojis.RSVP)
      ?? await message.react (Emojis.RSVP);

    const maybe = 
      message.reactions.cache.get (Emojis.Maybe)
      ?? await message.react (Emojis.Maybe);

    const manager = new RsvpManager (yes, maybe);
    await manager.initCache ();

    return manager;
  }
}

//
// A participant is someone who reacted to one of the two RSVP Reactions
//
class Participant {
  private readonly user: User;

  private reactions: MessageReaction;

  constructor (user: User, list: MessageReaction) {
    this.user = user;
    this.reactions = list;
  }

  /**
   * Public nickname of the user
   */
  get nickname() : string {
    return this.user.username;
  }

  /**
   * `true` if user marked the "YES" emoji on the rsvp list
   */
  get isAttending() : boolean {
    return this.reactions.emoji.name === Emojis.RSVP;
  }

  /**
   * `true` if user marked the "MAYBE" emoji on the rsvp list
   */
  get isMaybe() : boolean {
    return this.reactions.emoji.name === Emojis.Maybe;
  }

  /**
   * Check if this user belongs to a list
   */
  isInList (reaction: MessageReaction) : boolean {
    return reaction.emoji.name === this.reactions.emoji.name;
  }

  /**
   * Removes the user's previous reaction when they're signing up for a new one
   * 
   * @param reactions 
   */
  async switchTo (reactions: MessageReaction) : Promise<void> {
    if (this.isInList (reactions)) {
      return;
    }

    // Discord fires a "remove" event before we get the chance to set the current reaction
    // so we'll set it first before deleting to prevent the race condition
    const oldReaction = this.reactions;
    this.reactions = reactions;

    await oldReaction.users.remove (this.user.id);
    oldReaction.users.cache.delete (this.user.id);
  }
}