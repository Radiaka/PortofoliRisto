import { readFile, writeFile } from "node:fs/promises";

const outputPath = new URL("../game-data.json", import.meta.url);
const source = "Enka.Network public showcase";
const headers = {
  Accept: "application/json",
  "User-Agent": "RadiakaPortfolio/1.0 (public game profile snapshot)",
};

async function fetchJson(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Profile API returned HTTP ${response.status}`);
  }
  return response.json();
}

const profiles = {
  genshin: async () => {
    const data = await fetchJson("https://enka.network/api/uid/1801263252/?info");
    const player = data.playerInfo;
    if (!player) throw new Error("Genshin profile data is missing");
    return {
      uid: "1801263252",
      region: data.region || "ASIA",
      name: player.nickname || "Traveler",
      adventureRank: player.level ?? null,
      worldLevel: player.worldLevel ?? null,
      achievements: player.finishAchievementNum ?? null,
      showcaseCharacters: player.showAvatarInfoList?.length ?? 0,
    };
  },
  zzz: async () => {
    const data = await fetchJson("https://enka.network/api/zzz/uid/1313396424/");
    const player = data.PlayerInfo;
    if (!player) throw new Error("Zenless Zone Zero profile data is missing");
    const profile = player.SocialDetail?.ProfileDetail;
    const agents = player.ShowcaseDetail?.AvatarList?.filter((agent) => !agent.IsHidden) || [];
    return {
      uid: "1313396424",
      region: data.region || "ASIA",
      name: profile?.Nickname || null,
      interKnotLevel: profile?.Level ?? null,
      showcaseAgents: agents.length,
      highestAgentLevel: agents.reduce((highest, agent) => Math.max(highest, agent.Level || 0), 0) || null,
    };
  },
  hsr: async () => {
    const data = await fetchJson("https://enka.network/api/hsr/uid/833578527/");
    const player = data.detailInfo;
    if (!player) throw new Error("Honkai: Star Rail profile data is missing");
    return {
      uid: "833578527",
      region: data.region || "ASIA",
      name: player.nickname || "Trailblazer",
      trailblazeLevel: player.level ?? null,
      equilibriumLevel: player.worldLevel ?? null,
      achievements: player.recordInfo?.achievementCount ?? null,
      showcaseCharacters: player.avatarDetailList?.length ?? 0,
      charactersOwned: player.recordInfo?.avatarCount ?? null,
    };
  },
};

let snapshot = { games: {} };
try {
  snapshot = JSON.parse(await readFile(outputPath, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

for (const [game, loadProfile] of Object.entries(profiles)) {
  try {
    snapshot.games[game] = {
      ...await loadProfile(),
      source,
      fetchedAt: new Date().toISOString(),
      stale: false,
      error: null,
    };
  } catch (error) {
    const previous = snapshot.games[game] || {};
    snapshot.games[game] = {
      ...previous,
      source: previous.source || source,
      stale: true,
      error: error.message,
    };
    console.error(`${game}: ${error.message}`);
  }
}

snapshot.updatedAt = new Date().toISOString();
await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
