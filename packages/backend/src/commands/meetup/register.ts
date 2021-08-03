import { onMessage } from '@sjbha/app';
import { startsWith } from '@sjbha/utils/message-middleware';

import { create } from './commands/create';

onMessage (
  startsWith ('!meetup'),
  create
);