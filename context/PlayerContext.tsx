import {
  Audio,
  AVPlaybackStatus,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from "expo-av";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { Track } from "@/services/musicApi";

export interface EQBand {
  label: string;
  shortLabel: string;
  value: number;  // -12 to +12 (display only)
}

const DEFAULT_EQ: EQBand[] = [
  { label: "Bass",     shortLabel: "Bass",   value: 0 },
  { label: "Low Mid",  shortLabel: "L.Mid",  value: 0 },
  { label: "Mid",      shortLabel: "Mid",    value: 0 },
  { label: "High Mid", shortLabel: "H.Mid",  value: 0 },
  { label: "Treble",   shortLabel: "Treble", value: 0 },
];

export interface PlayerContextType {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  position: number;
  duration: number;
  isShuffle: boolean;
  repeatMode: "none" | "all" | "one";
  isLiked: boolean;
  isLoading: boolean;
  recentTracks: Track[];
  eqBands: EQBand[];
  sleepTimerMinutes: number | null;
  sleepTimerRemaining: number | null;
  play: (track: Track, queue?: Track[]) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seekTo: (millis: number) => Promise<void>;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleLike: () => void;
  likedIds: Set<string>;
  addToQueue: (track: Track) => void;
  setEqBand: (index: number, value: number) => void;
  resetEq: () => void;
  setSleepTimer: (minutes: number | null) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);
const NOTIF_CATEGORY = "nexus_playback";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.LOW,
  }),
});

async function setupAudioMode() {
  if (Platform.OS === "web") return;
  try {
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
      allowsRecordingIOS: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      playThroughEarpieceAndroid: false,
    });
  } catch {}
}

function eqVolume(bands: EQBand[]): number {
  const avg = bands.reduce((s, b) => s + b.value, 0) / bands.length;
  return Math.max(0.2, Math.min(2.0, 1 + avg / 24));
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const loadTokenRef = useRef(0);
  const appStateRef = useRef(AppState.currentState);
  const notifSubRef = useRef<Notifications.EventSubscription | null>(null);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"none" | "all" | "one">("none");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [eqBands, setEqBands] = useState<EQBand[]>(DEFAULT_EQ);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  const repeatModeRef = useRef<"none" | "all" | "one">("none");
  const isShuffleRef = useRef(false);
  const queueRef = useRef<Track[]>([]);
  const queueIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const currentTrackRef = useRef<Track | null>(null);
  const eqBandsRef = useRef<EQBand[]>(DEFAULT_EQ);
  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { isShuffleRef.current = isShuffle; }, [isShuffle]);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { queueIndexRef.current = queueIndex; }, [queueIndex]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
  useEffect(() => { eqBandsRef.current = eqBands; }, [eqBands]);
  useEffect(() => {
    setIsLiked(!!currentTrack && likedIds.has(currentTrack.id));
  }, [currentTrack, likedIds]);

  // ── Apply EQ volume whenever bands change ──
  useEffect(() => {
    const vol = eqVolume(eqBands);
    soundRef.current?.setVolumeAsync(Math.min(1, vol)).catch(() => {});
  }, [eqBands]);

  // ── Sleep timer countdown ──
  useEffect(() => {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    if (sleepTimerMinutes === null) {
      setSleepTimerRemaining(null);
      return;
    }
    const totalSecs = sleepTimerMinutes * 60;
    setSleepTimerRemaining(totalSecs);
    let remaining = totalSecs;

    sleepTimerRef.current = setInterval(() => {
      remaining -= 1;
      setSleepTimerRemaining(remaining);
      if (remaining <= 0) {
        if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
        sleepTimerRef.current = null;
        setSleepTimerMinutes(null);
        setSleepTimerRemaining(null);
        soundRef.current?.pauseAsync().then(() => {
          setIsPlaying(false);
          isPlayingRef.current = false;
        }).catch(() => {});
      }
    }, 1000);

    return () => {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    };
  }, [sleepTimerMinutes]);

  // ── Setup audio + notification category ──
  useEffect(() => {
    setupAudioMode();
    if (Platform.OS !== "web") {
      Notifications.requestPermissionsAsync().catch(() => {});
      Notifications.setNotificationCategoryAsync(NOTIF_CATEGORY, [
        { identifier: "prev",       buttonTitle: "⏮", options: { opensAppToForeground: false, isDestructive: false } },
        { identifier: "play_pause", buttonTitle: "⏸", options: { opensAppToForeground: false, isDestructive: false } },
        { identifier: "next",       buttonTitle: "⏭", options: { opensAppToForeground: false, isDestructive: false } },
      ]).catch(() => {});
    }

    const appStateSub = AppState.addEventListener("change", (next: AppStateStatus) => {
      const wasBg = appStateRef.current.match(/inactive|background/);
      if (wasBg && next === "active") setupAudioMode();
      appStateRef.current = next;
    });

    return () => {
      appStateSub.remove();
      notifSubRef.current?.remove();
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
      loadTokenRef.current = 999999;
      soundRef.current?.stopAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
      Notifications.dismissAllNotificationsAsync().catch(() => {});
    };
  }, []);

  // ── Notification response ──
  useEffect(() => {
    notifSubRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const action = response.actionIdentifier;
      if (action === "prev") {
        prevInternal();
      } else if (action === "play_pause") {
        if (isPlayingRef.current) {
          soundRef.current?.pauseAsync().then(() => {
            setIsPlaying(false);
            isPlayingRef.current = false;
            updateNotification(currentTrackRef.current, false);
          }).catch(() => {});
        } else {
          soundRef.current?.playAsync().then(() => {
            setIsPlaying(true);
            isPlayingRef.current = true;
            updateNotification(currentTrackRef.current, true);
          }).catch(() => {});
        }
      } else if (action === "next") {
        nextInternal();
      }
    });
    return () => notifSubRef.current?.remove();
  }, []);

  useEffect(() => {
    if (!currentTrack || Platform.OS === "web") {
      Notifications.dismissAllNotificationsAsync().catch(() => {});
      return;
    }
    updateNotification(currentTrack, isPlaying);
  }, [currentTrack, isPlaying]);

  const updateNotification = async (track: Track | null, playing: boolean) => {
    if (!track || Platform.OS === "web") return;
    try {
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.setNotificationCategoryAsync(NOTIF_CATEGORY, [
        { identifier: "prev",       buttonTitle: "⏮ Anterior", options: { opensAppToForeground: false, isDestructive: false } },
        { identifier: "play_pause", buttonTitle: playing ? "⏸ Pausar" : "▶ Tocar",  options: { opensAppToForeground: false, isDestructive: false } },
        { identifier: "next",       buttonTitle: "⏭ Próxima",  options: { opensAppToForeground: false, isDestructive: false } },
      ]);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: track.title,
          body: `${track.artist}${track.album ? " • " + track.album : ""}`,
          data: { trackId: track.id, type: "media" },
          categoryIdentifier: NOTIF_CATEGORY,
          sticky: true,
          autoDismiss: false,
        } as Notifications.NotificationContentInput,
        trigger: null,
      });
    } catch {}
  };

  const makeStatusCallback = (token: number) => (status: AVPlaybackStatus) => {
    if (token !== loadTokenRef.current) return;
    if (!status.isLoaded) return;

    setPosition(status.positionMillis || 0);
    if (status.durationMillis && status.durationMillis > 0) {
      setDuration(status.durationMillis);
    }
    setIsPlaying(status.isPlaying);
    isPlayingRef.current = status.isPlaying;
    if (!status.isBuffering) setIsLoading(false);

    if (status.didJustFinish) {
      const rm = repeatModeRef.current;
      const shuffle = isShuffleRef.current;
      const q = queueRef.current;
      const idx = queueIndexRef.current;

      if (rm === "one") {
        soundRef.current?.replayAsync().catch(() => {});
        return;
      }
      let nextIdx: number;
      if (shuffle && q.length > 1) {
        do { nextIdx = Math.floor(Math.random() * q.length); } while (nextIdx === idx);
      } else {
        nextIdx = idx + 1;
      }
      if (nextIdx >= q.length) {
        if (rm === "all") nextIdx = 0;
        else { setIsPlaying(false); isPlayingRef.current = false; return; }
      }
      const t = q[nextIdx];
      if (t) {
        setQueueIndex(nextIdx);
        queueIndexRef.current = nextIdx;
        loadAndPlayInternal(t);
      }
    }
  };

  const loadAndPlayInternal = async (track: Track) => {
    const myToken = ++loadTokenRef.current;

    setIsLoading(true);
    setCurrentTrack(track);
    currentTrackRef.current = track;
    setPosition(0);
    setDuration(track.duration || 180000);
    setIsPlaying(false);
    isPlayingRef.current = false;

    const prevSound = soundRef.current;
    soundRef.current = null;
    if (prevSound) {
      try { await prevSound.stopAsync(); } catch {}
      try { await prevSound.unloadAsync(); } catch {}
    }

    if (myToken !== loadTokenRef.current) return;
    if (!track.previewUrl) { setIsLoading(false); return; }

    try {
      await setupAudioMode();
      if (myToken !== loadTokenRef.current) return;

      const vol = eqVolume(eqBandsRef.current);

      const { sound } = await Audio.Sound.createAsync(
        { uri: track.previewUrl },
        {
          shouldPlay: true,
          isLooping: false,
          progressUpdateIntervalMillis: 500,
          volume: Math.min(1, vol),
          rate: 1.0,
          shouldCorrectPitch: true,
        },
        makeStatusCallback(myToken)
      );

      if (myToken !== loadTokenRef.current) {
        try { await sound.stopAsync(); await sound.unloadAsync(); } catch {}
        return;
      }

      soundRef.current = sound;
      setIsPlaying(true);
      isPlayingRef.current = true;

      setRecentTracks((prev) => {
        const filtered = prev.filter((t) => t.id !== track.id);
        return [track, ...filtered].slice(0, 50);
      });
    } catch {
      if (myToken !== loadTokenRef.current) return;
      setIsPlaying(false);
      isPlayingRef.current = false;
    } finally {
      if (myToken === loadTokenRef.current) setIsLoading(false);
    }
  };

  const prevInternal = async () => {
    const q = queueRef.current;
    const idx = queueIndexRef.current;
    const pos = position;
    if (pos > 3000) {
      try { await soundRef.current?.setPositionAsync(0); setPosition(0); } catch {}
      return;
    }
    const prevIdx = idx === 0 ? q.length - 1 : idx - 1;
    setQueueIndex(prevIdx);
    queueIndexRef.current = prevIdx;
    const t = q[prevIdx];
    if (t) await loadAndPlayInternal(t);
  };

  const nextInternal = async () => {
    const q = queueRef.current;
    const idx = queueIndexRef.current;
    if (!q.length) return;
    let nextIdx: number;
    if (isShuffleRef.current && q.length > 1) {
      do { nextIdx = Math.floor(Math.random() * q.length); } while (nextIdx === idx);
    } else {
      nextIdx = (idx + 1) % q.length;
    }
    setQueueIndex(nextIdx);
    queueIndexRef.current = nextIdx;
    const t = q[nextIdx];
    if (t) await loadAndPlayInternal(t);
  };

  const play = useCallback(async (track: Track, newQueue?: Track[]) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const q = newQueue || [track];
    const idx = Math.max(0, q.findIndex((t) => t.id === track.id));
    setQueue(q); queueRef.current = q;
    setQueueIndex(idx); queueIndexRef.current = idx;
    await loadAndPlayInternal(track);
  }, []);

  const pause = useCallback(async () => {
    try {
      await soundRef.current?.pauseAsync();
      setIsPlaying(false);
      isPlayingRef.current = false;
    } catch {}
  }, []);

  const resume = useCallback(async () => {
    try {
      await setupAudioMode();
      if (soundRef.current) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
        isPlayingRef.current = true;
      }
    } catch {}
  }, []);

  const next = useCallback(async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await nextInternal();
  }, []);

  const previous = useCallback(async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await prevInternal();
  }, [position]);

  const seekTo = useCallback(async (millis: number) => {
    try {
      await soundRef.current?.setPositionAsync(millis);
      setPosition(millis);
    } catch {}
  }, []);

  const toggleShuffle = useCallback(() => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    setIsShuffle((p) => { isShuffleRef.current = !p; return !p; });
  }, []);

  const toggleRepeat = useCallback(() => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    setRepeatMode((p) => {
      const n = p === "none" ? "all" : p === "all" ? "one" : "none";
      repeatModeRef.current = n;
      return n;
    });
  }, []);

  const toggleLike = useCallback(() => {
    if (!currentTrack) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setLikedIds((prev) => {
      const n = new Set(prev);
      n.has(currentTrack.id) ? n.delete(currentTrack.id) : n.add(currentTrack.id);
      return n;
    });
  }, [currentTrack]);

  const addToQueue = useCallback((track: Track) => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    setQueue((prev) => { const n = [...prev, track]; queueRef.current = n; return n; });
  }, []);

  const setEqBand = useCallback((index: number, value: number) => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    setEqBands((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], value: Math.max(-12, Math.min(12, Math.round(value))) };
      return next;
    });
  }, []);

  const resetEq = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setEqBands(DEFAULT_EQ.map(b => ({ ...b, value: 0 })));
  }, []);

  const setSleepTimer = useCallback((minutes: number | null) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSleepTimerMinutes(minutes);
  }, []);

  return (
    <PlayerContext.Provider value={{
      currentTrack, queue, isPlaying, position, duration, isShuffle, repeatMode,
      isLiked, isLoading, recentTracks, eqBands, sleepTimerMinutes, sleepTimerRemaining,
      play, pause, resume, next, previous, seekTo,
      toggleShuffle, toggleRepeat, toggleLike, likedIds, addToQueue,
      setEqBand, resetEq, setSleepTimer,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be inside PlayerProvider");
  return ctx;
}
