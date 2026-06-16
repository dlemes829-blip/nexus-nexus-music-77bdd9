// musicApi.ts — Nexus Music
// Primary: Deezer API (real artists, 30s previews, free & no auth)
// Fallback: Archive.org CC catalog (static, instant)

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  previewUrl: string;
  duration: number;
  genre: string;
  tags: string[];
  lyrics?: string | null;
  source: string;
}

function withTimeout(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

// ─── Deezer API helpers ───────────────────────────────────────────────────────

const DEEZER = "https://api.deezer.com";

interface DeezerTrack {
  id: number;
  title: string;
  duration: number;
  preview: string;
  artist: { id: number; name: string };
  album: { id: number; title: string; cover_medium: string; cover_big?: string };
}

interface DeezerResponse {
  data?: DeezerTrack[];
  tracks?: { data?: DeezerTrack[] };
}

function deezerToTrack(d: DeezerTrack, genre = "Music", tags: string[] = []): Track {
  return {
    id: `dz:${d.id}`,
    title: d.title,
    artist: d.artist.name,
    album: d.album.title,
    artworkUrl: d.album.cover_big || d.album.cover_medium || "",
    previewUrl: d.preview,
    duration: d.duration * 1000,
    genre,
    tags,
    lyrics: null,
    source: "deezer",
  };
}

async function deezerGet(path: string): Promise<DeezerTrack[]> {
  try {
    const res = await fetch(`${DEEZER}${path}`, { signal: withTimeout(9000) });
    if (!res.ok) return [];
    const data = await res.json() as DeezerResponse;
    return data?.data || data?.tracks?.data || [];
  } catch {
    return [];
  }
}

// ─── Archive.org fallback catalog ─────────────────────────────────────────────

const IA = "https://archive.org";

interface CatalogEntry {
  id: string;
  file: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  tags: string[];
  dur: number;
}

const FALLBACK: CatalogEntry[] = [
  { id:"starfrosch-mostwanted", file:"Starfrosch-FutureTrap.mp3", title:"Future Trap", artist:"Starfrosch", album:"Most Wanted", genre:"Hip-Hop", tags:["trap","hip-hop","electronic","viral"], dur:256 },
  { id:"starfrosch-mostwanted", file:"Starfrosch-DeepRunningfeat.Elske.mp3", title:"Deep Running (feat. Elske)", artist:"Starfrosch", album:"Most Wanted", genre:"Hip-Hop", tags:["hip-hop","r&b","chill"], dur:224 },
  { id:"phoke035", file:"phoke35-_-01-_-kryptic_universe-_-jazzyllusions.mp3", title:"Jazzyllusions", artist:"Kryptic Universe", album:"Phoke 035", genre:"Lo-Fi", tags:["lofi","jazz","chill","study"], dur:321 },
  { id:"phoke035", file:"phoke35-_-04-_-kryptic_universe-_-too_fast_into_the_past.mp3", title:"Too Fast Into the Past", artist:"Kryptic Universe", album:"Phoke 035", genre:"Lo-Fi", tags:["lofi","jazz","chill"], dur:297 },
  { id:"foot149", file:"foot149_04-duis-dancing_elephant.mp3", title:"Dancing Elephant", artist:"Duis", album:"Foot 149", genre:"Electronic", tags:["electronic","dance","upbeat","party"], dur:213 },
  { id:"DWK031", file:"Aydio_-_01_-_Track.mp3", title:"Midnight Drive", artist:"Aydio", album:"DWK031", genre:"Chill", tags:["trip-hop","downtempo","chill","late night"], dur:378 },
  { id:"MIXG032", file:"01_Zipp_-_Pour_Quoi_Royale.mp3", title:"Pour Quoi Royale", artist:"Zipp", album:"MIXG032", genre:"Jazz", tags:["jazz","lounge","retro","swing"], dur:201 },
  { id:"puls02", file:"01-Sasha_Ponkratov_-_Morning.mp3", title:"Morning", artist:"Sasha Ponkratov", album:"Puls 02", genre:"Jazz", tags:["jazz","piano","calm","peaceful"], dur:256 },
  { id:"freemusiccharts.songs2010", file:"2010-01-Abandoned-in-August-Elusive-Bonds.mp3", title:"Elusive Bonds", artist:"Abandoned in August", album:"Free Music Charts 2010", genre:"Indie", tags:["indie","pop","rock","melodic"], dur:266 },
  { id:"freemusiccharts.songs2011", file:"2011-01-RU.ARE-Halo.mp3", title:"Halo", artist:"RU.ARE", album:"Free Music Charts 2011", genre:"Indie", tags:["indie","electronic","pop","ethereal"], dur:293 },
  { id:"MIXG031", file:"02_Intoxicated_Piano_-_In_My_Dreams.mp3", title:"In My Dreams", artist:"Intoxicated Piano", album:"MIXG031", genre:"Electronic", tags:["piano","electronic","dreamy","romantic"], dur:223 },
  { id:"mtk140", file:"mtk140-ST-03-i-met-a-girl-with-butterfly-wings.mp3", title:"Girl with Butterfly Wings", artist:"ST", album:"MTK140", genre:"Electronic", tags:["electronic","dreamy","ambient","romantic"], dur:227 },
];

function fallbackToTrack(e: CatalogEntry): Track {
  return {
    id: `ia:${e.id}:${e.file}`,
    title: e.title,
    artist: e.artist,
    album: e.album,
    artworkUrl: `${IA}/services/img/${e.id}`,
    previewUrl: `${IA}/download/${e.id}/${encodeURIComponent(e.file)}`,
    duration: e.dur * 1000,
    genre: e.genre,
    tags: e.tags,
    lyrics: null,
    source: "archive",
  };
}

let _fallbackTracks: Track[] | null = null;
function getFallbackTracks(): Track[] {
  if (!_fallbackTracks) _fallbackTracks = FALLBACK.map(fallbackToTrack);
  return _fallbackTracks;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Deezer genre IDs ─────────────────────────────────────────────────────────
// 0=All, 116=Rap, 113=Dance, 106=Electro, 466=R&B, 132=Pop, 152=Rock, 2=Pop
// 144=Jazz, 501=Funk/Gospel/R&B, 165=Alternative, 85=Classical

// ─── Cache ────────────────────────────────────────────────────────────────────
const cache = new Map<string, { data: Track[]; ts: number }>();
const TTL = 5 * 60 * 1000;

function fromCache(key: string): Track[] | null {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > TTL) { cache.delete(key); return null; }
  return e.data;
}
function toCache(key: string, data: Track[]) { cache.set(key, { data, ts: Date.now() }); }

// ─── Public API ───────────────────────────────────────────────────────────────

export async function preWarmCache(): Promise<void> {
  getFallbackTracks();
}

export async function fetchTrending(limit = 20): Promise<Track[]> {
  const key = "trending";
  const cached = fromCache(key);
  if (cached) return cached.slice(0, limit);

  const dz = await deezerGet("/chart/0/tracks?limit=50");
  if (dz.length > 0) {
    const tracks = dz.map(t => deezerToTrack(t, "Pop", ["trending","viral","popular"]));
    toCache(key, tracks);
    return tracks.slice(0, limit);
  }
  const fb = shuffle(getFallbackTracks());
  toCache(key, fb);
  return fb.slice(0, limit);
}

export async function fetchForYou(limit = 20): Promise<Track[]> {
  const genres = [116, 113, 132, 466];
  const gid = genres[Math.floor(Math.random() * genres.length)];
  const key = `foryou_${gid}`;
  const cached = fromCache(key);
  if (cached) return shuffle(cached).slice(0, limit);

  const dz = await deezerGet(`/genre/${gid}/artists`);
  if ((dz as any)?.data?.length > 0) {
    const artists = (dz as any).data as Array<{ id: number }>;
    const picks = artists.slice(0, 5);
    const results = await Promise.all(
      picks.map(a => deezerGet(`/artist/${a.id}/top?limit=5`))
    );
    const tracks = results.flat().map(t => deezerToTrack(t));
    if (tracks.length > 0) { toCache(key, tracks); return shuffle(tracks).slice(0, limit); }
  }

  const dz2 = await deezerGet("/chart/0/tracks?limit=50");
  if (dz2.length > 0) {
    const tracks = shuffle(dz2.map(t => deezerToTrack(t)));
    toCache(key, tracks);
    return tracks.slice(0, limit);
  }
  return shuffle(getFallbackTracks()).slice(0, limit);
}

export async function fetchNewReleases(limit = 20): Promise<Track[]> {
  return fetchByDeezerSearch("new indie alternative", limit, "Indie");
}

export async function fetchViralTikTok(limit = 20): Promise<Track[]> {
  const key = "viral";
  const cached = fromCache(key);
  if (cached) return cached.slice(0, limit);

  const dz = await deezerGet("/chart/0/tracks?limit=50");
  if (dz.length > 0) {
    const tracks = dz.map(t => deezerToTrack(t, "Pop", ["viral","tiktok","trending"]));
    toCache(key, tracks);
    return tracks.slice(0, limit);
  }
  return shuffle(getFallbackTracks()).slice(0, limit);
}

async function fetchByDeezerSearch(q: string, limit: number, genre: string): Promise<Track[]> {
  const key = `genre:${q}`;
  const cached = fromCache(key);
  if (cached) return shuffle(cached).slice(0, limit);

  const dz = await deezerGet(`/search?q=${encodeURIComponent(q)}&limit=50&order=RANKING`);
  if (dz.length > 0) {
    const tracks = dz.map(t => deezerToTrack(t, genre, [q.toLowerCase()]));
    toCache(key, tracks);
    return shuffle(tracks).slice(0, limit);
  }
  const fb = getFallbackTracks().filter(t => t.genre.toLowerCase() === genre.toLowerCase());
  return shuffle(fb.length > 0 ? fb : getFallbackTracks()).slice(0, limit);
}

export async function fetchElectronic(limit = 20): Promise<Track[]> {
  return fetchByDeezerSearch("electronic dance edm", limit, "Electronic");
}

export async function fetchHipHop(limit = 20): Promise<Track[]> {
  return fetchByDeezerSearch("hip hop rap", limit, "Hip-Hop");
}

export async function fetchLoFi(limit = 20): Promise<Track[]> {
  return fetchByDeezerSearch("lofi chill beats", limit, "Lo-Fi");
}

export async function fetchJazz(limit = 20): Promise<Track[]> {
  return fetchByDeezerSearch("jazz", limit, "Jazz");
}

export async function fetchChill(limit = 20): Promise<Track[]> {
  return fetchByDeezerSearch("chill relaxing", limit, "Chill");
}

export async function fetchRock(limit = 20): Promise<Track[]> {
  return fetchByDeezerSearch("rock alternative", limit, "Rock");
}

export async function fetchAcoustic(limit = 20): Promise<Track[]> {
  return fetchByDeezerSearch("acoustic folk guitar", limit, "Acoustic");
}

export async function fetchAmbient(limit = 20): Promise<Track[]> {
  return fetchByDeezerSearch("ambient atmospheric", limit, "Ambient");
}

export async function fetchBrazilian(limit = 20): Promise<Track[]> {
  return fetchByDeezerSearch("funk sertanejo pagode brasileiro mpb", limit, "Brasileiro");
}

export async function fetchClassical(limit = 20): Promise<Track[]> {
  return fetchByDeezerSearch("classical piano orchestra", limit, "Clássico");
}

export async function fetchPop(limit = 20): Promise<Track[]> {
  return fetchByDeezerSearch("pop hits", limit, "Pop");
}

export async function fetchRnb(limit = 20): Promise<Track[]> {
  return fetchByDeezerSearch("r&b soul", limit, "R&B");
}

export async function fetchLatin(limit = 20): Promise<Track[]> {
  return fetchByDeezerSearch("latin reggaeton", limit, "Latina");
}

// ─── Search ────────────────────────────────────────────────────────────────────

const searchCache = new Map<string, { tracks: Track[]; ts: number }>();
const SEARCH_TTL = 10 * 60 * 1000;

export async function searchTracks(query: string, limit = 40): Promise<Track[]> {
  if (!query.trim()) return fetchTrending(limit);
  const q = query.trim().toLowerCase();

  const cached = searchCache.get(q);
  if (cached && Date.now() - cached.ts < SEARCH_TTL) return cached.tracks.slice(0, limit);

  // 1) Deezer search — real artists and tracks
  try {
    const dzArtist = await deezerGet(`/search?q=artist:"${encodeURIComponent(query)}"&limit=25&order=RANKING`);
    const dzGeneral = await deezerGet(`/search?q=${encodeURIComponent(query)}&limit=25&order=RANKING`);

    const seen = new Set<string>();
    const combined: Track[] = [];
    for (const d of [...dzArtist, ...dzGeneral]) {
      const t = deezerToTrack(d);
      if (!seen.has(t.id)) { seen.add(t.id); combined.push(t); }
    }

    if (combined.length > 0) {
      searchCache.set(q, { tracks: combined, ts: Date.now() });
      return combined.slice(0, limit);
    }
  } catch {}

  // 2) Archive.org fallback search
  try {
    const all = getFallbackTracks();
    const local = all.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.genre.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
    );
    if (local.length > 0) {
      searchCache.set(q, { tracks: local, ts: Date.now() });
      return local.slice(0, limit);
    }

    const iaUrl = `${IA}/advancedsearch.php?q=${encodeURIComponent(q + " AND mediatype:audio")}&fl=identifier,title,creator&sort=downloads+desc&output=json&rows=5`;
    const res = await fetch(iaUrl, { signal: withTimeout(8000) });
    if (res.ok) {
      const data = await res.json() as { response?: { docs?: Array<{ identifier: string; title?: string; creator?: string }> } };
      const docs = data.response?.docs || [];
      const apiTracks: Track[] = await Promise.all(
        docs.map(async doc => {
          const fr = await fetch(`${IA}/metadata/${doc.identifier}/files`, { signal: withTimeout(6000) });
          if (!fr.ok) return [] as Track[];
          const fd = await fr.json() as { result?: Array<{ name: string; length?: string }> };
          const mp3s = (fd.result || []).filter(f =>
            f.name.endsWith(".mp3") && parseFloat(f.length || "0") > 60 && parseFloat(f.length || "0") < 600
          );
          return mp3s.slice(0, 2).map(f => ({
            id: `ia:${doc.identifier}:${f.name}`,
            title: f.name.replace(/\.mp3$/i, "").replace(/[-_]/g, " "),
            artist: doc.creator || "Unknown",
            album: doc.title || "",
            artworkUrl: `${IA}/services/img/${doc.identifier}`,
            previewUrl: `${IA}/download/${doc.identifier}/${encodeURIComponent(f.name)}`,
            duration: Math.round(parseFloat(f.length || "180") * 1000),
            genre: "Music",
            tags: [],
            lyrics: null,
            source: "archive",
          } as Track));
        })
      ).then(r => r.flat());

      const result = [...local, ...apiTracks.filter(t => !local.find(l => l.id === t.id))];
      searchCache.set(q, { tracks: result, ts: Date.now() });
      return result.slice(0, limit);
    }
  } catch {}

  const trending = await fetchTrending(limit);
  searchCache.set(q, { tracks: trending, ts: Date.now() });
  return trending;
}
