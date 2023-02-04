export interface TokenProb {
    token: string,
    /// only null for the first returned token
    logprob: number | null,
}

export type ApiResponse =
  | {
      kind: "err";
      error: string;
    }
  | {
      kind: "ok";
      tokens: TokenProb[];
    };

export async function apiRequest(apiToken: string, prompt: string): Promise<ApiResponse> {
  const resp = await fetch("https://api.openai.com/v1/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-davinci-003",
      temperature: 0,
      max_tokens: 1,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      logprobs: 1,
      echo: true,
      prompt,
    }),
  });

  if (resp.status !== 200) {
    return { kind: "err", error: await resp.text() };
  } else {
    const data = await resp.json();
    const choice = data.choices[0];
    const tokens = choice.logprobs.tokens as string[];
    const logprobs = choice.logprobs.token_logprobs as number[];
    return { kind: "ok", tokens: tokens.map((token, idx) => ({ token, logprob: logprobs[idx] })) };
  }
}
