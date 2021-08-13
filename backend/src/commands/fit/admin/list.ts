import { Instance, MessageHandler } from '@sjbha/app';

import * as format from '@sjbha/utils/string-formatting';
import { table } from 'table';

import { Workouts, Workout } from '../db/workout';

export const list : MessageHandler = async message => {
  const workouts = await Workouts ().limit (20).find ();

  // todo: Ensure chronological order
  const rows = await Promise.all (workouts.map (formatRow));

  if (!rows.length) {
    message.reply ('No recent workouts');

    return;
  }
  
  message.channel.send (
    format.code (table (rows, {
      drawHorizontalLine: () => false,
      drawVerticalLine:   () => false
    }))
  ); 
}

const formatRow = async (workout: Workout.Model) : Promise<string[]> => {
  const member = await Instance.fetchMember (workout.discord_id);
  const username = member.mapOrDefault (m => m.nickname, '<unknown>');
  
  const timestamp = workout.started.toFormat ('hh:mma');

  return [
    workout.activity_id.toString (),
    timestamp,
    '@' + username,
    workout.totalExp.toFixed (1),
    workout.activity_name
  ];
}