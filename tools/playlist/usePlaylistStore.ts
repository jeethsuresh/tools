import { create } from "zustand";

export interface PlaylistItem {
  id: string;
  videoId: string;
  title: string;
  url: string;
}

interface PlaylistState {
  // Playlist data
  playlist: PlaylistItem[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  
  // UI state
  isPlaylistExpanded: boolean;
  youtubeUrl: string;
  isLoading: boolean;
  error: string | null;
  draggedIndex: number | null;
  hoveredIndex: number | null;
  
  // Playback settings
  repeatMode: "none" | "all" | "one";
  isShuffle: boolean;
  playedSongs: Set<number>;
  shuffleOrder: number[];
  previousIndex: number;
  wasRewound: boolean;
  
  // Actions
  setPlaylist: (playlist: PlaylistItem[]) => void;
  addToPlaylist: (item: PlaylistItem) => void;
  removeFromPlaylist: (index: number) => void;
  reorderPlaylist: (fromIndex: number, toIndex: number) => void;
  setCurrentIndex: (index: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaylistExpanded: (expanded: boolean) => void;
  setYoutubeUrl: (url: string) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDraggedIndex: (index: number | null) => void;
  setHoveredIndex: (index: number | null) => void;
  setRepeatMode: (mode: "none" | "all" | "one") => void;
  setIsShuffle: (shuffle: boolean) => void;
  setPlayedSongs: (songs: Set<number>) => void;
  addPlayedSong: (index: number) => void;
  removePlayedSong: (index: number) => void;
  setShuffleOrder: (order: number[]) => void;
  setPreviousIndex: (index: number) => void;
  setWasRewound: (rewound: boolean) => void;
  
  // Playback control functions
  handleNext: () => void;
  handlePrevious: () => void;
  handleDoubleClickSong: (clickedIndex: number) => void;
}

export const usePlaylistStore = create<PlaylistState>((set) => ({
  // Initial state
  playlist: [],
  currentIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  isPlaylistExpanded: false,
  youtubeUrl: "",
  isLoading: false,
  error: null,
  draggedIndex: null,
  hoveredIndex: null,
  repeatMode: "none",
  isShuffle: false,
  playedSongs: new Set<number>(),
  shuffleOrder: [],
  previousIndex: -1,
  wasRewound: false,

  // Actions
  setPlaylist: (playlist) => set({ playlist }),
  addToPlaylist: (item) =>
    set((state) => {
      const newPlaylist = [...state.playlist, item];
      return {
        playlist: newPlaylist,
        currentIndex: state.currentIndex === -1 && newPlaylist.length === 1 ? 0 : state.currentIndex,
      };
    }),
  removeFromPlaylist: (index) =>
    set((state) => {
      const newPlaylist = state.playlist.filter((_, i) => i !== index);
      let newCurrentIndex = state.currentIndex;

      if (state.currentIndex === index) {
        if (newPlaylist.length === 0) {
          newCurrentIndex = -1;
        } else if (index < newPlaylist.length) {
          newCurrentIndex = index;
        } else {
          newCurrentIndex = newPlaylist.length - 1;
        }
      } else if (state.currentIndex > index) {
        newCurrentIndex = state.currentIndex - 1;
      }

      return {
        playlist: newPlaylist,
        currentIndex: newCurrentIndex,
      };
    }),
  reorderPlaylist: (fromIndex, toIndex) =>
    set((state) => {
      if (fromIndex === toIndex) return state;

      const newPlaylist = [...state.playlist];
      const draggedItem = newPlaylist[fromIndex];
      newPlaylist.splice(fromIndex, 1);
      newPlaylist.splice(toIndex, 0, draggedItem);

      let newCurrentIndex = state.currentIndex;
      if (state.currentIndex === fromIndex) {
        newCurrentIndex = toIndex;
      } else if (state.currentIndex === toIndex) {
        newCurrentIndex = fromIndex;
      } else if (fromIndex < state.currentIndex && toIndex >= state.currentIndex) {
        newCurrentIndex = state.currentIndex - 1;
      } else if (fromIndex > state.currentIndex && toIndex <= state.currentIndex) {
        newCurrentIndex = state.currentIndex + 1;
      }

      return {
        playlist: newPlaylist,
        currentIndex: newCurrentIndex,
      };
    }),
  setCurrentIndex: (index) => set({ currentIndex: index }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setIsPlaylistExpanded: (expanded) => set({ isPlaylistExpanded: expanded }),
  setYoutubeUrl: (url) => set({ youtubeUrl: url }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setDraggedIndex: (index) => set({ draggedIndex: index }),
  setHoveredIndex: (index) => set({ hoveredIndex: index }),
  setRepeatMode: (mode) => set({ repeatMode: mode }),
  setIsShuffle: (shuffle) => set({ isShuffle: shuffle }),
  setPlayedSongs: (songs) => set({ playedSongs: songs }),
  addPlayedSong: (index) =>
    set((state) => {
      const newSet = new Set(state.playedSongs);
      newSet.add(index);
      return { playedSongs: newSet };
    }),
  removePlayedSong: (index) =>
    set((state) => {
      const newSet = new Set(state.playedSongs);
      newSet.delete(index);
      return { playedSongs: newSet };
    }),
  setShuffleOrder: (order) => set({ shuffleOrder: order }),
  setPreviousIndex: (index) => set({ previousIndex: index }),
  setWasRewound: (rewound) => set({ wasRewound: rewound }),
  
  handleNext: () => {
    set((state) => {
      const length = state.playlist.length;
      if (length === 0) return state;

      const repeat = state.repeatMode;
      const shuffle = state.isShuffle;
      const order = state.shuffleOrder;
      const played = state.playedSongs;

      if (repeat === "one") {
        return state;
      }

      const playedList = Array.from(played).filter(i => i !== state.currentIndex);
      const unplayed = Array.from({ length: length }, (_, i) => i)
        .filter(i => !played.has(i) || i === state.currentIndex);
      
      let orderedList: number[];
      if (shuffle && order.length > 0) {
        orderedList = [...playedList, ...order];
      } else {
        if (state.currentIndex >= 0 && unplayed.includes(state.currentIndex)) {
          orderedList = [...playedList, state.currentIndex, ...unplayed.filter(i => i !== state.currentIndex)];
        } else {
          orderedList = [...playedList, ...unplayed];
        }
      }

      const currentPos = orderedList.indexOf(state.currentIndex);
      if (currentPos >= 0 && currentPos < orderedList.length - 1) {
        const nextSongIndex = orderedList[currentPos + 1];
        const newSet = new Set(state.playedSongs);
        newSet.add(state.currentIndex);
        return {
          currentIndex: nextSongIndex,
          playedSongs: newSet,
        };
      } else if (repeat === "all") {
        const newSet = new Set(state.playedSongs);
        newSet.add(state.currentIndex);
        return {
          currentIndex: orderedList[0],
          playedSongs: newSet,
        };
      } else if (repeat === "none") {
        return state;
      }

      return state;
    });
  },
  
  handlePrevious: () => {
    set((state) => {
      if (state.playlist.length === 0) return state;

      const played = Array.from(state.playedSongs).filter(i => i !== state.currentIndex);
      const unplayed = Array.from({ length: state.playlist.length }, (_, i) => i)
        .filter(i => !state.playedSongs.has(i) || i === state.currentIndex);
      
      const orderedList = [...played];
      if (state.isShuffle && state.shuffleOrder.length > 0) {
        orderedList.push(...state.shuffleOrder);
      } else {
        if (state.currentIndex >= 0 && unplayed.includes(state.currentIndex)) {
          orderedList.push(state.currentIndex, ...unplayed.filter(i => i !== state.currentIndex));
        } else {
          orderedList.push(...unplayed);
        }
      }
      
      const currentPos = orderedList.indexOf(state.currentIndex);
      if (currentPos > 0) {
        const previousSongIndex = orderedList[currentPos - 1];
        
        const newSet = new Set(state.playedSongs);
        newSet.delete(previousSongIndex);
        
        let newShuffleOrder = state.shuffleOrder;
        if (state.isShuffle && state.shuffleOrder.length > 0) {
          const currentPosInShuffle = state.shuffleOrder.indexOf(state.currentIndex);
          if (currentPosInShuffle >= 0) {
            newShuffleOrder = [...state.shuffleOrder];
            newShuffleOrder.splice(currentPosInShuffle + 1, 0, state.currentIndex);
          }
        }
        
        return {
          currentIndex: previousSongIndex,
          playedSongs: newSet,
          shuffleOrder: newShuffleOrder,
        };
      } else if (state.repeatMode === "all") {
        return {
          currentIndex: orderedList[orderedList.length - 1],
        };
      }
      
      return state;
    });
  },
  
  handleDoubleClickSong: (clickedIndex) => {
    set((state) => {
      if (clickedIndex === state.currentIndex) return state;
      
      const played = Array.from(state.playedSongs).filter(i => i !== state.currentIndex).sort((a, b) => a - b);
      const unplayed = Array.from({ length: state.playlist.length }, (_, i) => i)
        .filter(i => !state.playedSongs.has(i) || i === state.currentIndex);
      
      let upcomingList: number[];
      if (state.isShuffle && state.shuffleOrder.length > 0) {
        upcomingList = state.shuffleOrder;
      } else {
        if (state.currentIndex >= 0 && unplayed.includes(state.currentIndex)) {
          upcomingList = [state.currentIndex, ...unplayed.filter(i => i !== state.currentIndex).sort((a, b) => a - b)];
        } else {
          upcomingList = unplayed.sort((a, b) => a - b);
        }
      }
      
      const orderedList = [...played, ...upcomingList];
      const currentPos = orderedList.indexOf(state.currentIndex);
      const clickedPos = orderedList.indexOf(clickedIndex);
      
      if (currentPos >= 0 && clickedPos >= 0 && clickedPos > currentPos) {
        const songsToMarkAsFinished: number[] = [];
        for (let i = currentPos; i < clickedPos; i++) {
          songsToMarkAsFinished.push(orderedList[i]);
        }
        
        const newSet = new Set(state.playedSongs);
        songsToMarkAsFinished.forEach(i => newSet.add(i));
        
        return {
          currentIndex: clickedIndex,
          playedSongs: newSet,
        };
      } else if (clickedPos >= 0 && clickedPos < currentPos) {
        const songsToMove: number[] = [];
        for (let i = clickedPos + 1; i < currentPos; i++) {
          songsToMove.push(orderedList[i]);
        }
        if (state.currentIndex >= 0) {
          songsToMove.push(state.currentIndex);
        }
        
        if (songsToMove.length > 0) {
          const newSet = new Set(state.playedSongs);
          songsToMove.forEach(index => newSet.delete(index));
          
          let newShuffleOrder = state.shuffleOrder;
          if (state.isShuffle && state.shuffleOrder.length > 0) {
            const remainingInShuffle = state.shuffleOrder.filter(i => 
              !songsToMove.includes(i) && i !== clickedIndex
            );
            newShuffleOrder = [clickedIndex, ...songsToMove, ...remainingInShuffle];
          }
          
          return {
            currentIndex: clickedIndex,
            playedSongs: newSet,
            shuffleOrder: newShuffleOrder,
          };
        }
        
        return {
          currentIndex: clickedIndex,
        };
      } else if (clickedPos >= 0) {
        return {
          currentIndex: clickedIndex,
        };
      }
      
      return state;
    });
  },
}));

