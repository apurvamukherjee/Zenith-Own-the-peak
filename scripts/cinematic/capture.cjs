// Scripted walkthrough of the app, captured via the CDP screencast.
// Writes one JPEG per painted frame + timeline.json (scene start times);
// captions and music are added by compose.py / music.py from that timeline.
// Needs the dev server running (npm run dev). See ./README.md.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = path.resolve(process.env.CINE_OUT || 'cinematic-out');
const RUN = `${OUT}/run-${Date.now()}`; fs.mkdirSync(RUN, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark', userAgent: devices['Pixel 7'].userAgent });
  const p = await ctx.newPage();
  const URL = process.env.CINE_URL || 'http://localhost:6969';
  await p.goto(URL); await p.waitForTimeout(6000);
  console.log('seed', await p.evaluate(`(${fs.readFileSync(path.join(__dirname, 'seed.js'), 'utf8')})()`));
  await p.reload(); await p.waitForTimeout(9000);           // let engines settle badges/XP
  await p.reload(); await p.waitForTimeout(6000);
  await p.evaluate(() => { localStorage.removeItem('zenith:splash-seen'); sessionStorage.clear(); });

  const cdp = await ctx.newCDPSession(p);
  const frames = []; let t0 = null;
  cdp.on('Page.screencastFrame', async (f) => {
    const ts = f.metadata.timestamp; if (t0 === null) t0 = ts;
    const file = `${RUN}/${String(frames.length).padStart(5, '0')}.jpg`;
    fs.writeFileSync(file, Buffer.from(f.data, 'base64'));
    frames.push({ t: ts - t0, file });
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  const scenes = [];
  const clock = () => (t0 === null ? 0 : Date.now() / 1000 - t0);
  const scene = (key) => scenes.push({ key, t: clock() });
  const go = async (r) => { await p.evaluate((r) => { history.pushState({}, '', r); dispatchEvent(new PopStateEvent('popstate')); }, r); };
  const scroll = async (dy, steps = 30, ms = 1400) => { for (let i = 0; i < steps; i++) { await p.evaluate((d) => document.querySelector('main').scrollBy(0, d), dy / steps); await p.waitForTimeout(ms / steps); } };
  const top = () => p.evaluate(() => document.querySelector('main').scrollTo(0, 0));

  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 });
  await p.waitForTimeout(300);
  scene('splash'); await p.reload(); await p.waitForTimeout(5600);
  scene('home'); await p.waitForTimeout(2600); await scroll(520, 40, 2200); await p.waitForTimeout(900); await top();
  scene('train'); await go('/workout'); await p.waitForTimeout(1600); await scroll(900, 40, 1800); await p.waitForTimeout(500);
  const tick = p.locator('button.st-check:not(.is-done)').first();
  await tick.scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
  scene('log'); await tick.tap(); await p.waitForTimeout(2600);
  const tick2 = p.locator('button.st-check:not(.is-done)').first(); await tick2.tap(); await p.waitForTimeout(2400);
  await p.evaluate(async () => (await import('/src/lib/restTimerStore.ts')).skipRest());
  scene('nutrition'); await go('/nutrition'); await p.waitForTimeout(2400); await scroll(380, 30, 1500); await p.waitForTimeout(800);
  scene('calendar'); await go('/calendar'); await p.waitForTimeout(2600);
  await scroll(300, 30, 1400); await p.waitForTimeout(900);
  scene('arc'); await go('/arc'); await p.waitForTimeout(2600); await scroll(700, 40, 2200); await p.waitForTimeout(600);
  scene('stats'); await go('/profile'); await p.waitForTimeout(2200); await scroll(600, 40, 2000); await p.waitForTimeout(600);
  scene('hall'); await go('/hall'); await p.waitForTimeout(2400); await scroll(500, 30, 1600); await p.waitForTimeout(700);
  scene('end'); await p.waitForTimeout(300);
  await cdp.send('Page.stopScreencast');
  fs.writeFileSync(`${RUN}/timeline.json`, JSON.stringify({ frames, scenes, end: clock() }, null, 1));
  console.log(RUN); console.log('frames', frames.length, 'scenes', scenes.map((s) => `${s.key}@${s.t.toFixed(1)}`).join(' '));
  await b.close();
})();
