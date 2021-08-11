import './styles.scss';

import { setAutoFreeze } from 'immer';
setAutoFreeze (false);

import App from './CreateMeetup.svelte';

const app = new App ({
    target: document.getElementById ('root')
});

export default app;
