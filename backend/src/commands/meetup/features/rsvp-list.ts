// import { events } from '@sjbha/app';
// import * as Meetups from '../db/meetups';
// import Announcement from '../core/Announcement';
// import { MessageReaction } from 'discord.js';


// let meetupIdCache = new Set<string> ();

// Promise.all ([
//   new Promise (resolve => events.once ('bot:connect', () => resolve (null))),
//   new Promise (resolve => events.once ('db:connect', () => resolve (null))),
// ]).then (refreshAllRsvps);

// async function refreshAllRsvps() : Promise<void> {
//   const meetups = await Meetups.find ();
//   meetupIdCache = new Set ();

//   for (const meetup of meetups) {
//     const announcement = await Announcement.fromMeetup (meetup);
//     await announcement.refresh ();
//     meetupIdCache.add (announcement.rsvpId);
//   }
// }

// events.on ('reaction:add', (reaction, id) => onRsvpAdd (reaction, id));
// events.on ('reaction:remove', (reaction, id) => onRsvpRemove (reaction, id));

// async function onRsvpAdd(reaction: MessageReaction, userId: string) : Promise<void> {
//   if (!meetupIdCache.has (reaction.message.id)) {
//     return;
//   }
// }

// async function onRsvpRemove(reaction: MessageReaction, userId: string) : Promise<void> {
//   if (!meetupIdCache.has (reaction.message.id)) {
//     return;
//   }
// }