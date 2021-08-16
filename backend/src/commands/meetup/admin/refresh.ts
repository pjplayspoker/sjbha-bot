import { MessageHandler } from '@sjbha/app';
import Meetup from '../announcement/Meetup';

/**
 * Update the cache, in case they fall out of sync (or did some DB editing)
 */
export const refresh : MessageHandler = async (message) => {
  await Meetup.updateCache ();
  message.reply (`Updated meetup cache (${Meetup.count} meetups)`);
}