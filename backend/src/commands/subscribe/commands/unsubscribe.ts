import { MessageHandler } from '@sjbha/app';
import { Left, Maybe, Right } from 'purify-ts';
import { Subscriptions } from '../db/subscription';

/**
 * List the available subscriptions that are in the database
 */
export const unsubscribe : MessageHandler = async message => {
  const [_, name] = message.content.split (' ');
  const sub = await Subscriptions ().findOne ({ name: name.toLowerCase () });

  if (!sub) {
    message.reply (`No subscription named '${name}' found. Use '!subscribe' to view a list of possible subscriptions`);

    return;
  }

  const member = Maybe
    .fromNullable (message.member)
    .toEither ('You cannot subscribe in DMs')
    .chain (m => m.roles.cache.has (sub.id) 
      ? Right (m)
      : Left ('You are not subscribed to ' + sub.name)
    );

  const removeRole = member.caseOf ({
    Left:  error => Promise.resolve (error),
    Right: m => m.roles.remove (sub.id).then (_ => 'Unsubscribed from ' + sub.name)
  });

  removeRole.then (message.reply);
}