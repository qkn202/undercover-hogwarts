export type Role = 'STUDENT' | 'DEATH_EATER' | 'MR_WHITE';

export type HogwartsHouse =
  | 'GRYFFINDOR'
  | 'SLYTHERIN'
  | 'RAVENCLAW'
  | 'HUFFLEPUFF'
  | 'Gryffindor'
  | 'Slytherin'
  | 'Ravenclaw'
  | 'Hufflepuff';

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isAi: boolean;
  house?: HogwartsHouse;
  avatar?: string;
  role?: Role;
  word?: string | null;
  isEliminated?: boolean;
  speakingOrder?: number; // Thứ tự phát biểu trong ván (1, 2, 3...)
  userTag?: string;       // HPVN Member Custom Title
  hpvnUid?: string;       // HPVN Firebase Auth UID
}


export type GameStatus = 'LOBBY' | 'PLAYING' | 'REVEALED';

export interface WordPair {
  id: string;
  studentWord: string;       // Từ của Học sinh Hogwarts (Civilian)
  undercoverWord: string;    // Từ của Tử thần Thực tử (Undercover)
  category: string;          // Danh mục (Bùa chú, Đồ vật, v.v.)
  hint?: string;             // Gợi ý chủ đề chung
  isCustom?: boolean;
}

export type HostRoleMode = 'PLAYER' | 'GAME_MASTER';

export interface RoomConfig {
  hostRole: HostRoleMode;    // 'PLAYER': Host cùng chơi nhận thẻ | 'GAME_MASTER': Host làm quản trò thấy đáp án
  undercoverCount: number;   // Thường 1-2
  mrWhiteCount: number;      // 0 hoặc 1
  selectedCategories: string[];  // e.g. ['SPELLS', 'ITEMS'] or ['ALL'] for everything
  customPairs: WordPair[];
}


export interface RoomState {
  roomCode: string;
  hostId: string;
  status: GameStatus;
  players: Player[];
  config: RoomConfig;
  currentPair?: WordPair;
  roundNumber: number;
  currentSpeakerId?: string;
  winner?: 'STUDENT' | 'DEATH_EATER' | 'MR_WHITE' | null;
}

// Peer Message Types for P2P Communication
export type PeerMessageType =
  | 'JOIN_REQUEST'
  | 'ROOM_STATE_SYNC'
  | 'ASSIGN_SECRET_CARD'
  | 'REVEAL_ALL_CARDS'
  | 'RESET_NEXT_ROUND'
  | 'PLAYER_LEFT'
  | 'KICK_PLAYER'
  | 'RENAME_PLAYER'
  | 'ROOM_CLOSED'
  | 'HOST_DISCONNECTED'
  | 'HOST_RECONNECTED'
  | 'UPDATE_SPEAKER_TURN'
  | 'MR_WHITE_GUESS'
  | 'GAME_OVER'
  | 'PING'
  | 'PONG';

export interface PeerMessage {
  type: PeerMessageType;
  senderId: string;
  payload: any;
}
