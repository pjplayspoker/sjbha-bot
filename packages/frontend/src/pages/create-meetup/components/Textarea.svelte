<script>
  export let value = '';
  export let name = '';
  export let placeholder = '';
  export let readonly = false;

  export let rows = "4";

  export let limit = 0;

  $: checkLimit = limit > 0;
  $: charactersLeft = limit - value.length;
  $: overLimit = checkLimit && charactersLeft <= 0;
</script>

<textarea {name} {placeholder} {readonly} {rows} on:click bind:value class:error={overLimit}/>
<div class='character-count' class:red={overLimit}>
  {#if checkLimit && !overLimit}
    {limit - value.length}
  {:else if overLimit}
    Maximum {limit} characters (<b>{Math.abs(charactersLeft)}</b> too many)
  {/if}
</div>

<style>
  textarea {
    font-family: 'Lato', sans-serif;
    
    width: 100%;
    font-size: 1rem;

    padding: 0.75rem 0.5rem;

    background: white;
    border: 1px solid #999;
    border-radius: 6px;
    
    resize: vertical;
    min-height: 6rem;
    line-height: 1.4em;
  }


  textarea.error:focus {
    outline-color: var(--danger);
  }

  textarea:focus {
    outline-color: var(--primary);
    background: var(--input-focus);
  }

  textarea.error {
    border: 1px solid var(--danger);
    background: var(--danger-input-focus);
  }

  .character-count {
    margin-right: 0.5rem;
    text-align: right;
    color: var(--muted);
    font-weight: 300;
  }

  .red {
    color: var(--danger);
  }
</style>