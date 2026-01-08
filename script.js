const ipInput = document.getElementById('rokuIp');
const saveBtn = document.getElementById('saveIp');
const statusEl = document.getElementById('status');

const saved = localStorage.getItem('roku_ip');
if (saved) ipInput.value = saved;

saveBtn.addEventListener('click', () => {
  localStorage.setItem('roku_ip', ipInput.value.trim());
  status('Saved IP: ' + ipInput.value.trim());
});

function status(text) {
  statusEl.textContent = 'Status: ' + text;
}

async function sendKey(key) {
  const ip = ipInput.value.trim();
  if (!ip) { status('Set Roku IP first'); return; }
  status(`Sending ${key} to ${ip}...`);
  try {
    const res = await fetch(`/api/roku/${encodeURIComponent(ip)}/keypress/${encodeURIComponent(key)}`, {
      method: 'POST'
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`${res.status} ${res.statusText}: ${txt}`);
    }
    status(`Sent ${key}`);
  } catch (err) {
    status('Error: ' + err.message);
  }
}

document.body.addEventListener('click', (ev) => {
  const btn = ev.target.closest('button[data-key]');
  if (!btn) return;
  const key = btn.getAttribute('data-key');
  sendKey(key);
});

document.body.addEventListener('click', (ev) => {
  const btn = ev.target.closest('button[data-app]');
  if (!btn) return;
  const ip = ipInput.value.trim();
  if (!ip) { status('Set Roku IP first'); return; }
  const appId = btn.getAttribute('data-app');
  status(`Launching app ${appId} on ${ip}...`);
  fetch(`/api/roku/${encodeURIComponent(ip)}/launch/${encodeURIComponent(appId)}`, { method: 'POST' })
    .then(res => {
      if (!res.ok) throw new Error(res.statusText);
      status('Launched app ' + appId);
    })
    .catch(err => status('Error: ' + err.message));
});