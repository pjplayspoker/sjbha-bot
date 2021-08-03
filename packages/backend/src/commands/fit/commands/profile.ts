import { MessageHandler } from '@sjbha/app';
import { MessageEmbed } from 'discord.js';
import { DateTime, Interval } from 'luxon';
import fromNow from 'fromnow';
import { Just, Maybe } from 'purify-ts';

import * as User from '../db/user';
import { Workouts, sumExp } from '../db/workout';

import { currentWeek } from '../common/week';
import { getRank } from '../common/ranks';

export const profile : MessageHandler = async message => {
  const user = await User.findOne ({ discordId: message.author.id });

  if (!User.isAuthorized (user)) {
    message.reply ('You aren\'t set up with the Strava bot');

    return;
  }

  const member = Maybe.fromNullable (message.member);
  const username = member.mapOrDefault (m => m.nickname, message.author.username);
  const displayColor = member.mapOrDefault (m => m.displayColor, 0xcccccc);

  const embed = new MessageEmbed ();
  embed.setColor (displayColor);
  embed.setAuthor (username, message.author.displayAvatarURL ());

  // User's current rank name
  const rank = getRank (user.fitScore);
  const score = Math.floor (user.fitScore);
  embed.addField ('Rank', `${rank} (${score})`, true);
  
  // Lifetime EXP gained
  embed.addField ('Total EXP', formatExp (user.xp), true);

  // All workouts in the last 30 days
  const lastThirtyDays = Interval.before (DateTime.local (), { days: 30 });
  const workouts = await Workouts ()
    .during (lastThirtyDays)
    .find ();

  // User's workouts in the last 30 days
  const profileWorkouts = workouts.filter (w => w.discord_id === user.discordId);

  // The start of the week, used for EXP promotion calculation
  const weekStart = currentWeek ().start.toUTC ();
  
  // Collection of workouts that apply to this week's promotion
  const weekly = profileWorkouts.filter (w => w.timestamp >= weekStart.toISO ());
  embed.addField ('Weekly EXP', formatExp (sumExp (weekly)), true); 

  // The user's most recently recorded workout
  const mostRecentWorkout = Just (profileWorkouts)
    .map (list => list.sort ((a, b) => a.timestamp > b.timestamp ? -1 : 1))
    .chainNullable (list => list[0])

  mostRecentWorkout.ifJust (workout => {
    const emoji = workout.emoji (user.emojis);
    const name = workout.activity_name;
    const timeAgo = fromNow (workout.timestamp, { suffix: true, max: 1 });

    embed.addField ('Last Activity', `${emoji} ${name} • ${timeAgo}`, true);
  });

  message.channel.send (embed);
}

/**
 * Rounds and shortens an EXP value for display
 */
const formatExp = (amt: number) => 
  (amt >= 1000) ? (amt / 1000).toFixed (1) + 'k'
    : amt.toFixed (1)