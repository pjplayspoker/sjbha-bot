<script lang='ts'>
  import Details from './sections/Details.svelte';
  import Location from './sections/Location.svelte';
  import GuestLimit from './sections/GuestLimit.svelte';
  import Links from './sections/Links.svelte';
  import Generate from './sections/Generate.svelte';
</script>

<main>
  <h1>!meetup</h1>

  <form autocomplete="off">
    <Details />
    <Location />
    <Links />
    <GuestLimit />

    <Generate/>
  </form>
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
  }
</style>