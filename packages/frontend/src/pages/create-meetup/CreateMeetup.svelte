<script lang='ts'>
  import Details from './details/Details.svelte';
  import Location from './location/Location.svelte';
  import Links from './links/Links.svelte';
  import GuestLimit from './guest-limit/GuestLimit.svelte';
  import Generate from './generate/Generate.svelte';
</script>


<main>
  <h1>!meetup</h1>

  <form autocomplete="off">
    <Details />
    <Location />
    <Links />
    <!-- <GuestLimit /> -->

    <Generate />
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
    letter-spacing: 6px;
  }
</style>