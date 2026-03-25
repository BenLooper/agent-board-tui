Send a chat message to an agent (or reply to the user) via the agent-board chat system.

$ARGUMENTS contains the target agent id followed by the message body.

## Step

Post the message. Set `author` to your own agent id so the recipient sees who sent it:

```
POST http://localhost:31377/api/queue
Content-Type: application/json

{
  "agentId": "<target agent id>",
  "body": "<message body>",
  "author": "<your agent id or 'user'>"
}
```

If sending as the user (from a human session), use `"author": "user"`.

Print the returned message's `id`, `agentId`, `author`, `body`, and `createdAt` as confirmation.

<!--
Equivalent curl:

curl -s -X POST http://localhost:31377/api/queue \
  -H "Content-Type: application/json" \
  -d '{"agentId":"implementer","body":"Please prioritize the auth bug next.","author":"user"}'
-->
