import { MessageHandler } from '@sjbha/app';
import Meetup from '../announcement/Meetup';
import { Interaction } from '@sjbha/utils/interaction';

/**
 * Creates a new meetup
 */
export const cancel : MessageHandler = async (message) => {
  const userMeetups = Meetup.find (a => a.organizerId === message.author.id);
  
  // Make sure they have any meetups they can cancel
  if (!userMeetups.size) {
    message.reply ('You have no meetups to cancel');

    return;
  }


  // Pick a meetup they want to cancel
  const pickMeetup = new Interaction.OptionBuilder <Meetup> ('Which meetup would you like to cancel?');
  userMeetups.forEach (meetup => pickMeetup.addOption (meetup.time + ' ' + meetup.title, meetup));

  await message.reply (pickMeetup.toString ());

  const meetup = await pickMeetup
    .capture ()
    .inReplyTo (message)
    .get ();

  if (!meetup) 
    return;


  // Give a reason, which we use to let people know why
  await message.reply (`What is the reason for cancelling '${meetup.title}'? (Will let the RSVP's know it was cancelled)`)
  const cancelReason = await Interaction
    .capture ()
    .from (message.author.id)
    .get ();

  if (!cancelReason)
    return;


  // Cancel the meetup
  await meetup.cancel (cancelReason);

  message.reply (`${meetup.title} has been cancelled!`);
}