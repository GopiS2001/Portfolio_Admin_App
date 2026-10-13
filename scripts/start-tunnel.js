/**
 * `npm run tunnel` — for when the phone cannot reach this computer directly
 * (phone hotspot, office/guest Wi-Fi, different network).
 *
 * 1. Opens a free Cloudflare quick tunnel to the API on port 4000 (no account needed).
 * 2. Starts `expo start --tunnel` with EXPO_PUBLIC_SERVER_URL set to that tunnel,
 *    so the app talks to the API through it automatically.
 *
 * The BACKEND must already be running (`npm run dev` in BACKEND).
 * The tunnel address changes on every run; Ctrl+C stops both.
 */
const http = require('http');
const { spawn } = require('child_process');
const { bin } = require('cloudflared');

const API_PORT = Number(process.env.API_PORT || 4000);

function checkApi() {
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port: API_PORT, path: '/api/health', timeout: 3000 }, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => req.destroy());
  });
}

function startApiTunnel() {
  return new Promise((resolve, reject) => {
    const cf = spawn(bin, ['tunnel', '--no-autoupdate', '--url', `http://localhost:${API_PORT}`], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const timer = setTimeout(() => reject(new Error('Cloudflare tunnel did not start within 60 s')), 60000);
    const onData = (chunk) => {
      const match = String(chunk).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (match) {
        clearTimeout(timer);
        resolve({ cf, url: match[0] });
      }
    };
    cf.stdout.on('data', onData);
    cf.stderr.on('data', onData);
    cf.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`cloudflared exited (code ${code})`));
    });
  });
}

/** A new quick tunnel can take a few seconds before it answers. */
async function waitForTunnel(url) {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`${url}/api/health`);
      if (res.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}

(async () => {
  if (!(await checkApi())) {
    console.error(`\n✖ The API is not running on port ${API_PORT}. Start it first:\n    cd ../BACKEND && npm run dev\n`);
    process.exit(1);
  }

  console.log('Opening a tunnel to the API…');
  const { cf, url } = await startApiTunnel();
  console.log(`✔ API tunnel: ${url}`);
  if (!(await waitForTunnel(url))) console.log('  (the tunnel is still warming up — it is usually ready within a minute)');

  const expo = spawn('npx', ['expo', 'start', '--tunnel', ...process.argv.slice(2)], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, EXPO_PUBLIC_SERVER_URL: url },
  });

  const stop = () => {
    cf.kill();
    expo.kill();
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  expo.on('exit', (code) => {
    cf.kill();
    process.exit(code ?? 0);
  });
})().catch((error) => {
  console.error(`\n✖ ${error.message}\n`);
  process.exit(1);
});
