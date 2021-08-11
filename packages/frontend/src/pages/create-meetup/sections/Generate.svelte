<script lang='ts'>
  import {
    Location,
    title, date, description, 
    location, locationType, locationComments, 
    links, 
    valid 
  } from '../store';
  
  import YAML from 'yaml';
  import Textarea from '../components/Textarea.svelte';

  let open = false;

  function openModal() {
    open = true;
  }

  function close() {
    open = false;
  }

  let command = '';

  $: validLinks = Object.values ($links)
    .filter (link => link.url.length);

  $: {
    const props : Record<string, any> = {};

    props.title = $title;
    props.date = $date;

    if ($description)
      props.description = $description;
    
    if ($locationType !== Location.NONE) {
      props.location_type = {
        [Location.ADDRESS]: "address",
        [Location.PRIVATE]: "private",
        [Location.VOICE]: "voice"
      }[$locationType];
      props.location = $location;

      if ($locationComments)
        props.location_comments = $locationComments;
    }

    if (validLinks.length)
      props.links = validLinks.map (({ name, url }) => ({ name, url }));

    command = '!meetup create' + '\n' + YAML.stringify (props);
  }
</script>

<footer name='generate' class='pad-under'>
  <button class='pad mt-2' on:click|preventDefault={openModal} disabled={!$valid}>
    Generate
  </button>
</footer>

{#if open}
  <aside on:click|self={close}>
    <div class='generate modal pad'>
      <header>
        <h2>Create Your Meetup!</h2>
        <button class='ghost' on:click|preventDefault={close}>
          <i class='material-icons'>close</i>
        </button>
      </header>

      <p class='mb-1'>
        Here is your meetup command! All you need to do next is copy & paste this command into any channel
      </p>

      <p class='mb-1'>
        Try to pick a channel that's most relevant to the meetup!
      </p>

      <Textarea readonly={true} value={command} rows="10"/>
    </div>
  </aside>
{/if}

<style>
  .generate p {
    font-size: 0.8rem;
  }

  h2 {
    font-size: 1rem;
  }

  header {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
  }

  button.clipboard {
    padding: 1rem;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  @media only screen and (min-width: 640px) {
    footer {
      padding: 0;
    }  
  }
</style>