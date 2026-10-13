# Portfolio Admin — mobile app

The admin dashboard as an Expo / React Native app. Same screens, same API, same login:

| Tab / screen | What it does |
| --- | --- |
| **Dashboard** | Counts, website online status, latest messages, sections, shortcuts |
| **Content** → Home, About, Skills, Experience, Projects, Contact | Section settings + every list (add / edit / delete, show-hide, reorder) |
| **Messages** | Contact-form inbox: read / unread, reply by email, delete |
| **Configuration** | Section on/off + menu + order, site, header, blocks, theme, fonts, offline snapshot |
| **Content → Account** | Change name, login email and password; sign out |

## Run it in Expo Go

```bash
# 1. Start the API (the app talks to it)
cd BACKEND
npm run dev

# 2. Start the app
cd App
npm install
npx expo start
```

Install **Expo Go** on your phone, connect it to the same Wi-Fi as the computer, then scan the
QR code (Android: in Expo Go, iPhone: with the Camera app). Sign in with your dashboard login.

The app finds the API on its own: it uses port 4000 on the computer running `expo start`
(e.g. `http://10.225.30.2:4000`). To use another server, tap **Change** under the sign-in
button, or set `EXPO_PUBLIC_SERVER_URL=http://<ip>:4000` in `App/.env`.

If the phone cannot connect, allow Node.js through Windows Firewall for private networks.

### Phone on a different network (hotspot, guest Wi-Fi)

When the phone cannot reach the computer directly, run this instead of `npx expo start`
(the backend must already be running):

```bash
npm run tunnel
```

It opens a free Cloudflare tunnel to the API, then starts `expo start --tunnel` with the app
pointed at it — no server address to type. The tunnel address changes on every run.
In this mode "Open website" / "Preview" links do not work (only the API is tunnelled).

## Code layout

- `src/app/` — screens (Expo Router: `(tabs)/` is the bottom tab bar, `content/` the content pages)
- `src/components/` — `CrudList`, `SingletonForm`, `SectionHeadingCard` and the form fields,
  mirroring `ADMIN DASHBOARD/src/portfolio/components`
- `src/lib/` — API client, auth (token kept in SecureStore), shared cache, types and options
  copied from the dashboard (`types.ts`, `options.ts` — keep them in sync)

```bash
npm run typecheck
npx expo lint
```
