// Shared native-session policy for the daily planner and isolated verification.
import { spawnSync } from 'node:child_process';
/** @param {Record<string,string|undefined>} [base] @returns {Record<string,string|undefined>} */
export function sessionEnvironment(base = process.env) {
  const env = { ...base, TSX_DISABLE_CACHE: '1', LIFEHARNESS_HOOK_AUDIT: '1' };
  for (const key of [
    'CODEX_PERMISSION_PROFILE',
    'CODEX_THREAD_ID',
    'CODEX_SESSION_ID',
    'CODEX_TOOL_CALL_ID',
  ])
    delete env[key];
  return env;
}
export function nativePolicy(cwd, context) {
  return [
    '--no-daemon',
    '--cd',
    cwd,
    '--sandbox',
    'workspace-write',
    '--ask-for-approval',
    'never',
    '-c',
    'sandbox_workspace_write.writable_roots=[]',
    '-c',
    'sandbox_workspace_write.network_access=false',
    '-c',
    'sandbox_workspace_write.exclude_slash_tmp=true',
    '-c',
    'sandbox_workspace_write.exclude_tmpdir_env_var=true',
    '-c',
    'features.plugins=false',
    '-c',
    'features.multi_agent=false',
    '-c',
    'features.shell_snapshot=false',
    '-c',
    'web_search="disabled"',
    '-c',
    'model_provider="openai"',
    '-c',
    'forced_login_method="chatgpt"',
    '-c',
    `developer_instructions=${JSON.stringify(context)}`,
  ];
}
export function disableMcp(args, cwd) {
  const env = sessionEnvironment();
  const list = spawnSync('codex', ['mcp', 'list', '--json'], {
    cwd,
    env,
    encoding: 'utf8',
    timeout: 10000,
    maxBuffer: 1024 * 1024,
  });
  if (list.status !== 0)
    throw new Error('Could not inspect MCP configuration.');
  for (const server of JSON.parse(list.stdout)) {
    if (!/^[A-Za-z0-9_-]+$/.test(server.name))
      throw new Error('Unsupported MCP name.');
    const transport =
      server.transport?.type === 'stdio'
        ? 'command="node"'
        : `url=${JSON.stringify(server.transport?.url ?? '')}`;
    args.push('-c', `mcp_servers.${server.name}={enabled=false,${transport}}`);
  }
  const verified = spawnSync('codex', [...args, 'mcp', 'list', '--json'], {
    cwd,
    env,
    encoding: 'utf8',
    timeout: 10000,
    maxBuffer: 1024 * 1024,
  });
  if (
    verified.status !== 0 ||
    JSON.parse(verified.stdout).some((s) => s.enabled !== false)
  )
    throw new Error('Could not verify disabled MCP servers.');
  return args;
}
