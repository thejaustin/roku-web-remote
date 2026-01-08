import React, { useState } from 'react';
import { Play, SkipBack, SkipForward, Home, Volume2, Mic, Search, ArrowLeft, Star, Power, RotateCcw } from 'lucide-react';

export default function RokuRemote() {
  const [rokuIP, setRokuIP] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [useProxy, setUseProxy] = useState(true); // toggle to force proxy usage

  const showFeedback = (message) => {
    setFeedback(message);
    setTimeout(() => setFeedback(''), 3000);
  };

  // Attempt proxy first (if present). If proxy not reachable, fall back to direct HTTP to Roku.
  const sendCommand = async (command) => {
    if (!isConnected || !rokuIP) {
      showFeedback('Connect to device first');
      return;
    }

    showFeedback(command);
    const encodedIp = encodeURIComponent(rokuIP.trim());
    const encodedCmd = encodeURIComponent(command);

    // Try using local proxy
    if (useProxy) {
      try {
        const res = await fetch(`/api/roku/${encodedIp}/keypress/${encodedCmd}`, { method: 'POST' });
        if (!res.ok) {
          throw new Error(`Proxy ${res.status} ${res.statusText}`);
        }
        showFeedback(`${command} sent (proxy)`);
        return;
      } catch (err) {
        console.warn('Proxy failed:', err.message);
        // continue to direct attempt
      }
    }

    // Direct attempt (may be blocked by CORS or mixed-content)
    try {
      await fetch(`http://${rokuIP}:8060/keypress/${command}`, { method: 'POST', mode: 'no-cors' });
      showFeedback(`${command} sent (direct)`);
    } catch (err) {
      console.error('Direct send failed:', err);
      showFeedback('Error sending command (see console)');
    }
  };

  // Test device info via proxy first, then direct
  const testRokuIP = async (ip) => {
    const encodedIp = encodeURIComponent(ip.trim());
    if (useProxy) {
      try {
        const res = await fetch(`/api/roku/${encodedIp}/query/device-info`, { method: 'GET' });
        if (res.ok) {
          const text = await res.text();
          const nameMatch = text.match(/<friendly-device-name>(.*?)<\/friendly-device-name>/);
          const modelMatch = text.match(/<model-name>(.*?)<\/model-name>/);
          return { valid: true, name: nameMatch ? nameMatch[1] : 'Roku Device', model: modelMatch ? modelMatch[1] : '' };
        }
      } catch (err) {
        console.warn('Proxy test failed:', err.message);
      }
    }

    // Try direct
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`http://${ip}:8060/query/device-info`, { method: 'GET', signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const text = await response.text();
        const nameMatch = text.match(/<friendly-device-name>(.*?)<\/friendly-device-name>/);
        const modelMatch = text.match(/<model-name>(.*?)<\/model-name>/);
        return { valid: true, name: nameMatch ? nameMatch[1] : 'Roku Device', model: modelMatch ? modelMatch[1] : '' };
      }
      return { valid: false, error: `HTTP ${response.status}` };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  };

  const connect = async () => {
    const ip = rokuIP.trim();
    if (!ip) {
      showFeedback('Enter an IP first');
      return;
    }
    showFeedback('Testing connection...');
    const result = await testRokuIP(ip);
    if (result.valid) {
      setIsConnected(true);
      showFeedback(`Connected to ${result.name}`);
    } else {
      showFeedback(`Connection failed: ${result.error || 'unknown'}`);
      console.log('Troubleshooting: Ensure Roku & this device are on same network, External Control is enabled, and if site served over HTTPS use the proxy.');
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setRokuIP('');
    showFeedback('Disconnected');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-white text-3xl font-bold mb-2">Roku</h1>
          <p className="text-purple-200 text-sm">Remote Control</p>
        </div>

        {!isConnected ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-6">
            <p className="text-white text-sm mb-3 font-semibold">Connect to Your Roku</p>

            <div className="bg-purple-900/50 border border-purple-500/30 rounded-lg p-4 mb-4">
              <p className="text-purple-200 text-xs font-semibold mb-2">Find Your Roku IP Address:</p>
              <ol className="text-purple-200 text-xs space-y-1 list-decimal list-inside">
                <li>On your Roku: Settings → Network → About</li>
                <li>Or use the official Roku mobile app</li>
                <li>Or check your router's connected devices</li>
              </ol>
            </div>

            <input
              type="text"
              placeholder="192.168.1.100"
              value={rokuIP}
              onChange={(e) => setRokuIP(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && connect()}
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-purple-300 border border-white/30 focus:outline-none focus:border-purple-400 mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={connect}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Connect
              </button>
              <button
                onClick={() => setUseProxy(u => !u)}
                className={`px-3 py-3 rounded-lg border ${useProxy ? 'bg-green-600 text-white' : 'bg-white/10 text-white'}`}
                title="Toggle proxy usage"
              >
                Proxy: {useProxy ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-lg rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-semibold">Connected: {rokuIP}</span>
              <button
                onClick={disconnect}
                className="text-purple-300 hover:text-white text-xs font-semibold"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        <div className="bg-gray-900 rounded-lg shadow-2xl p-6">
          {feedback && (
            <div className="bg-purple-600 text-white text-center py-2 px-4 rounded-lg mb-4 text-sm font-semibold">
              {feedback}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mb-4">
            <button onClick={() => sendCommand('PowerOff')} className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg flex items-center justify-center" title="Power">
              <Power className="w-5 h-5 text-white" />
            </button>
            <button onClick={() => sendCommand('Back')} className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg flex items-center justify-center" title="Back">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <button onClick={() => sendCommand('Home')} className="bg-purple-600 hover:bg-purple-700 p-3 rounded-lg flex items-center justify-center" title="Home">
              <Home className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="mb-4 flex justify-center">
            <div className="inline-grid grid-cols-3 gap-1 bg-gray-950 p-2 rounded-lg">
              <div className="w-20"></div>
              <button onClick={() => sendCommand('Up')} className="bg-gray-800 hover:bg-gray-700 w-20 h-16 rounded flex items-center justify-center" title="Up">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14l5-5 5 5z"/></svg>
              </button>
              <div className="w-20"></div>

              <button onClick={() => sendCommand('Left')} className="bg-gray-800 hover:bg-gray-700 w-20 h-20 rounded flex items-center justify-center" title="Left">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M14 7l-5 5 5 5z"/></svg>
              </button>
              <button onClick={() => sendCommand('Select')} className="bg-purple-600 hover:bg-purple-700 w-20 h-20 rounded flex items-center justify-center text-white font-bold text-base" title="OK / Select">OK</button>
              <button onClick={() => sendCommand('Right')} className="bg-gray-800 hover:bg-gray-700 w-20 h-20 rounded flex items-center justify-center" title="Right">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M10 17l5-5-5-5z"/></svg>
              </button>

              <div className="w-20"></div>
              <button onClick={() => sendCommand('Down')} className="bg-gray-800 hover:bg-gray-700 w-20 h-16 rounded flex items-center justify-center" title="Down">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
              </button>
              <div className="w-20"></div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <button onClick={() => sendCommand('Rev')} className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg flex items-center justify-center" title="Rewind"><SkipBack className="w-5 h-5 text-white" /></button>
            <button onClick={() => sendCommand('Play')} className="bg-purple-600 hover:bg-purple-700 p-3 rounded-lg flex items-center justify-center" title="Play/Pause"><Play className="w-5 h-5 text-white" /></button>
            <button onClick={() => sendCommand('Fwd')} className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg flex items-center justify-center" title="Fast Forward"><SkipForward className="w-5 h-5 text-white" /></button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <button onClick={() => sendCommand('Info')} className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg flex items-center justify-center gap-2" title="Options"><Star className="w-4 h-4 text-white" /><span className="text-white text-sm">Options</span></button>
            <button onClick={() => sendCommand('InstantReplay')} className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg flex items-center justify-center gap-2" title="Instant Replay"><RotateCcw className="w-4 h-4 text-white" /><span className="text-white text-sm">Replay</span></button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <button onClick={() => sendCommand('VolumeDown')} className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg flex items-center justify-center gap-1" title="Volume Down"><Volume2 className="w-4 h-4 text-white" /><span className="text-white text-lg">-</span></button>
            <button onClick={() => sendCommand('VolumeMute')} className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg flex items-center justify-center" title="Mute"><span className="text-white text-xs font-semibold">Mute</span></button>
            <button onClick={() => sendCommand('VolumeUp')} className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg flex items-center justify-center gap-1" title="Volume Up"><Volume2 className="w-4 h-4 text-white" /><span className="text-white text-lg">+</span></button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => sendCommand('Search')} className="bg-purple-600 hover:bg-purple-700 p-3 rounded-lg flex items-center justify-center gap-2" title="Search"><Search className="w-4 h-4 text-white" /><span className="text-white text-sm">Search</span></button>
            <button onClick={() => sendCommand('Search')} className="bg-purple-600 hover:bg-purple-700 p-3 rounded-lg flex items-center justify-center gap-2" title="Voice Search"><Mic className="w-4 h-4 text-white" /><span className="text-white text-sm">Voice</span></button>
          </div>
        </div>

        <p className="text-purple-200 text-xs text-center mt-4">Roku ECP Remote • Press Enter after typing IP</p>
      </div>
    </div>
  );
}