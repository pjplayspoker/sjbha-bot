import { DISCORD_TOKEN, SERVER_ID } from './env';
import { Client, Message, TextChannel, GuildMember } from 'discord.js';

import { channels } from '../config';
import * as env from './env';
import { Maybe, Just, Nothing } from 'purify-ts';
import events from './events';

// Connect

const client = new Client ({
  partials: ['USER', 'MESSAGE', 'CHANNEL', 'REACTION']
});

client.on ('ready', () => {
  console.log (`Bastion connected as '${client.user?.tag}' v${env.VERSION}`);

  if (env.IS_PRODUCTION) {
    Instance
      .fetchChannel (channels.bot_admin)
      .then (c => c.send (`🤖 BoredBot Online! v${env.VERSION}`));
  }

  events.emit ('bot:connect');
});

client.login (DISCORD_TOKEN);

client.on ('message', (msg: Message) => {
  if (msg.author.bot) return;

  events.emit ('message', msg);
});


export type MessageHandler = (message: Message) => void;
export type Unsubscribe = () => void;
export type NextFn = () => void;
export type MessageMiddleware = (message: Message, next: NextFn) => void;

/**
 * Compose a series middleware together to create a command.
 * 
 * Middleware is used as helpers for filtering and routing an incoming message.
 * 
 * ```ts
 * compose (
 *   startsWith ("!ping"),
 *   reply ("Pong!")
 * )
 * ```
 * 
 * @returns A Handler that can be passed to `onMessageEvent`
 */
export const compose = (...middlewares: MessageMiddleware[]) : MessageHandler => {
  if (!middlewares.length) {
    return _ => { /** Ignore */ }
  }

  const [run, ...tail] = middlewares;
  const next = compose (...tail);

  return message => run (message, () => next (message));
}

/**
 * Listen to messages from the bot.
 * 
 * todo: explain middleware
 */
export const onMessage = (...middleware: MessageMiddleware[]) : Unsubscribe => {
  const handler = compose (...middleware);
  events.on ('message', handler);

  return () => events.off ('message', handler);
}

// Instance Utilities

export const Instance = {
  fetchMember: async (discordId: string) : Promise<Maybe<GuildMember>> => {
    try {
      const guild = await client.guilds.fetch (SERVER_ID);
      const member = await guild.members.fetch (discordId);

      return Just (member);
    }
    catch (e) {
      return Nothing;
    }
  },

  fetchMembers: async (discordIds: string[]) : Promise<GuildMember[]> => {
    const guild = await client.guilds.fetch (SERVER_ID);
    const members = await guild.members.fetch ({ user: discordIds });

    return members.map (i => i);
  }, 

  fetchChannel: async (channelId: string) : Promise<TextChannel> => {
    const channel = await client.channels.fetch (channelId);
    
    if (channel.type !== 'dm' && channel.type !== 'text') {
      throw new Error ('Channel is not of type \'dm\' or \'text');
    }

    return <TextChannel>channel;
  },

  fetchMessage: async (channelId: string, messageId: string) : Promise<Message> => {
    const channel = await client.channels.fetch (channelId);
    const message = await (<TextChannel>channel).messages.fetch (messageId);

    return message;
  }
}