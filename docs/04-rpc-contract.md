# RPC contract

> Status: skeleton.

`gentle-shell --mode rpc` runs as a child process and speaks JSON, one message per line, over stdin/stdout. It is the only formal interface between the desktop and gentle-shell. It is not tRPC.

## Transport and framing

## Commands (desktop → runtime)

## Events (runtime → desktop)

## Extension UI requests
<!-- `extension_ui_request`: dialogs, `setWidget`, `gentle-agents.activity/v1`. -->

## Versioning and compatibility

## Gaps the desktop needs
<!-- Stop a helper; structured ODD state; providers; profiles; execution traces for audit; ... -->

## How to propose contract changes upstream
