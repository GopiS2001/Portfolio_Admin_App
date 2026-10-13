const os = require('os');

/**
 * Wi-Fi / LAN IP of the computer running `expo start`. The app uses it to find the API
 * (port 4000) — also in `--tunnel` mode, where the app itself loads through a public tunnel
 * but the API is still only reachable on the local network.
 */
function lanIp() {
  const isPrivate = (ip) =>
    /^10\./.test(ip) || /^192\.168\./.test(ip) || /^172\.(1[6-9]|2\d|3[01])\./.test(ip);
  const addresses = Object.values(os.networkInterfaces())
    .flat()
    .filter((a) => a && a.family === 'IPv4' && !a.internal)
    .map((a) => a.address);
  return addresses.find(isPrivate) ?? addresses[0] ?? null;
}

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    lanIp: lanIp(),
  },
});
