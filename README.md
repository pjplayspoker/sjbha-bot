## Basic Guide

More readme coming someday, but for now

#### Running the bot

You will need a `.env` file in the root of `packages/backend`

You can look at [env.ts](./packages/backend/src/app/env.ts) for what variables are expected

```sh
> npm i
> cd packages/backend
> npm i
> npm run dev

# If working on something that uses the database,
# you also need to start the db
> npm run db
```