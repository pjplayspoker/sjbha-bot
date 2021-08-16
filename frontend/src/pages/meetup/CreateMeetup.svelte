<script lang='ts'>
  import wretch from 'wretch';
  import { onMount } from 'svelte';
  import { API_URL } from '../../env';

  import Details from './form/Details.svelte';
  import Location from './form/Location.svelte';
  import Links from './form/Links.svelte';
  // import GuestLimit from './form/GenerateCommand.svelte';
  import GenerateCommand from './form/GenerateCommand.svelte';

  import MiniLoader from './components/MiniLoader.svelte';
  import Banner from './components/Banner.svelte';

  import { fetchFromServer, isEditing, store } from './store';

  // Initialize
  const State = {
    Loading: "LOADING",
    Error: "ERROR",
    Enabled: "Enabled"
  };

  let state = State.Loading;
  let error = '';

  onMount (async () => {
    const id = window.location.hash.substr(1);

    if (!id) {
      state = State.Enabled;

      return;
    }

    try {
      await fetchFromServer (id);
      state = State.Enabled;
    } catch (e) {
      console.error(e);
      error = 'Was not able to load the meetup details for editing';
      state = State.Error;
    }

  });

  $: label = ($isEditing) ? '!meetup edit' : '!meetup';
</script>


<main>
  <h1>{label}</h1>

  {#if state === State.Loading}
    <MiniLoader />
  {/if}

  {#if state === State.Enabled}
    <form autocomplete="off">
      <Details />
      <Location />
      <Links />
      <!-- <GuestLimit /> -->

      <GenerateCommand />
    </form>
  {/if}

  {#if state === State.Error}
    <Banner>
      {error || 'Something unknown has happened'}
    </Banner>
  {/if}
</main>

<style>
  main {
    max-width: 640px;
    margin: 0 auto;
  }

  h1 {
    color: #d08d8d;
    padding: 2rem;
    text-align: center;
    font-size: 3rem;
    font-weight: 300;
    margin-bottom: 1rem;
    letter-spacing: 6px;
  }
</style>