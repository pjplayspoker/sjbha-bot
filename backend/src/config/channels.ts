import { env } from '@sjbha/app';

const production = {
  strava:    '450913008323919872',
  shitpost:  '506911331257942027',
  bot_admin: '430517752546197509'
};

type Channels = typeof production;

const devServer = {
  bot1: '861815778281259008',
  bot2: '861816839197950002'
};

const development: Channels = {
  strava:    devServer.bot1,
  shitpost:  devServer.bot1,
  bot_admin: devServer.bot1
};

export const channels = env.IS_PRODUCTION ? production : development;