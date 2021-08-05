import { onMessage, events } from '@sjbha/app';
import { startsWith } from '@sjbha/utils/message-middleware';


// Commands

import { create } from './commands/create';

onMessage (
  startsWith ('!meetup'),
  create
);


// Features

import Announcement from './core/Announcement';

Promise.all ([
  events.waitFor ('bot:connect'),
  events.waitFor ('db:connect')
]).then (() => Announcement.loadAll ());