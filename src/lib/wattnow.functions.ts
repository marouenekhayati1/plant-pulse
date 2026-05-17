import { createServerFn } from "@tanstack/react-start";
import { pollWattNow, loadRecentSnapshots } from "./wattnow.server";

export const getWattNowRealtime = createServerFn({ method: "GET" }).handler(async () => {
  const current = await pollWattNow();
  const history = await loadRecentSnapshots(60);
  return { current, history };
});