import { MessageHandler } from '@sjbha/app';
import { Maybe, Left, Right } from 'purify-ts';
import { Subscriptions } from '../db/subscription';

export const subscribe : MessageHandler = async message => {
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
      ? Left ('You are already subscribed to ' + sub.name)
      : Right (m)
    );
    
  const addRole = member.caseOf ({
    Left:  error => Promise.resolve (error),
    Right: m => m.roles.add (sub.id).then (_ => 'Subscribed to ' + sub.name)
  });

  addRole.then (message.reply);
}