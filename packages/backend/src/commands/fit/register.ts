import { onMessage, router } from '@sjbha/app';
import { channels } from '@sjbha/config';
import { dmsOnly, messageEquals, reply, restrictToChannel, routes, startsWith } from '@sjbha/utils/message-middleware';
import schedule from 'node-schedule';
import { DateTime } from 'luxon';


// Bot


import { auth } from './commands/auth';
import { help } from './commands/help';
import { profile } from './commands/profile';
import { balance } from './commands/balance';
import { leaders } from './commands/leaders';
import { settings } from './commands/settings';

onMessage (
  startsWith ('!fit'),
  restrictToChannel (channels.strava),
  routes ({
    auth:     auth,
    profile:  profile,
    balance:  balance,
    leaders:  leaders,
    help:     help,
    empty:    help,
    settings: reply ('DM me to update your settings!')
  })
);

onMessage (
  messageEquals ('!fit settings'),
  dmsOnly (),
  settings
);


// Admin Commands


import { post } from './admin/post';
import { list } from './admin/list';
import { remove } from './admin/remove';
import { promote } from './admin/promote';

onMessage (
  startsWith ('$fit'),
  restrictToChannel (channels.bot_admin),
  routes ({
    post:    post,
    list:    list,
    remove:  remove,
    promote: promote
  })
);


// Web API


import { authAccept } from './routes/auth-accept';
import { newWorkout } from './routes/activity-webhook';

router.get ('/fit/accept', authAccept);
router.post ('/fit/api/webhook', newWorkout);


// Schedule

import { runPromotions } from './features/weekly-promotions';

const time = DateTime
  .fromObject ({ weekday: 1, hour: 8 })
  .toLocal ();

schedule.scheduleJob ({
  dayOfWeek: time.weekday,
  hour:      time.hour
}, () => { runPromotions () });