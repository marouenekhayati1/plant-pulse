import { createServerFn } from "@tanstack/react-start";
import { pollWattNow, loadRecentSnapshots, loadDailyTrend } from "./wattnow.server";

export const getWattNowRealtime = createServerFn({ method: "GET" }).handler(async () => {
  const current = await pollWattNow();
  const history = await loadRecentSnapshots(60);
  const trend24h = await loadDailyTrend();
  return { current, history, trend24h };
});