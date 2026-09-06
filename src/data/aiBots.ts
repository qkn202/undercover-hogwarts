import type { Player, HogwartsHouse } from '../types';

export interface AiBotTemplate {
  name: string;
  house: HogwartsHouse;
  avatar: string;
  quote: string;
  personality: string;
}

export const HOGWARTS_BOTS: AiBotTemplate[] = [
  {
    name: 'Hermione Granger',
    house: 'Gryffindor',
    avatar: '📚',
    quote: 'Mình đã đọc về điều này trong cuốn Lịch Sử Pháp Thuật!',
    personality: 'Thông thái, logic và rất cẩn trọng',
  },
  {
    name: 'Ron Weasley',
    house: 'Gryffindor',
    avatar: '🍗',
    quote: 'Mẹ ơi, con thề con không phải gián điệp đâu!',
    personality: 'Hồn nhiên, hài hước và thích đồ ăn',
  },
  {
    name: 'Draco Malfoy',
    house: 'Slytherin',
    avatar: '🐍',
    quote: 'Cha tao sẽ biết chuyện này!',
    personality: 'Kiêu ngạo, tinh quái và sắc sảo',
  },
  {
    name: 'Luna Lovegood',
    house: 'Ravenclaw',
    avatar: '👓',
    quote: 'Chắc chắn bọn Quái Nargle đã lén đổi từ của mình...',
    personality: 'Mơ màng, độc lạ và khó đoán',
  },
  {
    name: 'Neville Longbottom',
    house: 'Gryffindor',
    avatar: '🌱',
    quote: 'Tại sao lúc nào xui xẻo cũng rơi trúng đầu mình chứ?',
    personality: 'Thật thà, nhút nhát nhưng quả cảm',
  },
  {
    name: 'Cedric Diggory',
    house: 'Hufflepuff',
    avatar: '🏆',
    quote: 'Công bằng và danh dự là trên hết!',
    personality: 'Chính trực, điềm đạm và đáng tin',
  },
  {
    name: 'Severus Snape',
    house: 'Slytherin',
    avatar: '🧪',
    quote: 'Trừ 10 điểm của kẻ nào dám nói dối trước mặt ta.',
    personality: 'Lạnh lùng, thâm trầm và bí hiểm',
  },
  {
    name: 'Cho Chang',
    house: 'Ravenclaw',
    avatar: '🦅',
    quote: 'Hãy quan sát thật kỹ biểu cảm của từng người.',
    personality: 'Dịu dàng, nhạy cảm và quan sát tốt',
  },
];

export function createAiPlayer(botIndex: number, currentPlayers: Player[]): Player {
  const template = HOGWARTS_BOTS[botIndex % HOGWARTS_BOTS.length];
  // Ensure unique name if duplicated
  const existingNames = new Set(currentPlayers.map((p) => p.name));
  let name = template.name;
  if (existingNames.has(name)) {
    name = `${template.name} (${Math.floor(Math.random() * 90 + 10)})`;
  }

  return {
    id: `bot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    isHost: false,
    isAi: true,
    house: template.house,
    avatar: template.avatar,
    isEliminated: false,
  };
}
