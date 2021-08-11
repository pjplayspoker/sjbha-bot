<script lang='ts'>
  import { Location, locationType, location, locationComments, MAX_LOCATION_COMMENTS_LENGTH } from '../store';
  import { fade } from 'svelte/transition';

  import Textarea from '../components/Textarea.svelte';
  import Legend from '../components/Legend.svelte';

  let dropdownOpen = false;

  function toggleDropdown() {
    dropdownOpen = !dropdownOpen;
  }

  function closeDropdown() {
    dropdownOpen = false;
  }

  function reset() {
    $locationType = Location.NONE;
    $location = '';
    $locationComments = '';
  }

  function selectType (type: string) {
    return () => {
      $locationType = type;
      dropdownOpen = false;
    }
  }

  // How much of the form is visible
  const Visibility = {
    CLOSED: "CLOSED",
    PARTIAL: "PARTIAL",
    FULL: "FULL"
  };

  const Form = {
    [Location.NONE]: {
      icon: 'place',
      legend: 'Enter location details',
      visibility: Visibility.CLOSED,
    },

    [Location.ADDRESS]: {
      icon: 'place',
      legend: 'Address',
      label: "Address",
      description: "Enter either the exact address, or something like 'Business Name, San Jose, CA'. The bot will make it link directly to google maps -- no need to paste the link!",
      placeholder: "e.g. 1234 Royroy lane, Original Gravity San Jose",
      commentHint: "Any extra details on parking details, exact meetup spot, etc",
      visibility: Visibility.FULL
    },

    [Location.PRIVATE]: {
      icon: 'lock',
      legend: 'Private Address',
      label: "General Location",
      description: "Selecting 'Private Address' means you will be responsible of telling people where to go. You should enter a general location so people can take distance into consideration before RSVP-ing",
      placeholder: "e.g. West San Jose, Near Downtown",
      commentHint: "Any extra details on whe",
      visibility: Visibility.FULL
    },

    [Location.VOICE]: {
      icon: 'volume_up',
      legend: 'Voice Chat',
      label: "Voice channel",
      placeholder: "e.g. productivity, general-2",
      commentHint: "Any extra details on parking details, exact meetup spot, etc",
      visibility: Visibility.PARTIAL
    }
  };

  $: form = Form[$locationType]  || {};
  $: legendActive = [Visibility.FULL, Visibility.PARTIAL].includes (form.visibility);
</script>

<section name='location'>
  <Legend icon={form.icon} active={legendActive} on:click={toggleDropdown} closeable={true} on:close={reset}>
    {form.legend}
  </Legend>

  {#if form.description}
    <p class='pad-under'>
      <small>
        {form.description}
      </small>
    </p>
  {/if}

  {#if form.visibility === Visibility.FULL}
    <fieldset class='pad-under'>
      <label for="location">{form.label}</label>
      <input name="location" placeholder={form.placeholder} type="text" bind:value={$location}/>

      <label for="location-comments">Additional Comments (optional)</label>
      <Textarea name="location-comments" placeholder={form.commentHint} limit={MAX_LOCATION_COMMENTS_LENGTH} bind:value={$locationComments}/>
    </fieldset>
  {/if}
</section>

{#if dropdownOpen}
  <aside on:click|preventDefault={closeDropdown} in:fade="{{duration: 100}}">
    <menu class='modal'>
      <li on:click={selectType(Location.ADDRESS)}>
        <i class='material-icons'>place</i> 
        <strong>Address</strong>
        <small class='muted'>A specific location or business</small>
      </li>

      <li on:click={selectType(Location.PRIVATE)}>
        <i class='material-icons'>lock</i> 
        <strong>Private Address</strong>
        <small class='muted'>You don't want the address posted publicy and will let attendees know individually</small>
      </li>

      <li on:click={selectType(Location.VOICE)}>
        <i class='material-icons'>volume_up</i>
        <strong>Voice</strong>
        <small class='muted'>This is a virtual meetup that takes place in voice chat</small>
      </li>
    </menu>
  </aside>
{/if}

<style>
  menu {
    color: initial;
    font-size: 16px;
    padding: 0;
  }

  menu li {
    cursor: pointer;
    list-style-type: none;
    padding: 1rem;

    display: grid;
    column-gap: 0.5rem;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
    align-items: center;
  }

  menu li strong {
    grid-row: 1;
    grid-column: 2;
    line-height: 1.25rem;
  }

  menu li small {
    grid-row: 2;
    grid-column: 2;
  }

  menu li:hover {
    background: #eee;
  }

  menu .material-icons {
    font-size: inherit
  }
</style>