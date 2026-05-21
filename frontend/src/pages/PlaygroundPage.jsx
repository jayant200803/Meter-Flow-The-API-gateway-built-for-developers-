import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play, Copy, Check, Clock, AlertCircle, Key, Terminal, ChevronDown, ChevronRight, Code2 } from 'lucide-react';
import api from '../services/api';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const METHOD_COLORS = {
  GET:    '#22d3ee',
  POST:   '#10b981',
  PUT:    '#f59e0b',
  PATCH:  '#a855f7',
  DELETE: '#ef4444',
};

const BODY_METHODS = ['POST', 'PUT', 'PATCH'];

function syntaxHighlight(json) {
  if (typeof json !== 'string') return '';
  return json
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'text-amber-300';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) cls = 'text-blue-300';
        else cls = 'text-emerald-300';
      } else if (/true|false/.test(match)) cls = 'text-purple-300';
      else if (/null/.test(match)) cls = 'text-red-300';
      return `<span class="${cls}">${match}</span>`;
    });
}

export default function PlaygroundPage() {
  const [selectedApi, setSelectedApi]   = useState('');
  const [manualKey, setManualKey]       = useState('');
  const [useManualKey, setUseManualKey] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState('');
  const [endpoint, setEndpoint]         = useState('/products');
  const [method, setMethod]             = useState('GET');
  const [body, setBody]                 = useState('{\n  \n}');
  const [bodyError, setBodyError]       = useState('');
  const [loading, setLoading]           = useState(false);
  const [result, setResult]             = useState(null);
  const [copied, setCopied]             = useState('');
  const [showHeaders, setShowHeaders]   = useState(false);
  const [copiedCurl, setCopiedCurl]     = useState(false);

  const { data: apis } = useQuery({
    queryKey: ['apis'],
    queryFn: () => api.get('/apis').then(r => r.data.data.apis),
  });

  const { data: keys } = useQuery({
    queryKey: ['all-keys'],
    queryFn: () => api.get('/keys').then(r => r.data.data.keys),
  });

  const filteredKeys = (keys || []).filter(k =>
    k.status === 'active' && (!selectedApi || k.apiId?._id === selectedApi)
  );

  const activeKey = useManualKey ? manualKey : (keys || []).find(k => k._id === selectedKeyId)?.key || '';

  const hasBody = BODY_METHODS.includes(method);

  const validateBody = (val) => {
    if (!hasBody || !val.trim()) { setBodyError(''); return true; }
    try { JSON.parse(val); setBodyError(''); return true; }
    catch (e) { setBodyError(e.message); return false; }
  };

  const handleTest = async () => {
    if (!activeKey) return;
    if (hasBody && !validateBody(body)) return;
    setLoading(true);
    setResult(null);

    const startTime = performance.now();
    try {
      const fetchOpts = {
        method,
        headers: { 'X-API-Key': activeKey, 'Content-Type': 'application/json' },
      };
      if (hasBody && body.trim()) fetchOpts.body = body;

      const response = await fetch(`/gateway${endpoint}`, fetchOpts);
      let data;
      const ct = response.headers.get('content-type') || '';
      try { data = ct.includes('json') ? await response.json() : await response.text(); }
      catch { data = null; }

      setResult({
        status: response.status,
        statusText: response.statusText,
        latency: Math.round(performance.now() - startTime),
        headers: Object.fromEntries(response.headers.entries()),
        body: data,
        isText: !ct.includes('json'),
      });
    } catch (err) {
      setResult({ status: 0, error: err.message, latency: Math.round(performance.now() - startTime) });
    } finally {
      setLoading(false);
    }
  };

  const curlSnippet = useMemo(() => {
    const keyVal = activeKey || 'YOUR_API_KEY';
    const lines = [`curl -X ${method} \\`, `  '${window.location.origin}/gateway${endpoint}' \\`, `  -H 'X-API-Key: ${keyVal}' \\`, `  -H 'Content-Type: application/json'`];
    if (hasBody && body.trim()) lines.push(` \\\n  -d '${body.replace(/\n/g, ' ')}'`);
    return lines.join('\n');
  }, [method, endpoint, activeKey, hasBody, body]);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const selectedApiObj = (apis || []).find(a => a._id === selectedApi);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">API Playground</h1>
        <p className="text-sm text-white/35 mt-0.5">Test your APIs through the MeterFlow gateway</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── LEFT: Request builder ── */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5 space-y-4" style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-brand-400" />
              <h3 className="text-sm font-bold text-white">Request Builder</h3>
            </div>

            {/* API selector */}
            <div>
              <label className="label">API</label>
              <select className="input" value={selectedApi} onChange={e => { setSelectedApi(e.target.value); setSelectedKeyId(''); }}>
                <option value="">Select an API…</option>
                {(apis || []).map(a => <option key={a._id} value={a._id}>{a.icon} {a.name}</option>)}
              </select>
              {selectedApiObj && (
                <p className="text-[10px] text-white/25 font-mono mt-1 truncate">{selectedApiObj.baseUrl}</p>
              )}
            </div>

            {/* API Key — toggle manual / dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">API Key</label>
                <button onClick={() => setUseManualKey(v => !v)}
                  className="text-[10px] text-brand-400 hover:text-brand-300 transition-colors">
                  {useManualKey ? '← Pick from list' : 'Enter key manually →'}
                </button>
              </div>
              {useManualKey ? (
                <div className="relative">
                  <Key size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input className="input pl-9 font-mono text-xs" placeholder="mf_live_…"
                    value={manualKey} onChange={e => setManualKey(e.target.value)} />
                </div>
              ) : (
                <>
                  <select className="input" value={selectedKeyId} onChange={e => setSelectedKeyId(e.target.value)}>
                    <option value="">Select a key…</option>
                    {filteredKeys.map(k => (
                      <option key={k._id} value={k._id}>{k.name} · {k.keyPrefix}… ({k.environment})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-amber-400/60 mt-1">
                    Full key is only shown at creation. Use "Enter key manually" if you need to paste it.
                  </p>
                </>
              )}
            </div>

            {/* Method + Endpoint */}
            <div className="flex gap-3">
              <div className="w-28 flex-shrink-0">
                <label className="label">Method</label>
                <select className="input font-bold text-sm" value={method} onChange={e => setMethod(e.target.value)}
                  style={{ color: METHOD_COLORS[method] }}>
                  {METHODS.map(m => <option key={m} style={{ color: METHOD_COLORS[m] }}>{m}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="label">Endpoint Path</label>
                <input className="input font-mono text-xs" value={endpoint}
                  onChange={e => setEndpoint(e.target.value)} placeholder="/products/1" />
              </div>
            </div>

            {/* Body (only for POST/PUT/PATCH) */}
            {hasBody && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Request Body <span className="text-brand-400 font-normal">(JSON)</span></label>
                  {bodyError && <span className="text-[10px] text-red-400">{bodyError}</span>}
                </div>
                <textarea
                  className={`input font-mono text-xs resize-y min-h-[120px] ${bodyError ? 'border-red-500/50' : ''}`}
                  value={body}
                  onChange={e => { setBody(e.target.value); validateBody(e.target.value); }}
                  spellCheck={false}
                  placeholder='{\n  "key": "value"\n}'
                />
              </div>
            )}

            {/* Send button */}
            <button onClick={handleTest} disabled={loading || !activeKey}
              className="btn-primary w-full justify-center py-3 text-sm"
              style={activeKey ? {} : { opacity: 0.4 }}>
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Play size={14} /> Send Request</>}
            </button>
          </div>

          {/* cURL snippet */}
          <div className="rounded-2xl p-4" style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Code2 size={13} className="text-white/35" />
                <p className="text-xs font-semibold text-white/55">cURL equivalent</p>
              </div>
              <button onClick={() => { copy(curlSnippet, 'curl'); setCopiedCurl(true); setTimeout(() => setCopiedCurl(false), 2000); }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] text-white/30 hover:text-white/60 transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {copiedCurl ? <Check size={11} /> : <Copy size={11} />}
                {copiedCurl ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="font-mono text-[11px] text-white/40 overflow-x-auto whitespace-pre leading-relaxed p-3 rounded-xl"
              style={{ background: 'rgba(0,0,0,0.35)' }}>
              {curlSnippet}
            </pre>
          </div>
        </div>

        {/* ── RIGHT: Response viewer ── */}
        <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Response header bar */}
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-sm font-bold text-white">Response</h3>
            {result && (
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs text-white/30">
                  <Clock size={11} />
                  {result.latency}ms
                </span>
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                  result.status >= 200 && result.status < 300
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : result.status >= 400
                    ? 'bg-red-500/15 text-red-400'
                    : 'bg-amber-500/15 text-amber-400'
                }`}>
                  {result.status} {result.statusText}
                </span>
                <button onClick={() => copy(JSON.stringify(result.body, null, 2), 'response')}
                  className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/5 transition-colors">
                  {copied === 'response' ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto p-5">
            {!result ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <Play size={18} className="text-brand-400 opacity-60" />
                </div>
                <p className="text-white/20 text-sm">Send a request to see the response</p>
              </div>
            ) : result.error ? (
              <div className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-red-400 mb-0.5">Request Failed</p>
                  <p className="text-xs text-red-400/70">{result.error}</p>
                </div>
              </div>
            ) : (
              <pre className="font-mono text-xs leading-relaxed overflow-x-auto"
                dangerouslySetInnerHTML={{
                  __html: syntaxHighlight(
                    result.isText
                      ? String(result.body)
                      : JSON.stringify(result.body, null, 2)
                  )
                }}
              />
            )}
          </div>

          {/* Response headers collapsible */}
          {result?.headers && Object.keys(result.headers).length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => setShowHeaders(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3 text-xs text-white/30 hover:text-white/50 transition-colors">
                <span className="uppercase tracking-wider text-[10px] font-semibold">Response Headers</span>
                {showHeaders ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
              {showHeaders && (
                <div className="px-5 pb-4 space-y-1 max-h-40 overflow-y-auto">
                  {Object.entries(result.headers).map(([k, v]) => (
                    <div key={k} className="flex gap-3 text-[10px] font-mono">
                      <span className="text-brand-400/60 w-44 flex-shrink-0 truncate">{k}:</span>
                      <span className="text-white/30 truncate">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
