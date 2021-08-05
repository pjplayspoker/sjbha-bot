import { Message, MessageReaction } from 'discord.js';
import { EventEmitter } from 'tsee';

type Events = {
  'bot:connect':      () => void;
  'db:connect':       () => void;
  'message':          (message: Message) => void;
  'reaction:add':     (reaction: MessageReaction, user: string) => void;
  'reaction:remove':  (reaction: MessageReaction, userId: string) => void;
};

class AppEventEmitter extends EventEmitter<Events> {
  waitFor<K extends keyof Events>(event: K) : Promise<void> {
    return new Promise (resolve => this.once (event, () => resolve ()));
  }
}

export default new AppEventEmitter ();