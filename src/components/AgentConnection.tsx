import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Bot, Unplug } from 'lucide-react';
import { connectBrowser } from '../mcp/browser';

export function AgentConnection() {
  const [status, setStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('disconnected');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const disconnect = useRef<(() => void) | null>(null);
  useEffect(
    () => () => {
      disconnect.current?.();
    },
    []
  );
  function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    disconnect.current?.();
    try {
      disconnect.current = connectBrowser(
        code.trim(),
        (next) => {
          setStatus(next);
          if (next === 'connected') setCode('');
        },
        setError
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Pairing failed.');
    }
  }
  return (
    <details className="agent-menu">
      <summary
        aria-label={
          status === 'connected' ? 'Agent connected' : 'Connect agent'
        }
      >
        <Bot size={15} />
        <span>
          {status === 'connected' ? 'Agent connected' : 'Connect agent'}
        </span>
      </summary>
      <div className="agent-menu-content">
        <h2>Agent connection</h2>
        <p>
          Pairing grants read/write access to this document. Only pair agents
          you trust.
        </p>
        {status === 'connected' ? (
          <button
            className="agent-pair-button"
            onClick={() => disconnect.current?.()}
          >
            <Unplug size={14} />
            Disconnect agent
          </button>
        ) : (
          <form onSubmit={connect}>
            <label htmlFor="pairing-code">Private pairing code</label>
            <input
              id="pairing-code"
              aria-label="Private pairing code"
              type="password"
              value={code}
              autoComplete="off"
              maxLength={64}
              onChange={(event) => setCode(event.target.value)}
            />
            <button
              className="agent-pair-button"
              type="submit"
              disabled={status === 'connecting'}
            >
              {status === 'connecting' ? 'Connecting' : 'Pair agent'}
            </button>
            <p>
              Start your MCP client, then run <code>npm run mcp:pair</code> in
              this checkout.
            </p>
          </form>
        )}
        {error && (
          <p className="agent-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </details>
  );
}
