import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup Guides - OMG AI",
  description: "Step-by-step guides for connecting OMG AI to Claude, Cursor, and more.",
};

export default function GuidesPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-3">Setup Guides</h1>
        <p className="text-zinc-400">Get connected in minutes. Choose your AI tool below.</p>
      </div>

      <div className="space-y-8">
        {/* Claude.ai */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-orange-600/20 rounded-lg flex items-center justify-center text-orange-400 font-bold text-sm">C</div>
            <h2 className="text-xl font-bold text-white">Claude.ai</h2>
            <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded">OAuth - Recommended</span>
          </div>
          <ol className="space-y-3 text-sm text-zinc-300">
            <li className="flex gap-3"><span className="text-zinc-500 flex-shrink-0 font-mono">1.</span><span>Sign in at <strong>app.omgai.io</strong> and connect your Google account via the dashboard.</span></li>
            <li className="flex gap-3"><span className="text-zinc-500 flex-shrink-0 font-mono">2.</span><span>In Claude.ai, go to <strong>Settings - Integrations - Add custom integration</strong>.</span></li>
            <li className="flex gap-3"><span className="text-zinc-500 flex-shrink-0 font-mono">3.</span><span>Enter your MCP endpoint URL from the dashboard.</span></li>
            <li className="flex gap-3"><span className="text-zinc-500 flex-shrink-0 font-mono">4.</span><span>Claude will redirect you to OMG AI to authorize access. Select which properties to share.</span></li>
            <li className="flex gap-3"><span className="text-zinc-500 flex-shrink-0 font-mono">5.</span><span>After authorizing, Claude will have access to all 23 GSC and GA4 tools.</span></li>
          </ol>
        </div>

        {/* Claude Desktop */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center text-purple-400 font-bold text-sm">D</div>
            <h2 className="text-xl font-bold text-white">Claude Desktop</h2>
            <span className="text-xs bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded">API Key</span>
          </div>
          <ol className="space-y-3 text-sm text-zinc-300">
            <li className="flex gap-3"><span className="text-zinc-500 flex-shrink-0 font-mono">1.</span><span>From your OMG AI dashboard, go to <strong>API Keys</strong> and create a new key. Copy it - it is shown only once.</span></li>
            <li className="flex gap-3"><span className="text-zinc-500 flex-shrink-0 font-mono">2.</span><span>Open your Claude Desktop config file at <code className="bg-zinc-800 px-1 rounded text-xs">~/Library/Application Support/Claude/claude_desktop_config.json</code>.</span></li>
            <li className="flex gap-3"><span className="text-zinc-500 flex-shrink-0 font-mono">3.</span>
              <div>
                <span>Add this block under <code className="bg-zinc-800 px-1 rounded text-xs">mcpServers</code>:</span>
                <pre className="mt-2 bg-zinc-800 rounded-lg p-3 text-xs text-zinc-300 overflow-x-auto">{`"omg-ai": {
  "url": "https://app.omgai.io/api/mcp",
  "headers": {
    "Authorization": "Bearer YOUR_API_KEY"
  }
}`}</pre>
              </div>
            </li>
            <li className="flex gap-3"><span className="text-zinc-500 flex-shrink-0 font-mono">4.</span><span>Restart Claude Desktop. The OMG AI tools will appear in Claude&apos;s tool list.</span></li>
          </ol>
        </div>

        {/* Cursor */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-cyan-600/20 rounded-lg flex items-center justify-center text-cyan-400 font-bold text-sm">Cu</div>
            <h2 className="text-xl font-bold text-white">Cursor</h2>
            <span className="text-xs bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded">API Key</span>
          </div>
          <ol className="space-y-3 text-sm text-zinc-300">
            <li className="flex gap-3"><span className="text-zinc-500 flex-shrink-0 font-mono">1.</span><span>Create an API key from your OMG AI dashboard under <strong>API Keys</strong>.</span></li>
            <li className="flex gap-3"><span className="text-zinc-500 flex-shrink-0 font-mono">2.</span><span>In Cursor, go to <strong>Settings - MCP</strong> and click <strong>Add MCP Server</strong>.</span></li>
            <li className="flex gap-3"><span className="text-zinc-500 flex-shrink-0 font-mono">3.</span><span>Set the URL to your MCP endpoint and add <code className="bg-zinc-800 px-1 rounded text-xs">Authorization: Bearer YOUR_API_KEY</code> as a header.</span></li>
            <li className="flex gap-3"><span className="text-zinc-500 flex-shrink-0 font-mono">4.</span><span>Save and reload. Cursor&apos;s agent will now have access to all GSC and GA4 tools.</span></li>
          </ol>
        </div>

        {/* Managing Properties */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-zinc-700 rounded-lg flex items-center justify-center text-zinc-300 font-bold text-sm">P</div>
            <h2 className="text-xl font-bold text-white">Managing Properties</h2>
          </div>
          <div className="space-y-3 text-sm text-zinc-300">
            <p>Your AI assistant only has access to properties you explicitly activate. From the dashboard:</p>
            <ul className="space-y-2">
              <li className="flex gap-3"><span className="text-zinc-500">-</span><span>Toggle GSC properties on/off using the checkboxes in the GSC section.</span></li>
              <li className="flex gap-3"><span className="text-zinc-500">-</span><span>Toggle GA4 properties on/off in the GA4 section.</span></li>
              <li className="flex gap-3"><span className="text-zinc-500">-</span><span>If you want to grant access to a new property, connect Google again to refresh the property list.</span></li>
              <li className="flex gap-3"><span className="text-zinc-500">-</span><span>When using Claude.ai OAuth, the consent page also shows which properties to share per-session.</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
