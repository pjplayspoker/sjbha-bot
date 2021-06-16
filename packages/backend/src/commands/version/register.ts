import { onMessage } from '@sjbha/app';
import { reply, startsWith } from '@sjbha/utils/message-middleware';

import pkg from '../../../package.json';

onMessage (
  startsWith ('!version'),
  reply (`v${pkg.version}`)
);