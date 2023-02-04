<script lang="ts">
  export let token: string;
  export let logprob: number;
  export let threshold: number;
</script>

<span title="{logprob.toFixed(5)}" class:flagged={logprob < threshold}>{token}</span>

<style>
  span {
    background-color: #222222;
    color: white;
    padding: 2px;
  }

  span.flagged {
    background-color: #dd1111;
  }
</style>