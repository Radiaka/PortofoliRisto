document.documentElement.classList.add("js");

const root = document.documentElement;
const themeButton = document.getElementById("theme");
const roleElement = document.getElementById("role");
const gif = document.getElementById("gif");
const copyButton = document.querySelector(".copy-button");
const copyStatus = document.getElementById("copy-status");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function getPreferredTheme() {
  try {
    const theme = localStorage.getItem("theme");
    return theme === "light" || theme === "dark" ? theme : null;
  } catch {
    return null;
  }
}

function applyTheme(theme) {
  if (theme) {
    root.dataset.theme = theme;
  } else {
    delete root.dataset.theme;
  }

  const isDark = theme
    ? theme === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
  themeButton.textContent = isDark ? "☀" : "☾";
  themeButton.setAttribute("aria-label", `Aktifkan tema ${isDark ? "terang" : "gelap"}`);
  themeButton.setAttribute("aria-pressed", String(isDark));
}

applyTheme(getPreferredTheme());

themeButton.addEventListener("click", () => {
  const currentIsDark = root.dataset.theme
    ? root.dataset.theme === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
  const nextTheme = currentIsDark ? "light" : "dark";
  applyTheme(nextTheme);

  try {
    localStorage.setItem("theme", nextTheme);
  } catch {
    // Theme tetap diterapkan untuk sesi ini jika penyimpanan browser tidak tersedia.
  }
});

const roles = ["Full-Stack Developer", "Laravel Enthusiast", "UI/UX Tinkerer"];
if (roleElement) {
  if (reducedMotion) {
    roleElement.textContent = roles[0];
  } else {
    let roleIndex = 0;
    let characterIndex = 0;
    let deleting = false;

    function typeRole() {
      const currentRole = roles[roleIndex];
      roleElement.textContent = currentRole.slice(0, characterIndex);

      if (!deleting && characterIndex < currentRole.length) {
        characterIndex += 1;
      } else if (!deleting) {
        deleting = true;
        window.setTimeout(typeRole, 1200);
        return;
      } else if (characterIndex > 0) {
        characterIndex -= 1;
      } else {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
      }

      window.setTimeout(typeRole, deleting ? 38 : 75);
    }

    typeRole();
  }
}

const revealSections = document.querySelectorAll(".rv");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("on");
      entry.target.querySelectorAll(".bar i[data-w]").forEach((bar) => {
        bar.style.width = `${bar.dataset.w}%`;
      });
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  revealSections.forEach((section) => observer.observe(section));
} else {
  revealSections.forEach((section) => {
    section.classList.add("on");
    section.querySelectorAll(".bar i[data-w]").forEach((bar) => {
      bar.style.width = `${bar.dataset.w}%`;
    });
  });
}

if (gif) {
  const colors = ["#5548e8", "#08a9c5", "#f59e0b", "#ef4444", "#10b981"];
  gif.addEventListener("click", () => {
    if (reducedMotion) return;

    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 45; index += 1) {
      const confetti = document.createElement("span");
      confetti.className = "c";
      confetti.style.left = `${Math.random() * 100}vw`;
      confetti.style.backgroundColor = colors[index % colors.length];
      confetti.style.animationDelay = `${Math.random() * 0.45}s`;
      fragment.appendChild(confetti);
      window.setTimeout(() => confetti.remove(), 2200);
    }
    document.body.appendChild(fragment);
  });
}

if (copyButton && copyStatus) {
  copyButton.addEventListener("click", async () => {
    const username = copyButton.dataset.copy;
    try {
      await navigator.clipboard.writeText(username);
      copyStatus.textContent = "Discord username copied.";
    } catch {
      copyStatus.textContent = `Copy unavailable. Username: ${username}`;
    }
  });
}

if (document.getElementById("spotify-connect")) {
const SPOTIFY_CLIENT_ID = "b913d8a54b1f4d12b69310e35834dbe6";
const spotifyConnectButton = document.getElementById("spotify-connect");
const spotifyDisconnectButton = document.getElementById("spotify-disconnect");
const spotifyRefreshButton = document.getElementById("spotify-refresh");
const spotifyStatus = document.getElementById("spotify-status");
const spotifyRedirectText = document.getElementById("spotify-redirect-uri");
const spotifyHistoryList = document.getElementById("spotify-history-list");
const spotifyHistorySummary = document.getElementById("spotify-history-summary");
const spotifyCurrentTrack = document.getElementById("spotify-now-playing");
const spotifyProfileName = document.getElementById("spotify-display-name");
const spotifyProfileAvatar = document.getElementById("spotify-avatar");
const spotifyProfileLink = document.getElementById("spotify-user-link");
const spotifySessionKey = "portfolio.spotify.session";
const spotifyVerifierKey = "portfolio.spotify.verifier";
const spotifyStateKey = "portfolio.spotify.state";
const spotifyScopes = [
  "user-read-private",
  "user-read-recently-played",
  "user-read-currently-playing",
].join(" ");
let spotifyPollTimer;
let currentTrackTimer;
let tokenRefreshRequest;
let lastHistoryUpdate = 0;
let playbackRequestInFlight = false;
let playbackPollDelay = 5_000;
let currentTrackProgress = null;
const spotifyPlaybackState = document.getElementById("spotify-playback-state");
const spotifyLyricsCopy = document.getElementById("spotify-lyrics-copy");
const spotifyLyricsLink = document.getElementById("spotify-lyrics-link");

function getSpotifyRedirectUri() {
  if (window.location.protocol === "file:") return "";
  return `${window.location.origin}${window.location.pathname}`;
}

function setSpotifyStatus(message, state = "") {
  spotifyStatus.textContent = message;
  if (state) spotifyStatus.dataset.state = state;
  else delete spotifyStatus.dataset.state;
}

function readSpotifySession() {
  const saved = sessionStorage.getItem(spotifySessionKey);
  return saved ? JSON.parse(saved) : null;
}

function saveSpotifySession(session) {
  sessionStorage.setItem(spotifySessionKey, JSON.stringify(session));
}

function clearSpotifySession() {
  sessionStorage.removeItem(spotifySessionKey);
  sessionStorage.removeItem(spotifyVerifierKey);
  sessionStorage.removeItem(spotifyStateKey);
  window.clearTimeout(spotifyPollTimer);
  spotifyRefreshButton.disabled = true;
  spotifyDisconnectButton.hidden = true;
  spotifyConnectButton.hidden = false;
}

function randomUrlSafeString(byteLength) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  let binary = "";
  bytes.forEach((value) => { binary += String.fromCharCode(value); });
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function createCodeChallenge(verifier) {
  const bytes = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  let binary = "";
  new Uint8Array(digest).forEach((value) => { binary += String.fromCharCode(value); });
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function requestSpotifyToken(parameters) {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(parameters),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error_description || result.error || `Spotify token request failed (${response.status}).`);
  }
  return result;
}

async function getSpotifyAccessToken() {
  if (tokenRefreshRequest) return tokenRefreshRequest;
  const session = readSpotifySession();
  if (!session) throw new Error("Connect your Spotify account to continue.");

  if (session.expires_at > Date.now() + 60_000) return session.access_token;
  if (!session.refresh_token) {
    clearSpotifySession();
    throw new Error("Your Spotify session expired. Connect again to continue.");
  }

  tokenRefreshRequest = (async () => {
    const refreshed = await requestSpotifyToken({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: session.refresh_token,
    });
    const updatedSession = {
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token || session.refresh_token,
      expires_at: Date.now() + refreshed.expires_in * 1000,
    };
    saveSpotifySession(updatedSession);
    return updatedSession.access_token;
  })();

  try {
    return await tokenRefreshRequest;
  } catch (error) {
    clearSpotifySession();
    throw new Error(`Could not refresh Spotify authorization. Connect again. ${error.message}`);
  } finally {
    tokenRefreshRequest = null;
  }
}

async function spotifyApi(path) {
  const accessToken = await getSpotifyAccessToken();
  const url = new URL(path.startsWith("https://") ? path : `/v1${path}`, "https://api.spotify.com");
  if (url.origin !== "https://api.spotify.com" || !url.pathname.startsWith("/v1/")) {
    throw new Error("Spotify returned an unexpected API page URL.");
  }
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status === 204) return null;
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    if (response.status === 401) clearSpotifySession();
    if (response.status === 429) {
      const error = new Error("Spotify rate limit reached. Playback refresh will resume automatically.");
      const retryAfter = Number(response.headers.get("Retry-After"));
      error.retryAfterMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 30_000;
      throw error;
    }
    throw new Error(details.error?.message || `Spotify API request failed (${response.status}).`);
  }
  return response.json();
}

function formatTrackTime(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function makeTrackLink(track) {
  const link = document.createElement("a");
  link.href = track.external_urls?.spotify || "https://open.spotify.com/";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
}

function updateSpotifyProfile(profile) {
  spotifyProfileName.textContent = profile.display_name || profile.id || "Spotify listener";
  const profileUrl = profile.external_urls?.spotify;
  if (profileUrl) spotifyProfileLink.href = profileUrl;
  spotifyProfileLink.textContent = profileUrl ? "Open Spotify profile ↗" : "Spotify profile";

  const imageUrl = profile.images?.[0]?.url;
  spotifyProfileAvatar.replaceChildren();
  if (imageUrl) {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = "";
    spotifyProfileAvatar.appendChild(image);
  } else {
    spotifyProfileAvatar.textContent = "♪";
  }
}

function updateCurrentTrack(playback) {
  window.clearInterval(currentTrackTimer);
  spotifyCurrentTrack.replaceChildren();
  const track = playback?.item;
  if (!track) {
    currentTrackProgress = null;
    spotifyPlaybackState.textContent = "Tidak sedang memutar";
    spotifyPlaybackState.dataset.playing = "false";
    const placeholder = document.createElement("div");
    placeholder.className = "track-art track-art-placeholder";
    placeholder.textContent = "♫";
    const copy = document.createElement("div");
    copy.className = "track-copy";
    const title = document.createElement("strong");
    title.textContent = "Belum ada lagu";
    const detail = document.createElement("span");
    detail.textContent = "Mulai putar musik di Spotify untuk melihat lagu di sini.";
    copy.append(title, detail);
    spotifyCurrentTrack.append(placeholder, copy);
    spotifyLyricsCopy.textContent = "Lirik akan bisa dicari setelah lagu terdeteksi.";
    spotifyLyricsLink.href = "https://www.google.com/search?q=lirik+lagu";
    spotifyLyricsLink.setAttribute("aria-disabled", "true");
    return;
  }

  const isPlaying = Boolean(playback.is_playing);
  spotifyPlaybackState.textContent = isPlaying ? "Sedang diputar" : "Dijeda";
  spotifyPlaybackState.dataset.playing = String(isPlaying);
  const artistNames = track.artists.map((artist) => artist.name).join(", ");
  const lyricsQuery = `${track.name} ${artistNames} lirik`;
  spotifyLyricsCopy.textContent = `Lirik untuk “${track.name}” tidak disediakan oleh Spotify API. Cari lirik lagu ini di web.`;
  spotifyLyricsLink.href = `https://www.google.com/search?q=${encodeURIComponent(lyricsQuery)}`;
  spotifyLyricsLink.removeAttribute("aria-disabled");

  const artwork = track.album?.images?.[0]?.url;
  if (artwork) {
    const image = document.createElement("img");
    image.className = "track-art";
    image.src = artwork;
    image.alt = "";
    spotifyCurrentTrack.appendChild(image);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "track-art track-art-placeholder";
    placeholder.textContent = "♫";
    spotifyCurrentTrack.appendChild(placeholder);
  }

  const copy = document.createElement("div");
  copy.className = "track-copy";
  const title = makeTrackLink(track);
  title.className = "track-title";
  title.textContent = track.name;
  const artists = document.createElement("span");
  artists.textContent = artistNames;
  const album = document.createElement("span");
  album.className = "track-album";
  album.textContent = track.album?.name || "";
  copy.append(title, artists, album);
  spotifyCurrentTrack.appendChild(copy);

  if (track.duration_ms) {
    const progress = document.createElement("div");
    progress.className = "track-progress";
    const elapsed = document.createElement("span");
    elapsed.className = "track-elapsed";
    const bar = document.createElement("span");
    bar.className = "track-progress-bar";
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-label", "Progres lagu");
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", String(track.duration_ms));
    const fill = document.createElement("i");
    bar.appendChild(fill);
    const duration = document.createElement("span");
    duration.className = "track-duration";
    duration.textContent = formatTrackTime(track.duration_ms);
    progress.append(elapsed, bar, duration);
    copy.appendChild(progress);

    currentTrackProgress = {
      elapsed,
      fill,
      bar,
      duration: track.duration_ms,
      startedAt: Date.now(),
      startProgress: Math.min(playback.progress_ms || 0, track.duration_ms),
      isPlaying,
    };
    const renderProgress = () => {
      if (!currentTrackProgress) return;
      const progressMs = Math.min(
        currentTrackProgress.duration,
        currentTrackProgress.startProgress
          + (currentTrackProgress.isPlaying ? Date.now() - currentTrackProgress.startedAt : 0),
      );
      currentTrackProgress.elapsed.textContent = formatTrackTime(progressMs);
      currentTrackProgress.fill.style.width = `${(progressMs / currentTrackProgress.duration) * 100}%`;
      currentTrackProgress.bar.setAttribute("aria-valuenow", String(Math.round(progressMs)));
      currentTrackProgress.bar.setAttribute(
        "aria-valuetext",
        `${formatTrackTime(progressMs)} dari ${formatTrackTime(currentTrackProgress.duration)}`,
      );
    };
    renderProgress();
    if (isPlaying) currentTrackTimer = window.setInterval(renderProgress, 1000);
  } else {
    currentTrackProgress = null;
  }
}

function updateSpotifyHistory(response) {
  spotifyHistoryList.replaceChildren();
  const items = response?.items || [];
  spotifyHistorySummary.textContent = items.length
    ? `${items.length} plays · ${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))}–today`
    : "No plays found in your Spotify history for the last 7 days.";
  if (!items.length) {
    const empty = document.createElement("li");
    empty.className = "history-empty";
    empty.textContent = "No tracks found in the last 7 days.";
    spotifyHistoryList.appendChild(empty);
    return;
  }

  const groupedTracks = new Map();
  items.forEach(({ track, played_at }) => {
    const key = track.id || `${track.name}:${track.artists.map((artist) => artist.name).join(",")}`;
    const existing = groupedTracks.get(key);
    if (existing) {
      existing.playCount += 1;
      if (played_at > existing.lastPlayedAt) existing.lastPlayedAt = played_at;
    } else {
      groupedTracks.set(key, { track, playCount: 1, lastPlayedAt: played_at });
    }
  });
  spotifyHistorySummary.textContent = `${groupedTracks.size} unique songs · ${items.length} plays in the last 7 days${response.truncated ? " (showing the latest 500 plays)" : ""}`;

  [...groupedTracks.values()]
    .sort((a, b) => b.playCount - a.playCount || b.lastPlayedAt.localeCompare(a.lastPlayedAt))
    .forEach(({ track, playCount, lastPlayedAt }) => {
    const row = document.createElement("li");
    row.className = "spotify-track";
    const link = makeTrackLink(track);
    const artwork = track.album?.images?.[0]?.url;
    if (artwork) {
      const image = document.createElement("img");
      image.src = artwork;
      image.alt = "";
      link.appendChild(image);
    } else {
      const placeholder = document.createElement("span");
      placeholder.className = "track-art-placeholder";
      placeholder.textContent = "♫";
      link.appendChild(placeholder);
    }

    const copy = document.createElement("span");
    copy.className = "spotify-track-copy";
    const title = document.createElement("strong");
    title.textContent = track.name;
    const artist = document.createElement("span");
    artist.textContent = track.artists.map((entry) => entry.name).join(", ");
    copy.append(title, artist);
    link.appendChild(copy);

    const count = document.createElement("span");
    count.className = "play-count";
    count.setAttribute("aria-label", `${playCount} ${playCount === 1 ? "play" : "plays"} in the last 7 days`);
    count.title = `Last played ${new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(lastPlayedAt))}`;
    const countValue = document.createElement("strong");
    countValue.textContent = `${playCount}×`;
    const countLabel = document.createElement("span");
    countLabel.textContent = playCount === 1 ? "play" : "plays";
    count.append(countValue, countLabel);
    row.append(link, count);
    spotifyHistoryList.appendChild(row);
  });
}

async function getRecentSpotifyHistory() {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentItems = [];
  let nextPage = `/me/player/recently-played?limit=50&after=${weekAgo}`;
  let pageCount = 0;
  const maxPages = 10;

  while (nextPage && pageCount < maxPages) {
    const page = await spotifyApi(nextPage);
    pageCount += 1;
    const items = page?.items || [];
    recentItems.push(...items.filter((item) => Date.parse(item.played_at) >= weekAgo));

    const oldestPlay = items.length ? Date.parse(items[items.length - 1].played_at) : 0;
    if (!page?.next || !items.length || oldestPlay <= weekAgo) {
      nextPage = "";
      break;
    }
    nextPage = page.next;
  }

  return { items: recentItems, truncated: Boolean(nextPage) };
}

async function refreshSpotifyData(forceHistory = false) {
  if (!readSpotifySession()) return;
  spotifyRefreshButton.disabled = true;
  const shouldLoadHistory = forceHistory || Date.now() - lastHistoryUpdate > 5 * 60 * 1000;
  const requests = [spotifyApi("/me/player/currently-playing")];
  if (shouldLoadHistory) {
    requests.push(getRecentSpotifyHistory());
  }

  const results = await Promise.allSettled(requests);
  const currentResult = results[0];
  if (currentResult.status === "fulfilled") {
    updateCurrentTrack(currentResult.value);
  }
  let historyError;
  if (shouldLoadHistory) {
    const historyResult = results[1];
    if (historyResult.status === "fulfilled") {
      updateSpotifyHistory(historyResult.value);
      lastHistoryUpdate = Date.now();
    } else {
      historyError = historyResult.reason;
    }
  }

  spotifyRefreshButton.disabled = false;
  const currentError = currentResult.status === "rejected" ? currentResult.reason : null;
  const error = currentError || historyError;
  if (error) {
    setSpotifyStatus(error.message, "error");
    if (error.retryAfterMs) playbackPollDelay = Math.max(5_000, error.retryAfterMs);
    else if (currentError) playbackPollDelay = Math.min(Math.max(playbackPollDelay * 2, 10_000), 60_000);
  } else if (forceHistory || shouldLoadHistory) {
    playbackPollDelay = 5_000;
    setSpotifyStatus(
      `Spotify connected · playback checks every few seconds · history updated ${new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date())}.`,
      "success",
    );
  }
}

async function refreshCurrentPlayback() {
  if (playbackRequestInFlight || document.hidden || !readSpotifySession()) return;
  playbackRequestInFlight = true;
  try {
    const playback = await spotifyApi("/me/player/currently-playing");
    updateCurrentTrack(playback);
    if (playbackPollDelay > 5_000) playbackPollDelay = 5_000;
  } catch (error) {
    if (error.retryAfterMs) {
      playbackPollDelay = Math.max(5_000, error.retryAfterMs);
    } else {
      playbackPollDelay = Math.min(Math.max(playbackPollDelay * 2, 10_000), 60_000);
    }
    setSpotifyStatus(error.message, "error");
  } finally {
    playbackRequestInFlight = false;
  }
}

function schedulePlaybackRefresh() {
  window.clearTimeout(spotifyPollTimer);
  if (document.hidden || !readSpotifySession()) return;
  spotifyPollTimer = window.setTimeout(async () => {
    await refreshCurrentPlayback();
    schedulePlaybackRefresh();
  }, playbackPollDelay);
}

async function loadSpotifyAccount() {
  const results = await Promise.allSettled([
    spotifyApi("/me"),
    refreshSpotifyData(true),
  ]);
  if (results[0].status === "fulfilled") {
    updateSpotifyProfile(results[0].value);
  } else {
    setSpotifyStatus(results[0].reason.message, "error");
    return;
  }
  if (results[1].status === "rejected") {
    setSpotifyStatus(results[1].reason.message, "error");
    return;
  }

  spotifyConnectButton.hidden = true;
  spotifyDisconnectButton.hidden = false;
  spotifyRefreshButton.disabled = false;
  schedulePlaybackRefresh();
}

function cleanSpotifyCallbackUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("error");
  window.history.replaceState({}, document.title, url);
}

async function handleSpotifyCallback() {
  const parameters = new URLSearchParams(window.location.search);
  const code = parameters.get("code");
  const authorizationError = parameters.get("error");
  if (!code && !authorizationError) return false;

  if (authorizationError) {
    cleanSpotifyCallbackUrl();
    setSpotifyStatus("Spotify authorization was not completed. You can connect again when ready.", "error");
    return true;
  }

  const expectedState = sessionStorage.getItem(spotifyStateKey);
  const returnedState = parameters.get("state");
  const verifier = sessionStorage.getItem(spotifyVerifierKey);
  cleanSpotifyCallbackUrl();
  if (!expectedState || returnedState !== expectedState || !verifier) {
    clearSpotifySession();
    setSpotifyStatus("Spotify sign-in could not be verified. Please connect again.", "error");
    return true;
  }

  try {
    const token = await requestSpotifyToken({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: getSpotifyRedirectUri(),
      code_verifier: verifier,
    });
    saveSpotifySession({
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: Date.now() + token.expires_in * 1000,
    });
    sessionStorage.removeItem(spotifyVerifierKey);
    sessionStorage.removeItem(spotifyStateKey);
    setSpotifyStatus("Connected to Spotify. Loading your listening activity…", "success");
    await loadSpotifyAccount();
  } catch (error) {
    setSpotifyStatus(`Spotify sign-in failed: ${error.message}`, "error");
  }
  return true;
}

spotifyRedirectText.textContent = getSpotifyRedirectUri() || "Run this page with VS Code Live Server to get a valid callback URL.";

spotifyConnectButton.addEventListener("click", async () => {
  if (!getSpotifyRedirectUri() || !window.isSecureContext || !crypto.subtle) {
    setSpotifyStatus("Open this page through VS Code Live Server or HTTPS, not as a file, before connecting.", "error");
    return;
  }

  try {
    const verifier = randomUrlSafeString(64);
    const state = randomUrlSafeString(24);
    sessionStorage.setItem(spotifyVerifierKey, verifier);
    sessionStorage.setItem(spotifyStateKey, state);
    const challenge = await createCodeChallenge(verifier);
    const parameters = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: "code",
      redirect_uri: getSpotifyRedirectUri(),
      code_challenge_method: "S256",
      code_challenge: challenge,
      state,
      scope: spotifyScopes,
    });
    window.location.assign(`https://accounts.spotify.com/authorize?${parameters.toString()}`);
  } catch (error) {
    setSpotifyStatus(`Could not start Spotify sign-in: ${error.message}`, "error");
  }
});

spotifyRefreshButton.addEventListener("click", () => {
  window.clearTimeout(spotifyPollTimer);
  refreshSpotifyData(true)
    .then(schedulePlaybackRefresh)
    .catch((error) => {
      setSpotifyStatus(error.message, "error");
      schedulePlaybackRefresh();
    });
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    window.clearTimeout(spotifyPollTimer);
  } else if (readSpotifySession()) {
    window.clearTimeout(spotifyPollTimer);
    refreshSpotifyData().then(schedulePlaybackRefresh).catch((error) => {
      setSpotifyStatus(error.message, "error");
      schedulePlaybackRefresh();
    });
  }
});

spotifyDisconnectButton.addEventListener("click", () => {
  clearSpotifySession();
  spotifyProfileName.textContent = "Connect to load your profile";
  spotifyProfileAvatar.textContent = "♪";
  spotifyCurrentTrack.replaceChildren();
  spotifyHistoryList.innerHTML = '<li class="history-empty">Your recent tracks will show up here.</li>';
  spotifyHistorySummary.textContent = "Repeated plays are grouped together and sorted by play count.";
  updateCurrentTrack(null);
  lastHistoryUpdate = 0;
  window.clearTimeout(spotifyPollTimer);
  setSpotifyStatus("Disconnected. Connect Spotify whenever you want to share your listening activity.");
});

handleSpotifyCallback().then((isCallback) => {
  if (isCallback) return;
  try {
    if (readSpotifySession()) loadSpotifyAccount();
  } catch (error) {
    setSpotifyStatus(`Could not restore Spotify session: ${error.message}`, "error");
  }
}).catch((error) => setSpotifyStatus(`Spotify sign-in failed: ${error.message}`, "error"));
}
