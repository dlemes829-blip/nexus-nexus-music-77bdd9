import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Share, Platform } from "react-native";
import { Track } from "@/services/musicApi";

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
  createdAt: number;
  updatedAt: number;
  coverUri?: string;
}

interface PlaylistContextType {
  playlists: Playlist[];
  createPlaylist: (name: string, description?: string) => Promise<Playlist>;
  deletePlaylist: (id: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, track: Track) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  renamePlaylist: (playlistId: string, name: string) => Promise<void>;
  sharePlaylist: (playlist: Playlist) => Promise<void>;
  getPlaylist: (id: string) => Playlist | undefined;
}

const PlaylistContext = createContext<PlaylistContextType | null>(null);
const STORAGE_KEY = "@nexus_playlists_v1";

function genId(): string {
  return `pl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function PlaylistProvider({ children }: { children: React.ReactNode }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setPlaylists(JSON.parse(raw));
      })
      .catch(() => {});
  }, []);

  const persist = useCallback(async (updated: Playlist[]) => {
    setPlaylists(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  }, []);

  const createPlaylist = useCallback(async (name: string, description?: string): Promise<Playlist> => {
    const now = Date.now();
    const pl: Playlist = { id: genId(), name: name.trim(), description, tracks: [], createdAt: now, updatedAt: now };
    const updated = [pl, ...playlists];
    await persist(updated);
    return pl;
  }, [playlists, persist]);

  const deletePlaylist = useCallback(async (id: string) => {
    await persist(playlists.filter(p => p.id !== id));
  }, [playlists, persist]);

  const addTrackToPlaylist = useCallback(async (playlistId: string, track: Track) => {
    const updated = playlists.map(p => {
      if (p.id !== playlistId) return p;
      if (p.tracks.find(t => t.id === track.id)) return p;
      return { ...p, tracks: [...p.tracks, track], updatedAt: Date.now() };
    });
    await persist(updated);
  }, [playlists, persist]);

  const removeTrackFromPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    const updated = playlists.map(p => {
      if (p.id !== playlistId) return p;
      return { ...p, tracks: p.tracks.filter(t => t.id !== trackId), updatedAt: Date.now() };
    });
    await persist(updated);
  }, [playlists, persist]);

  const renamePlaylist = useCallback(async (playlistId: string, name: string) => {
    const updated = playlists.map(p =>
      p.id === playlistId ? { ...p, name: name.trim(), updatedAt: Date.now() } : p
    );
    await persist(updated);
  }, [playlists, persist]);

  const sharePlaylist = useCallback(async (playlist: Playlist) => {
    const trackList = playlist.tracks
      .slice(0, 15)
      .map((t, i) => `${i + 1}. ${t.title} — ${t.artist}`)
      .join("\n");

    const moreCount = playlist.tracks.length > 15 ? `\n...e mais ${playlist.tracks.length - 15} músicas` : "";

    const message = [
      `🎵 Playlist: ${playlist.name}`,
      playlist.description ? `"${playlist.description}"` : null,
      `\n${playlist.tracks.length} música${playlist.tracks.length !== 1 ? "s" : ""}:\n`,
      trackList,
      moreCount,
      "\n─────────────────────",
      "🌐 Criado no Nexus Music",
      "Hospedado na Plataforma Nexus by Nexus AI",
      "nexusai.app",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await Share.share(
        Platform.OS === "ios"
          ? { message, title: `Playlist: ${playlist.name}` }
          : { message, title: `Playlist: ${playlist.name}` }
      );
    } catch {}
  }, []);

  const getPlaylist = useCallback((id: string) => playlists.find(p => p.id === id), [playlists]);

  return (
    <PlaylistContext.Provider value={{
      playlists, createPlaylist, deletePlaylist,
      addTrackToPlaylist, removeTrackFromPlaylist,
      renamePlaylist, sharePlaylist, getPlaylist,
    }}>
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylists() {
  const ctx = useContext(PlaylistContext);
  if (!ctx) throw new Error("usePlaylists must be inside PlaylistProvider");
  return ctx;
}
