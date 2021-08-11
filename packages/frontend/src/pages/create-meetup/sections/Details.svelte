<script lang='ts'>
  import { DateTime } from 'luxon';
  import { title, date, description, MAX_DESCRIPTION_LENGTH, errors } from '../store';

  import Legend from '../components/Legend.svelte';
  import Textarea from '../components/Textarea.svelte';

  const minDate = DateTime.local().toISODate();

  function setDate(e: Event) {
    const value = DateTime.fromISO((<HTMLInputElement>e.target).value);
      
    date.update (d => d.set({
      year: value.year,
      month: value.month,
      day: value.day
    }));
  }

  function setTime(e: Event) {
    const time = DateTime.fromISO ((<HTMLInputElement>e.target).value);

    date.update(d => d.set({
      hour: time.hour,
      second: time.second
    }));
  }

  $: day = $date.toISODate();
  $: time = $date.toLocaleString (DateTime.TIME_24_SIMPLE);
</script>

<section name='details'>
  <Legend icon='notes' active={true}>
    Details
  </Legend>

  <fieldset class='pad-under'>
    <label for="title">Meetup title</label>
    <input name="title" type="text" bind:value={$title}/>

    <fieldset id='datetime'>
      <div>
        <label for="date">Date</label>
        <input type="date" name="date" min={minDate} value={day} on:input={setDate}/>
      </div> 

      <div>
        <label for="time">Starts At</label>
        <input type='time' name="time" value={time} on:input={setTime}/>
      </div>  
    </fieldset>

    <label for="description">Meetup description</label>
    <Textarea name="description" placeholder="Include some details like" rows="8" limit={MAX_DESCRIPTION_LENGTH} bind:value={$description}/>
  </fieldset>  
</section>

<style>
  #datetime {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    column-gap: 1rem;
    align-items: center;
  }
</style>