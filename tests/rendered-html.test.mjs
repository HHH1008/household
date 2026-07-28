import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the household PWA launch shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>家务档案｜家庭维护打卡<\/title>/);
  assert.match(html, /class="pwa-launch-screen"/);
  assert.match(html, /你的私人家庭维护计划/);
  assert.match(html, /manifest-industrial\.webmanifest/);
  assert.match(html, /aria-busy="true"/);
  assert.doesNotMatch(html, /2000年|2026-08-07|codex-preview/i);
});

test("derives today from the phone clock and supports returning to it", async () => {
  const source = await readFile(
    new URL("../app/HomeClient.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /function getLocalDateKey\(date = new Date\(\)\)/);
  assert.match(source, /window\.setInterval\(syncCurrentDate, 60_000\)/);
  assert.match(source, /window\.addEventListener\("focus", syncCurrentDate\)/);
  assert.match(source, /setSelectedWeekStart\(currentWeekStart\)/);
  assert.match(source, /setSelectedDay\(getWeekDayFromDateKey\(todayKey\)\)/);
  assert.match(source, /回到今天/);
  assert.doesNotMatch(
    source,
    /const appTodayKey|const appCurrentWeekStart|2026-08-07|20260727/,
  );
});
