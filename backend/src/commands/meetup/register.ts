import { onMessage, events, router } from '@sjbha/app';
import { routes, startsWith, restrictToChannel } from '@sjbha/utils/message-middleware';
import { channels } from '@sjbha/config';


// Commands

import { create } from './commands/create';
import { cancel } from './commands/cancel';
import { edit } from './commands/edit';

onMessage (
  startsWith ('!meetup'),
  routes ({ create, cancel, edit })
);


// Admin Commands

import { refresh } from './admin/refresh';

onMessage (
  startsWith ('$meetup'),
  restrictToChannel (channels.bot_admin),
  routes ({ refresh })
);


// public API

import { meetup } from './routes/meetup';

router.get ('/meetup/{id}', meetup);


// Features

import Meetup from './core/Meetup';

Promise.all ([
  events.waitFor ('bot:connect'),
  events.waitFor ('db:connect')
]).then (() => Meetup.updateCache ());
