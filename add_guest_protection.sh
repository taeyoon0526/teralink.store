#!/bin/bash

# users.js - POST 보호
sed -i '/export async function onRequestPost({ request, env }) {/,/const user = await requireAuth/s/const user = await requireAuth(request, env);/const user = await requireAuth(request, env);\n  const writeCheck = requireWritePermission(user);\n  if (writeCheck) return writeCheck;/' functions/api/admin/users.js

# users.js - DELETE 보호
sed -i '/export async function onRequestDelete({ request, env }) {/,/const user = await requireAuth/s/const user = await requireAuth(request, env);/const user = await requireAuth(request, env);\n  const writeCheck = requireWritePermission(user);\n  if (writeCheck) return writeCheck;/' functions/api/admin/users.js

# backup.js - POST 보호
sed -i '/export async function onRequestPost({ request, env }) {/,/const user = await requireAuth/s/const user = await requireAuth(request, env);/const user = await requireAuth(request, env);\n  const writeCheck = requireWritePermission(user);\n  if (writeCheck) return writeCheck;/' functions/api/admin/backup.js

# cleanup.js - POST 보호
sed -i '/export async function onRequestPost({ request, env }) {/,/const user = await requireAuth/s/const user = await requireAuth(request, env);/const user = await requireAuth(request, env);\n  const writeCheck = requireWritePermission(user);\n  if (writeCheck) return writeCheck;/' functions/api/admin/cleanup.js

# settings.js - PUT 보호
sed -i '/export async function onRequestPut({ request, env }) {/,/const user = await requireAuth/s/const user = await requireAuth(request, env);/const user = await requireAuth(request, env);\n  const writeCheck = requireWritePermission(user);\n  if (writeCheck) return writeCheck;/' functions/api/admin/settings.js

echo "✅ Guest protection added to all write APIs"
