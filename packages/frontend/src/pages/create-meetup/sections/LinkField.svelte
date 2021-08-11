<script lang='ts'>
  import { createEventDispatcher } from 'svelte';
  import {Link, links} from '../store';
  import * as regex from '../regex';

  export let linkId : string;

  $: link = $links[linkId];

  const update = (link: Link) =>{
    $links[linkId] = link;
  }

  const setName = (name: string) => update ({...link, name });
  const setUrl = (url: string) => update ({...link, url});

  const remove = () => {
    const { [linkId]: _, ...rest } = $links;
    $links = rest;
  }

  let error = 'Enter a valid URL';

  $: {
    error = '';

    if (link.name.length && !link.url.length)
      error = 'Url is required';

    if (link.url.length && !regex.url.test (link.url)) 
      error = 'Enter a valid URL';
  }
</script>


<div class:error>
  <input type="text" name="link-url" placeholder="https://" value={link.url} on:input={e => setUrl(e.currentTarget.value)}/>
  {#if error}
    <div class='error'>{error}</div>
  {/if}
</div>

<div>
  <input type="text" name="link-name" value={link.name} on:input={e => setName(e.currentTarget.value)}/>
</div>

<div>
  <button class='ghost' on:click|preventDefault={remove}>
    <i class='material-icons'>close</i>
  </button>
</div>


<style>
  input {
    margin-bottom: 0;
  }

  button.ghost {
    padding: 0;
    width: 2rem;
    margin-top: 0.5rem;
  }

  div {
    align-self: self-start;
  }

  div.error input {
    outline-color: var(--danger);
    border-color: var(--danger);
    background: var(--danger-input-focus);
  }

  .error {
    font-weight: 300;
    color: var(--danger);
  }
</style>