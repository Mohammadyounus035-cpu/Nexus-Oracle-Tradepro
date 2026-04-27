# Browserbase quickstart (safe credentials handling)

Use environment variables for Browserbase credentials. Do **not** hardcode API keys into source files, commits, screenshots, or logs.

## Required environment variables

```bash
export BROWSERBASE_API_KEY="bb_live_replace_with_your_key"
export BROWSERBASE_PROJECT_ID="replace-with-your-project-id"
```

If you previously exposed a live key, rotate/revoke it in Browserbase immediately and replace it with a new one.

## Python example

```python
import os
from browserbase import Browserbase

bb = Browserbase(api_key=os.environ["BROWSERBASE_API_KEY"])
session = bb.sessions.create(
    project_id=os.environ["BROWSERBASE_PROJECT_ID"],
    # Add configuration options here
)
```

## JavaScript/TypeScript example

```ts
import { Browserbase } from "@browserbasehq/sdk";

const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY });
const session = await bb.sessions.create({
  projectId: process.env.BROWSERBASE_PROJECT_ID,
  // Add configuration options here
});
```

## `.env` pattern (local development)

```dotenv
BROWSERBASE_API_KEY=bb_live_replace_with_your_key
BROWSERBASE_PROJECT_ID=replace-with-your-project-id
```

Add `.env` to `.gitignore` so local secrets are not committed.
