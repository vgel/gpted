<script lang="ts">
  import { persisted } from "svelte-local-storage-store";

  import TokenChip from "./lib/TokenChip.svelte";
  import { type ApiResponse, type TokenProb, apiRequest } from "./lib/openai";

  let apiToken = persisted("openai-api-token", "");
  let apiTokenHidden = persisted("openai-api-token-hidden", false);

  let threshold = persisted("logprob-threshold", -5.0);
  let context = persisted("prompt-context", "");
  let wordlist = persisted("wordlist", "");
  let showWholePrompt = persisted("show-whole-prompt", false);

  let text: string = "I just drive to the store to but eggs, but they had some.";
  let checked: ApiResponse | null = {
    kind: "ok",
    tokens: [
      { token: "\n", logprob: null },
      { token: "I", logprob: -5.8507 },
      { token: " just", logprob: -4.5910225 },
      { token: " drive", logprob: -10.929186 },
      { token: " to", logprob: -3.6074522 },
      { token: " the", logprob: -0.9694052 },
      { token: " store", logprob: -2.138953 },
      { token: " to", logprob: -4.028421 },
      { token: " but", logprob: -8.297087 },
      { token: " eggs", logprob: -5.1390777 },
      { token: ",", logprob: -3.3503063 },
      { token: " but", logprob: -3.9709992 },
      { token: " they", logprob: -1.9218838 },
      { token: " had", logprob: -2.9655225 },
      { token: " some", logprob: -6.797841 },
      { token: ".", logprob: -4.0500712 },
      { token: "\n", logprob: -0.38361523 },
      { token: "\n", logprob: -0.003504178 },
    ],
  };
  const cache: Map<string, ApiResponse> = new Map([[`\n${text}\n`, checked]]);

  async function check() {
    let prompt = "";

    let ctx = $context.trim();
    if (ctx) {
      prompt += `Context: ${ctx}`;
      if (!ctx.endsWith(".")) {
        prompt += ".";
      }
    }

    let wl = $wordlist.trim();
    if (wl) {
      prompt += `Known words: ${wl}`;
    }

    prompt += `\n${text}\n`;

    console.log(cache);

    if (cache.has(prompt)) {
      console.log("cached");
      checked = cache.get(prompt)!;
      return;
    }

    checked = await apiRequest($apiToken, prompt);
    if (checked.kind === "ok") {
      cache.set(prompt, checked);
    }
    console.log(JSON.stringify(checked));
  }

  function click() {
    if (checked === null) {
      check().catch((e) => (checked = { kind: "err", error: `${e}` }));
    } else {
      checked = null;
    }
  }

  function preprocessTokens(raw: TokenProb[], showWholePrompt: boolean): TokenProb[] {
    if (showWholePrompt) {
      return raw;
    }

    const startOfText = raw.findIndex((v) => v.token === "\n") + 1;
    const endOfText = raw.findIndex((v, idx) => idx >= startOfText && v.token === "\n");
    return raw.slice(startOfText, endOfText);
  }
</script>

<main>
  <h1>GPTed</h1>
  <label id="api-token" class:missing={!$apiToken}>
    <strong>API Token:</strong>
    <input type="text" bind:value={$apiToken} hidden={$apiTokenHidden} />
    <input type="password" bind:value={$apiToken} hidden={!$apiTokenHidden} />
    <button on:click={() => ($apiTokenHidden = !$apiTokenHidden)}>{$apiTokenHidden ? "show" : "hide"}</button>
    <small>
      A token for the OpenAI API. You can get one at <a href="https://openai.com/api/">openai.com/api</a>. Without it you can only try the demo prompt. Only stored client-side.
    </small>
  </label>

  <details>
    <summary>Advanced settings</summary>
    <label>
      <strong>Threshold:</strong> <input type="number" step="0.1" bind:value={$threshold} />
      <small>
        The <a href="https://en.wikipedia.org/wiki/Log_probability" target="_blank" rel="noreferrer">logprob</a> threshold.
        Tokens with logprobs smaller than this will be marked red.
      </small>
    </label>
    <label>
      <strong>Context:</strong> <small>Context for the text, which can help GPT3 better rank certain words.</small>
      <textarea placeholder="A short essay about picnics" bind:value={$context} />
    </label>
    <label>
      <strong>Dictionary:</strong>
      <small>Known words or phrases. Helpful for uncommon or invented words and names.</small>
      <textarea placeholder="jujubu eschaton Frodo Baggins" bind:value={$wordlist} />
    </label>
    <label>
      <strong>Show whole prompt:</strong> <input type="checkbox" bind:checked={$showWholePrompt} />
      <small>
        Show the whole prompt in the token view, instead of just your text. Mostly useful for debugging or curiosity.
      </small>
    </label>
  </details>

  <section id="inner">
    {#if checked === null}
      <textarea bind:value={text} />
    {:else if checked.kind === "err"}
      <div class="error">
        {checked.error}
      </div>
    {:else}
      <div class="result">
        {#each preprocessTokens(checked.tokens, $showWholePrompt) as t}
          <TokenChip token={t.token} logprob={t.logprob ?? 0} threshold={$threshold} />
        {/each}
      </div>
    {/if}
    <button on:click={click} disabled={!apiToken} title={apiToken ? "" : "API token needed"}>
      {checked === null ? "Check" : "Edit"}
    </button>

    <p>
      <small>
        Made by <a href="https://vgel.me">Theia Vogel</a> (<a href="https://twitter.com/voooooogel">@voooooogel</a>).
        Made with Svelte, GPT-3, and transitively, most of the web.<br>
        This software is provided with absolutely no warranty.
      </small>
    </p>
  </section>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }

  label {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    gap: 0.5rem;
    text-align: left;
  }

  label.missing > input {
    border: 1px solid red;
  }

  label > textarea {
    flex-basis: 100%;
  }

  #api-token > button {
    width: 5rem;
    padding: 0.2rem;
  }

  details > summary {
    text-align: left;
  }

  #inner {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  #inner > *:first-child {
    min-height: 20ch;
    border: 1px solid black;
    padding: 0.5rem;
  }

  .result {
    text-align: left;
  }

  .error {
    text-align: left;
    font-family: monospace;
    color: red;
  }
</style>
