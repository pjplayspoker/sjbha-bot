<script lang='ts'>
  import {nanoid} from 'nanoid';
  import { links } from '../store';
  import Legend from '../components/Legend.svelte';
  import LinkField from './LinkField.svelte';

  $: list = Object.values($links);

  function addLink() {
    const id = nanoid();
    $links[id] = { id, name: '', url: ''};
  }

  $: formOpen = list.length > 0;
  $: legend = formOpen ? "Links" : "Add a link";
</script>

<section name='links'>
  <Legend icon='insert_link' active={formOpen} on:click={addLink}>
    {legend}
  </Legend>

  {#if formOpen}
    <p class='pad-under'>
      <small>
        You can provide some links to things like an event page, a food menu, a trail map for a hike, etc
      </small>
    </p>

    <fieldset class='pad-under'>
      <label for='link-url'>URL</label>
      <label for='link-name'>Link name (optional)</label>
      <div/>

      {#each list as link (link.id)}
        <LinkField linkId={link.id} />
      {/each}
    </fieldset>

    <button class='link pad-under mb-2' on:click|preventDefault={addLink}>
      + Add another link
    </button>
  {/if}
</section>

<style>
  fieldset {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    column-gap: 0.5rem;
    row-gap: 0.25rem;
  }

</style>