# Self-Hosted Speech Recognition

The reader can send mono 16 kHz PCM audio to a Faster-Whisper service over WebSocket. The service returns replaceable rolling transcript snapshots; the reader aligns each snapshot against the passage and never moves its confirmed cursor backward. If `VITE_SPEECH_WS_URL` is unset, the current browser speech-recognition path remains active.

This is near-real-time transcription, not hard real-time. Faster-Whisper latency depends on the model and CPU/GPU, and rolling-window transcripts can be revised. The UI cursor is monotonic, but that does not make transcription 100% accurate.

## Local Setup

Prerequisites: Docker Desktop with Compose, Node.js/npm, and a secure browser context (`localhost` is allowed for local development).

1. In `speech-service`, copy `.env.example` to `.env`. Keep `SPEECH_ALLOWED_ORIGINS` limited to the exact local app origin and the production app origin you use.
2. From `speech-service`, start the service with `docker compose up --build`. The first start downloads the Whisper model and can take several minutes. The service listens only on `127.0.0.1:8000` on the host.
3. In the project root, copy `.env.example` to `.env` if you do not already have a local environment file. Set `VITE_SPEECH_WS_URL=ws://localhost:8000/ws/speech`.
4. Start the web app with `npm run dev`. Use the exact origin printed by Vite; if it is not `http://localhost:5173`, add that origin to `SPEECH_ALLOWED_ORIGINS` and restart the speech container.
5. Sign in, open Practice, and start a passage. Allow microphone access. Check `docker compose logs -f` from `speech-service` if the status reports a server or transcription error.

## Deploying the Service Outside VS Code

The web app currently builds for Vercel. Vercel functions are not suitable for hosting the Whisper model, so run only the speech service on a Linux VPS or hardware you administer. This deploys ASR on your machine; it does not move the web app or Supabase off their current providers.

1. Provision a Linux VPS with Docker Engine and the Docker Compose plugin. Start with at least 2 vCPU and 4 GB RAM for the `base` CPU model; allow more RAM/disk and expect slower startup/inference on smaller machines. Faster-Whisper downloads model files on first launch.
2. Clone this repository on the VPS, enter `speech-service`, and copy `.env.example` to `.env`. Set `SPEECH_ALLOWED_ORIGINS` to the exact HTTPS origin of your deployed web app. Do not include a trailing slash. Keep the service bound to `127.0.0.1` in Compose.
3. Run `docker compose up -d --build`, then `docker compose logs -f speech`. Verify locally on the VPS with `curl http://127.0.0.1:8000/health`.
4. Point a DNS name such as `speech.example.com` to the VPS. Configure a reverse proxy (for example, Caddy or Nginx) to terminate TLS and proxy WebSocket upgrades to `127.0.0.1:8000`. Do not expose port 8000 directly to the public internet. The browser requires `wss://` when the app is served over HTTPS.
5. Add a restriction at the proxy/firewall before making this service public. `SPEECH_ALLOWED_ORIGINS` is a browser-origin check, not authentication; non-browser clients can forge an Origin header and consume your CPU. Use a private network/VPN, IP allowlist where practical, or add authenticated short-lived access tokens plus rate limits before exposing the endpoint to arbitrary users. Do not put a permanent secret in a `VITE_` variable; it is shipped to every browser.
6. In the Vercel project settings, add `VITE_SPEECH_WS_URL=wss://speech.example.com/ws/speech` for the production environment, then redeploy the web app. This URL is public configuration, not a credential.
7. Test a short passage from the deployed HTTPS app, inspect the browser console and VPS logs, and verify stopping/exiting the reader releases the microphone. Monitor CPU, RAM, disk, and bandwidth; choose `tiny` for lower resource use or a supported GPU configuration only after measuring the VPS hardware.

Example Caddy site block (Caddy handles TLS certificates and WebSocket proxying):

```caddyfile
speech.example.com {
	reverse_proxy 127.0.0.1:8000
}
```

## Operation Notes

- The ASR server retains a rolling 12-second audio window in memory, discards it when the connection ends, and limits each connection to 20 minutes. It does not persist uploaded audio.
- The service accepts only the languages currently offered by the app (`en`, `es`, `fr`, `de`, `pt`); it maps locale values such as `en-US` to their language code.
- A 16 kHz sample rate is produced by the browser AudioWorklet resampler. Hardware capture rate can vary; it is not assumed that the device honors a 16 kHz request.
- WebSocket inference is CPU/GPU intensive. The sample service defaults to one concurrent session (`MAX_CONCURRENT_SESSIONS=1`) and is intended as a starting deployment, not a capacity-tested multi-tenant service.
