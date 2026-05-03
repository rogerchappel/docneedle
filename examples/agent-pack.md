# Example agent workflow

Use docneedle before handing a local repository to an agent:

```sh
docneedle inspect . --output .docneedle
docneedle pack . --query "release escalation" --output .docneedle/release-pack.md
```

Attach the generated pack when you want a small, deterministic map of project docs without giving the agent a huge context dump.
