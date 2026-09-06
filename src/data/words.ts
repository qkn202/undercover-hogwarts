import type { WordPair } from '../types';

export const CATEGORIES = [
  { id: 'ALL', label: 'Tất Cả Thể Loại', icon: '✨' },
  { id: 'SPELLS', label: 'Bùa Chú & Ma Pháp', icon: '🪄' },
  { id: 'ITEMS', label: 'Bảo Bối & Pháp Bảo', icon: '🔮' },
  { id: 'LOCATIONS', label: 'Địa Danh & Căn Phòng', icon: '🏰' },
  { id: 'CREATURES', label: 'Sinh Vật Huyền Bí', icon: '🦅' },
  { id: 'CHARACTERS', label: 'Nhân Vật & Gia Tộc', icon: '🧙' },
  { id: 'DAILY', label: 'Đời Thường & Đố Vui', icon: '☕' },
];

export const DEFAULT_WORD_PAIRS: WordPair[] = [
  // --- BÙA CHÚ & MA PHÁP ---
  {
    id: 'spell-1',
    studentWord: 'Expelliarmus (Giải Giới)',
    undercoverWord: 'Avada Kedavra (Lời Nguyền Chết)',
    category: 'SPELLS',
  },
  {
    id: 'spell-2',
    studentWord: 'Lumos (Thắp Sáng)',
    undercoverWord: 'Nox (Tắt Lửa)',
    category: 'SPELLS',
  },
  {
    id: 'spell-3',
    studentWord: 'Expecto Patronum (Thần Hộ Mệnh)',
    undercoverWord: 'Riddikulus (Kỳ Quặc Kỳ Dị)',
    category: 'SPELLS',
  },
  {
    id: 'spell-4',
    studentWord: 'Accio (Triệu Tập)',
    undercoverWord: 'Wingardium Leviosa (Bay Lơ Lửng)',
    category: 'SPELLS',
  },
  {
    id: 'spell-5',
    studentWord: 'Crucio (Tra Tấn)',
    undercoverWord: 'Imperio (Độc Đoán Điều Khiển)',
    category: 'SPELLS',
  },
  {
    id: 'spell-6',
    studentWord: 'Petrificus Totalus (Trói Toàn Thân)',
    undercoverWord: 'Stupefy (Bùa Choáng)',
    category: 'SPELLS',
  },
  {
    id: 'spell-7',
    studentWord: 'Piertotum Locomotor (Đánh thức tượng đá)',
    undercoverWord: 'Fianto Duri (Màng chắn bảo vệ Hogwarts)',
    category: 'SPELLS',
  },
  {
    id: 'spell-8',
    studentWord: 'Bùa Trung Tín Fidelius (Giấu bí mật)',
    undercoverWord: 'Lời Thề Bất Khả Thất (Unbreakable Vow)',
    category: 'SPELLS',
  },
  {
    id: 'spell-9',
    studentWord: 'Muffliato (Bùa ù tai giữ bí mật)',
    undercoverWord: 'Silencio (Bùa câm lặng)',
    category: 'SPELLS',
  },
  {
    id: 'spell-10',
    studentWord: 'Levicorpus (Treo ngược mắt cá)',
    undercoverWord: 'Liberacorpus (Giải phóng thả rơi)',
    category: 'SPELLS',
  },
  {
    id: 'spell-11',
    studentWord: 'Episkey (Chữa gãy xương nhẹ)',
    undercoverWord: 'Ferula (Băng bó nẹp chân)',
    category: 'SPELLS',
  },
  {
    id: 'spell-12',
    studentWord: 'Fiendfyre (Lửa Quỷ hắc ám)',
    undercoverWord: 'Aguamenti (Bùa phun tia nước)',
    category: 'SPELLS',
  },
  {
    id: 'spell-13',
    studentWord: 'Prior Incantato (Hiện bùa cũ)',
    undercoverWord: 'Deletrius (Xóa dấu vết ma pháp)',
    category: 'SPELLS',
  },
  {
    id: 'spell-14',
    studentWord: 'Reducto (Nghiền nát tan tành)',
    undercoverWord: 'Diffindo (Bùa cắt đứt)',
    category: 'SPELLS',
  },
  {
    id: 'spell-15',
    studentWord: 'Morsmordre (Dấu Hiệu Hắc Ám)',
    undercoverWord: 'Periculum (Tia lửa đỏ cầu cứu)',
    category: 'SPELLS',
  },
  {
    id: 'spell-16',
    studentWord: 'Rictusempra (Bùa cù lét cười rũ)',
    undercoverWord: 'Tarantallegra (Bùa nhảy múa không dừng)',
    category: 'SPELLS',
  },
  {
    id: 'spell-17',
    studentWord: 'Aparecium (Hiện mực vô hình)',
    undercoverWord: 'Specialis Revelio (Hiện ma thuật ngầm)',
    category: 'SPELLS',
  },
  {
    id: 'spell-18',
    studentWord: 'Sectumsempra',
    undercoverWord: 'Bùa Muối Phồng (Engorgio)',
    category: 'SPELLS',
  },
  {
    id: 'spell-19',
    studentWord: 'Bùa Bất Khả Xuyên (Protego)',
    undercoverWord: 'Bùa Impedimenta (Cản trở)',
    category: 'SPELLS',
  },
  {
    id: 'spell-20',
    studentWord: 'Bùa Kí Ức Obliviate',
    undercoverWord: 'Bùa Lú Confundus',
    category: 'SPELLS',
  },
  {
    id: 'spell-21',
    studentWord: 'Bùa Cởi Trói Relashio',
    undercoverWord: 'Bùa Khóa Alohomora',
    category: 'SPELLS',
  },
  {
    id: 'spell-22',
    studentWord: 'Legilimens',
    undercoverWord: 'Occlumency (phòng thủ tâm trí)',
    category: 'SPELLS',
  },
  {
    id: 'spell-23',
    studentWord: 'Bùa Triệu Hồi Portkey',
    undercoverWord: 'Cột Ống Khói Floo',
    category: 'SPELLS',
  },

  // --- BẢO BỐI & PHÁP BẢO ---
  {
    id: 'item-1',
    studentWord: 'Áo Choàng Tàng Hình',
    undercoverWord: 'Đá Hồi Sinh',
    category: 'ITEMS',
  },
  {
    id: 'item-2',
    studentWord: 'Chiếc Xe Bay Ford Anglia (Nhà Weasley)',
    undercoverWord: 'Cỗ Xe Ngựa Bay Beauxbatons',
    category: 'ITEMS',
  },
  {
    id: 'item-3',
    studentWord: 'Chiếc Nón Phân Loại',
    undercoverWord: 'Chiếc Cốc Lửa (Goblet of Fire)',
    category: 'ITEMS',
  },
  {
    id: 'item-4',
    studentWord: 'Quả Snitch Vàng',
    undercoverWord: 'Trái Quaffle',
    category: 'ITEMS',
  },
  {
    id: 'item-5',
    studentWord: 'Chậu Tưởng Ký (Pensieve)',
    undercoverWord: 'Đồng Hồ 9 Kim Nhà Weasley',
    category: 'ITEMS',
  },
  {
    id: 'item-6',
    studentWord: 'Trường Sinh Linh Giá (Horcrux)',
    undercoverWord: 'Thần Hộ Mệnh (Patronus)',
    category: 'ITEMS',
  },
  {
    id: 'item-7',
    studentWord: 'Chổi Nimbus 2000',
    undercoverWord: 'Chổi Tia Chớp (Firebolt)',
    category: 'ITEMS',
  },
  {
    id: 'item-8',
    studentWord: 'Bia Bơ (Butterbeer)',
    undercoverWord: 'Nước Ép Bí Đỏ',
    category: 'ITEMS',
  },
  {
    id: 'item-9',
    studentWord: 'Kẹo Bông Đủ Vị Bertie Bott',
    undercoverWord: 'Kẹo Ếch Sô-cô-la',
    category: 'ITEMS',
  },
  {
    id: 'item-10',
    studentWord: 'Bàn Tay Vinh Quang (Hand of Glory)',
    undercoverWord: 'Cái Tắt Sáng (Deluminator)',
    category: 'ITEMS',
  },
  {
    id: 'item-11',
    studentWord: 'Chiếc Gương Hai Chiều (Sirius & Harry)',
    undercoverWord: 'Kính Dò Kẻ Địch (Foe-Glass)',
    category: 'ITEMS',
  },
  {
    id: 'item-12',
    studentWord: 'Tủ Biến Mất (Vanishing Cabinet)',
    undercoverWord: 'Chiếc Khóa Cảng Portkey (Đồ thường)',
    category: 'ITEMS',
  },
  {
    id: 'item-13',
    studentWord: 'Hộp Nhạc Nguyền Rủa (Grimmauld)',
    undercoverWord: 'Bình Rượu Độc Mật Ong (Slughorn)',
    category: 'ITEMS',
  },
  {
    id: 'item-14',
    studentWord: 'Hòn Đá Phù Thủy (Tạo trường sinh)',
    undercoverWord: 'Đá Bezoar (Ngọc giải độc dạ dày dê)',
    category: 'ITEMS',
  },
  {
    id: 'item-15',
    studentWord: 'Quả Cầu Gợi Nhớ (Remembrall)',
    undercoverWord: 'Kính Soi Gian Dối (Sneakoscope)',
    category: 'ITEMS',
  },
  {
    id: 'item-16',
    studentWord: 'Tai Kéo Dài (Extendable Ears Weasley)',
    undercoverWord: 'Kính Đa Tròng Spectrespecs (Luna)',
    category: 'ITEMS',
  },
  {
    id: 'item-17',
    studentWord: 'Chiếc Cúp Tam Pháp Thuật',
    undercoverWord: 'Quả Trứng Vàng Tam Pháp Thuật',
    category: 'ITEMS',
  },
  {
    id: 'item-18',
    studentWord: 'Thư Sấm Gầm Thét (Howler)',
    undercoverWord: 'Nhật Ký Tom Riddle (Mực thấm mất)',
    category: 'ITEMS',
  },
  {
    id: 'item-19',
    studentWord: 'Thanh Kiếm Gryffindor (Thấm nọc)',
    undercoverWord: 'Nanh Tử Xà Basilisk',
    category: 'ITEMS',
  },
  {
    id: 'item-20',
    studentWord: 'Bút Tự Động Viết (Của Rita Skeeter)',
    undercoverWord: 'Bút Lông Máu Rạch Thịt (Umbridge)',
    category: 'ITEMS',
  },
  {
    id: 'item-21',
    studentWord: 'Bột Floo Xanh (Du hành lò sưởi)',
    undercoverWord: 'Bột Tối Tăm Peru (Tạo bóng đêm)',
    category: 'ITEMS',
  },
  {
    id: 'item-22',
    studentWord: 'Bình Phúc Lạc Dược (Felix Felicis)',
    undercoverWord: 'Bình Độc Dược Đa Quả (Polyjuice)',
    category: 'ITEMS',
  },
  {
    id: 'item-23',
    studentWord: 'Mề Đay Salazar Slytherin',
    undercoverWord: 'Mề Đay Giả Của R.A.B',
    category: 'ITEMS',
  },
  {
    id: 'item-24',
    studentWord: 'Vòng cổ Opal (Horcrux)',
    undercoverWord: 'Chiếc cốc Hufflepuff (Horcrux)',
    category: 'ITEMS',
  },
  {
    id: 'item-25',
    studentWord: 'Nhẫn Marvolo Gaunt',
    undercoverWord: 'Trâm cài Ravenclaw',
    category: 'ITEMS',
  },
  {
    id: 'item-26',
    studentWord: 'Gương Erised',
    undercoverWord: 'Quả Cầu Tiên Tri',
    category: 'ITEMS',
  },
  {
    id: 'item-27',
    studentWord: 'Đồng hồ cát Chuyển Thời (Time-Turner)',
    undercoverWord: 'Túi xách Không Đáy (Mở rộng)',
    category: 'ITEMS',
  },
  {
    id: 'item-28',
    studentWord: 'Bản đồ Đạo Tặc',
    undercoverWord: 'Cây gậy Cơm Nguội (Elder Wand)',
    category: 'ITEMS',
  },

  // --- ĐỊA DANH & CĂN PHÒNG ---
  {
    id: 'loc-1',
    studentWord: 'Phòng Yêu Cầu',
    undercoverWord: 'Phòng Chứa Bí Mật',
    category: 'LOCATIONS',
  },
  {
    id: 'loc-2',
    studentWord: 'Hẻm Xéo (Diagon Alley)',
    undercoverWord: 'Hẻm Knockturn',
    category: 'LOCATIONS',
  },
  {
    id: 'loc-3',
    studentWord: 'Đại Sảnh Đường',
    undercoverWord: 'Thư Viện Hogwarts',
    category: 'LOCATIONS',
  },
  {
    id: 'loc-4',
    studentWord: 'Nhà Ngục Azkaban',
    undercoverWord: 'Thung Lũng Godric',
    category: 'LOCATIONS',
  },
  {
    id: 'loc-5',
    studentWord: 'Rừng Cấm (Forbidden Forest)',
    undercoverWord: 'Hồ Đen (Black Lake)',
    category: 'LOCATIONS',
  },
  {
    id: 'loc-6',
    studentWord: 'Sân Ga 9 3/4',
    undercoverWord: 'Quán Đầu Heo (Hog\'s Head)',
    category: 'LOCATIONS',
  },
  {
    id: 'loc-7',
    studentWord: 'Tháp Thiên Văn',
    undercoverWord: 'Tháp Cú (Owlery)',
    category: 'LOCATIONS',
  },

  // --- SINH VẬT HUYỀN BÍ ---
  {
    id: 'creat-1',
    studentWord: 'Phượng Hoàng Fawkes',
    undercoverWord: 'Cú Tuyết Hedwig',
    category: 'CREATURES',
  },
  {
    id: 'creat-2',
    studentWord: 'Giám Ngục Azkaban (Dementor)',
    undercoverWord: 'Âm Binh Inferi (Xác sống dưới hồ)',
    category: 'CREATURES',
  },
  {
    id: 'creat-3',
    studentWord: 'Tử Xà Basilisk',
    undercoverWord: 'Rồng Đuôi Gai Hungary',
    category: 'CREATURES',
  },
  {
    id: 'creat-4',
    studentWord: 'Bọ Ngựa Giữ Cây Bowtruckle',
    undercoverWord: 'Thú Bán Nguyệt Demiguise (Tàng hình)',
    category: 'CREATURES',
  },
  {
    id: 'creat-5',
    studentWord: 'Gia Tinh Dobby',
    undercoverWord: 'Yêu Tinh Ngân Hàng Gringotts',
    category: 'CREATURES',
  },
  {
    id: 'creat-6',
    studentWord: 'Tro Xà Ashwinder (Rắn sinh từ lửa)',
    undercoverWord: 'Thằn Lằn Lửa Salamander',
    category: 'CREATURES',
  },
  {
    id: 'creat-7',
    studentWord: 'Rồng Xanh Xứ Wales',
    undercoverWord: 'Rồng Thụy Điển Mũi Hếch',
    category: 'CREATURES',
  },
  {
    id: 'creat-8',
    studentWord: 'Tiên Nhí Cornwall (Cornish Pixie xanh)',
    undercoverWord: 'Yêu Tinh Peeves (Hồn ma náo loạn)',
    category: 'CREATURES',
  },
  {
    id: 'creat-9',
    studentWord: 'Thú Mỏ Vịt Niffler (Thích vàng bạc)',
    undercoverWord: 'Yêu Tinh Vàng Ailen Leprechaun',
    category: 'CREATURES',
  },
  {
    id: 'creat-10',
    studentWord: 'Người Cá Biển Đen (Merpeople)',
    undercoverWord: 'Mực Khổng Lồ Hồ Đen (Giant Squid)',
    category: 'CREATURES',
  },
  {
    id: 'creat-11',
    studentWord: 'Nhân sư (Sphinx)',
    undercoverWord: 'Nhân mã Firenze',
    category: 'CREATURES',
  },
  {
    id: 'creat-12',
    studentWord: 'Chó ba đầu Fluffy',
    undercoverWord: 'Rắn khổng lồ Nagini',
    category: 'CREATURES',
  },
  {
    id: 'creat-13',
    studentWord: 'Bọ Cạp Lửa (Blast-Ended Skrewt)',
    undercoverWord: 'Manticore',
    category: 'CREATURES',
  },
  {
    id: 'creat-14',
    studentWord: 'Doxy',
    undercoverWord: 'Gnome (yêu tinh vườn)',
    category: 'CREATURES',
  },
  {
    id: 'creat-15',
    studentWord: 'Thestral (Vong Mã)',
    undercoverWord: 'Hippogriff (Bằng Mã Buckbeak)',
    category: 'CREATURES',
  },
  {
    id: 'creat-16',
    studentWord: 'Ông Kẹ (Boggart)',
    undercoverWord: 'Thủy Quái Grindylow',
    category: 'CREATURES',
  },
  {
    id: 'creat-17',
    studentWord: 'Kappa (Thủy quái Nhật Bản)',
    undercoverWord: 'Chimaera (Quái thú đầu sư tử thân dê)',
    category: 'CREATURES',
  },
  {
    id: 'creat-18',
    studentWord: 'Cú Heo Pigwidgeon (Cú nhỏ của Ron)',
    undercoverWord: 'Cóc Trevor (Thú cưng Neville)',
    category: 'CREATURES',
  },
  {
    id: 'creat-19',
    studentWord: 'Bạch Mã Có Cánh Abraxan',
    undercoverWord: 'Kỳ Lân Rừng Cấm (Unicorn)',
    category: 'CREATURES',
  },
  {
    id: 'creat-20',
    studentWord: 'Gia Tinh Winky (Say bơ bia)',
    undercoverWord: 'Gia Tinh Kreacher (Nhà Black)',
    category: 'CREATURES',
  },
  {
    id: 'creat-21',
    studentWord: 'Mèo Lai Kneazle (Crookshanks)',
    undercoverWord: 'Chó Hung Thần Grim (Điềm Tử)',
    category: 'CREATURES',
  },

  // --- NHÂN VẬT & GIA TỘC ---
  {
    id: 'char-1',
    studentWord: 'Giáo sư Dumbledore',
    undercoverWord: 'Chúa tể Voldemort',
    category: 'CHARACTERS',
  },
  {
    id: 'char-2',
    studentWord: 'Gia Tộc Weasley',
    undercoverWord: 'Gia Tộc Malfoy',
    category: 'CHARACTERS',
  },
  {
    id: 'char-3',
    studentWord: 'Giáo sư McGonagall',
    undercoverWord: 'Giáo sư Snape',
    category: 'CHARACTERS',
  },
  {
    id: 'char-4',
    studentWord: 'Hội Phượng Hoàng',
    undercoverWord: 'Tử Thần Thực Tử',
    category: 'CHARACTERS',
  },
  {
    id: 'char-5',
    studentWord: 'Harry Potter',
    undercoverWord: 'Draco Malfoy',
    category: 'CHARACTERS',
  },
  {
    id: 'char-6',
    studentWord: 'Alastor Moody (Mắt Điên)',
    undercoverWord: 'Kingsley Shacklebolt',
    category: 'CHARACTERS',
  },
  {
    id: 'char-7',
    studentWord: 'Dolores Umbridge',
    undercoverWord: 'Bellatrix Lestrange',
    category: 'CHARACTERS',
  },
  {
    id: 'char-8',
    studentWord: 'Ollivander',
    undercoverWord: 'Griphook',
    category: 'CHARACTERS',
  },
  {
    id: 'char-9',
    studentWord: 'Bà Pomfrey (Y tá trưởng)',
    undercoverWord: 'Bà Pince (Thủ thư Hogwarts)',
    category: 'CHARACTERS',
  },
  {
    id: 'char-10',
    studentWord: 'Giáo sư Flitwick (Bùa chú)',
    undercoverWord: 'Giáo sư Sprout (Thảo dược)',
    category: 'CHARACTERS',
  },
  {
    id: 'char-11',
    studentWord: 'Giáo sư Trelawney',
    undercoverWord: 'Nhân Mã Firenze',
    category: 'CHARACTERS',
  },
  {
    id: 'char-12',
    studentWord: 'Aberforth Dumbledore',
    undercoverWord: 'Mundungus Fletcher',
    category: 'CHARACTERS',
  },
  {
    id: 'char-13',
    studentWord: 'Barty Crouch Snr (Bộ Pháp Thuật)',
    undercoverWord: 'Ludo Bagman (Bộ Thể Thao)',
    category: 'CHARACTERS',
  },
  {
    id: 'char-14',
    studentWord: 'Stan Shunpike (Lơ xe Đò Hiệp Sĩ)',
    undercoverWord: 'Ernie Prang (Tài xế Đò Hiệp Sĩ)',
    category: 'CHARACTERS',
  },
  {
    id: 'char-15',
    studentWord: 'Colin Creevey',
    undercoverWord: 'Dennis Creevey',
    category: 'CHARACTERS',
  },
  {
    id: 'char-16',
    studentWord: 'Bà Béo (Bức tranh Gryffindor)',
    undercoverWord: 'Ma Nick Suýt Mất Đầu',
    category: 'CHARACTERS',
  },
  {
    id: 'char-17',
    studentWord: 'Cornelius Fudge (Bộ trưởng)',
    undercoverWord: 'Rufus Scrimgeour (Bộ trưởng)',
    category: 'CHARACTERS',
  },
  {
    id: 'char-18',
    studentWord: 'Lucius Malfoy',
    undercoverWord: 'Narcissa Malfoy',
    category: 'CHARACTERS',
  },
  {
    id: 'char-19',
    studentWord: 'Cụ Nicolas Flamel',
    undercoverWord: 'Bà Bathilda Bagshot',
    category: 'CHARACTERS',
  },
  {
    id: 'char-20',
    studentWord: 'Fleur Delacour',
    undercoverWord: 'Nymphadora Tonks',
    category: 'CHARACTERS',
  },
  {
    id: 'char-21',
    studentWord: 'Xenophilius Lovegood',
    undercoverWord: 'Rita Skeeter',
    category: 'CHARACTERS',
  },
  {
    id: 'char-22',
    studentWord: 'Argus Filch',
    undercoverWord: 'Bà Norris (con mèo)',
    category: 'CHARACTERS',
  },
  {
    id: 'char-23',
    studentWord: 'Moaning Myrtle',
    undercoverWord: 'Nam Tước Máu (ma)',
    category: 'CHARACTERS',
  },
  {
    id: 'char-24',
    studentWord: 'Regulus Black',
    undercoverWord: 'Bellatrix Lestrange',
    category: 'CHARACTERS',
  },
  {
    id: 'char-25',
    studentWord: 'Peter Pettigrew',
    undercoverWord: 'Gilderoy Lockhart',
    category: 'CHARACTERS',
  },

  // --- ĐỜI THƯỜNG & ĐỐ VUI (PARTY WORDS) ---
  {
    id: 'daily-1',
    studentWord: 'Cà Phê Sữa Đá',
    undercoverWord: 'Trà Sữa Trân Châu',
    category: 'DAILY',
  },
  {
    id: 'daily-2',
    studentWord: 'Bánh Mì Kẹp Thịt',
    undercoverWord: 'Bánh Bao Nhân Thịt',
    category: 'DAILY',
  },
  {
    id: 'daily-3',
    studentWord: 'Rạp Chiếu Phim',
    undercoverWord: 'Xem Phim Netflix Tại Nhà',
    category: 'DAILY',
  },
  {
    id: 'daily-4',
    studentWord: 'Xe Máy Tay Ga',
    undercoverWord: 'Xe Đạp Điện',
    category: 'DAILY',
  },
  {
    id: 'daily-5',
    studentWord: 'Bãi Biển Nghỉ Dưỡng',
    undercoverWord: 'Hồ Bơi Vô Cực',
    category: 'DAILY',
  },
  {
    id: 'daily-6',
    studentWord: 'Cơn Mưa Rào',
    undercoverWord: 'Cơn Bão Lớn',
    category: 'DAILY',
  },
  {
    id: 'daily-7',
    studentWord: 'Kính Râm Thời Trang',
    undercoverWord: 'Mũ Lưỡi Trai',
    category: 'DAILY',
  },
  {
    id: 'daily-8',
    studentWord: 'Tai Nghe Không Dây',
    undercoverWord: 'Loa Bluetooth',
    category: 'DAILY',
  },
  {
    id: 'daily-9',
    studentWord: 'Bia Bơ (Butterbeer)',
    undercoverWord: 'Nước Ép Bí Đỏ (Pumpkin Juice)',
    category: 'DAILY',
  },
  {
    id: 'daily-10',
    studentWord: 'Kẹo Đủ Vị Bertie Bott',
    undercoverWord: 'Ếch Sô-cô-la (Chocolate Frog)',
    category: 'DAILY',
  },
  {
    id: 'daily-11',
    studentWord: 'Nhật Báo Tiên Tri (Daily Prophet)',
    undercoverWord: 'Tạp Chí Kẻ Bắt Bẻ (The Quibbler)',
    category: 'DAILY',
  },
  {
    id: 'daily-12',
    studentWord: 'Cờ Phù Thủy (Wizard Chess)',
    undercoverWord: 'Bài Banh Nổ (Exploding Snap)',
    category: 'DAILY',
  },
  {
    id: 'daily-13',
    studentWord: 'Bụi Floo (Floo Powder)',
    undercoverWord: 'Khóa Cảng (Portkey)',
    category: 'DAILY',
  },
  {
    id: 'daily-14',
    studentWord: 'Thư Báo Nhập Học Hogwarts',
    undercoverWord: 'Thư Sấm (Howler - Thư Gầm Thét)',
    category: 'DAILY',
  },
  {
    id: 'daily-15',
    studentWord: 'Chổi Bay Tia Chớp (Firebolt)',
    undercoverWord: 'Chổi Bay Nimbus 2000',
    category: 'DAILY',
  },
  {
    id: 'daily-16',
    studentWord: 'Cuộc Thi Tam Pháp Thuật (Triwizard)',
    undercoverWord: 'Cúp Quidditch Giữa Các Nhà',
    category: 'DAILY',
  },
  {
    id: 'daily-17',
    studentWord: 'Kỳ Thi Pháp Thuật O.W.L (Phổ Thông)',
    undercoverWord: 'Kỳ Thi Cấp Cao N.E.W.T (Tận Sức)',
    category: 'DAILY',
  },
  {
    id: 'daily-18',
    studentWord: 'Kẹo Bông Đường Công Thức Phù Thủy',
    undercoverWord: 'Kẹo Cay Tiêu Đỏ Xì Khói Tai',
    category: 'DAILY',
  },

  // --- BỔ SUNG ĐỊA DANH & CĂN PHÒNG ---
  {
    id: 'loc-8',
    studentWord: 'Phòng Yêu Cầu (Room of Requirement)',
    undercoverWord: 'Phòng Chứa Bí Mật (Chamber of Secrets)',
    category: 'LOCATIONS',
  },
  {
    id: 'loc-9',
    studentWord: 'Hẻm Xéo (Diagon Alley)',
    undercoverWord: 'Hẻm Knockturn (Hẻm Xéo Hắc Ám)',
    category: 'LOCATIONS',
  },
  {
    id: 'loc-10',
    studentWord: 'Quán Ba Cây Chổi (The Three Broomsticks)',
    undercoverWord: 'Quán Đầu Heo (Hog\'s Head Pub)',
    category: 'LOCATIONS',
  },
  {
    id: 'loc-11',
    studentWord: 'Rừng Cấm Hogwarts (Forbidden Forest)',
    undercoverWord: 'Thung Lũng Godric (Godric\'s Hollow)',
    category: 'LOCATIONS',
  },
  {
    id: 'loc-12',
    studentWord: 'Nhà Ga Ngã Tư Vua (King\'s Cross)',
    undercoverWord: 'Sân Ga Chín Ba Phần Tư (Platform 9 ¾)',
    category: 'LOCATIONS',
  },
  {
    id: 'loc-13',
    studentWord: 'Ngân Hàng Phù Thủy Gringotts',
    undercoverWord: 'Bộ Pháp Thuật (Ministry of Magic)',
    category: 'LOCATIONS',
  },
  {
    id: 'loc-14',
    studentWord: 'Lều Của Bác Hagrid Ven Rừng',
    undercoverWord: 'Lều Quán Tiếng Thét (Shrieking Shack)',
    category: 'LOCATIONS',
  },
  {
    id: 'loc-15',
    studentWord: 'Tháp Thiên Văn Hogwarts',
    undercoverWord: 'Tháp Cú Gửi Thư Hogwarts',
    category: 'LOCATIONS',
  },
  {
    id: 'loc-16',
    studentWord: 'Nhà Tù Phù Thủy Azkaban',
    undercoverWord: 'Lâu Đài Nurmengard (Nhà Tù Grindelwald)',
    category: 'LOCATIONS',
  },
  {
    id: 'loc-17',
    studentWord: 'Trang Viên Quý Tộc Malfoy Manor',
    undercoverWord: 'Hang Sóc (The Burrow - Nhà Weasley)',
    category: 'LOCATIONS',
  },
  {
    id: 'loc-18',
    studentWord: 'Phòng Hiệu Trưởng Dumbledore',
    undercoverWord: 'Hầm Độc Dược Của Thầy Snape',
    category: 'LOCATIONS',
  },
  {
    id: 'loc-19',
    studentWord: 'Đại Sảnh Đường (Great Hall)',
    undercoverWord: 'Phòng Sinh Hoạt Chung Gryffindor',
    category: 'LOCATIONS',
  },
  {
    id: 'loc-20',
    studentWord: 'Bệnh Thất Trường Hogwarts',
    undercoverWord: 'Bệnh Viện Phù Thủy Thánh Mungo',
    category: 'LOCATIONS',
  },

  // --- BỔ SUNG BÙA CHÚ & MA PHÁP ---
  {
    id: 'spell-24',
    studentWord: 'Aguamenti (Phun Nước Sạch)',
    undercoverWord: 'Incendio (Phun Ngọn Lửa Đỏ)',
    category: 'SPELLS',
  },
  {
    id: 'spell-25',
    studentWord: 'Alohomora (Mở Khóa Ổ Cửa)',
    undercoverWord: 'Colloportus (Niêm Phong Cửa Kín)',
    category: 'SPELLS',
  },
  {
    id: 'spell-26',
    studentWord: 'Diffindo (Cắt Rách Đồ Vật)',
    undercoverWord: 'Reparo (Hàn Gắn Đồ Vật Lành)',
    category: 'SPELLS',
  },
  {
    id: 'spell-27',
    studentWord: 'Reducto (Công Phá Bắn Nổ)',
    undercoverWord: 'Bombarda (Nổ Tung Bức Tường)',
    category: 'SPELLS',
  },
  {
    id: 'spell-28',
    studentWord: 'Sectumsempra (Chém Vết Thương Sâu)',
    undercoverWord: 'Vulnera Sanentur (Thần Chú Chữa Vết Cắt Snape)',
    category: 'SPELLS',
  },
  {
    id: 'spell-29',
    studentWord: 'Confundo (Bùa Khiến Lú Lẫn)',
    undercoverWord: 'Obliviate (Bùa Xóa Ký Ức Hoàn Toàn)',
    category: 'SPELLS',
  },
  {
    id: 'spell-30',
    studentWord: 'Engorgio (Phóng To Khổng Lồ)',
    undercoverWord: 'Reducio (Thu Nhỏ Tí Hon)',
    category: 'SPELLS',
  },
  {
    id: 'spell-31',
    studentWord: 'Protego (Khiên Chắn Bùa Phép)',
    undercoverWord: 'Protego Diabolica (Khiên Lửa Đen Hắc Ám)',
    category: 'SPELLS',
  },

  // --- BỔ SUNG BẢO BỐI & PHÁP BẢO ---
  {
    id: 'item-29',
    studentWord: 'Chiếc Gương Biến Ảo (Mirror of Erised)',
    undercoverWord: 'Tấm Bản Đồ Đạo Tặc (Marauder\'s Map)',
    category: 'ITEMS',
  },
  {
    id: 'item-30',
    studentWord: 'Quả Cầu Gợi Nhớ (Remembrall)',
    undercoverWord: 'Kính Nhìn Xuyên Thấu Quái Quái (Spectrespecs)',
    category: 'ITEMS',
  },
  {
    id: 'item-31',
    studentWord: 'Chiếc Mũ Phân Loại (Sorting Hat)',
    undercoverWord: 'Chiếc Cốc Lửa Chọn Quán Quân (Goblet of Fire)',
    category: 'ITEMS',
  },
  {
    id: 'item-32',
    studentWord: 'Vòng Xoay Thời Gian (Time-Turner)',
    undercoverWord: 'Đồng Hồ Vị Trí Gia Đình Weasley',
    category: 'ITEMS',
  },
  {
    id: 'item-33',
    studentWord: 'Hòn Đá Phù Thủy Trường Sinh',
    undercoverWord: 'Viên Đá Phục Sinh Gọi Hồn (Resurrection Stone)',
    category: 'ITEMS',
  },
  {
    id: 'item-34',
    studentWord: 'Vương Miện Trí Tuệ Ravenclaw',
    undercoverWord: 'Chiếc Cúp Vàng Hufflepuff',
    category: 'ITEMS',
  },
  {
    id: 'item-35',
    studentWord: 'Mắt Thần Xoay Của Thần Sáng Moody',
    undercoverWord: 'Quả Cầu Thủy Tinh Tiên Tri Tương Lai',
    category: 'ITEMS',
  },

  // --- BỔ SUNG NHÂN VẬT & GIA TỘC ---
  {
    id: 'char-26',
    studentWord: 'Cụ Hiệu Trưởng Albus Dumbledore',
    undercoverWord: 'Chúa Tể Hắc Ám Gellert Grindelwald',
    category: 'CHARACTERS',
  },
  {
    id: 'char-27',
    studentWord: 'Thầy Độc Dược Severus Snape',
    undercoverWord: 'Thầy Phòng Chống Hắc Ám Remus Lupin',
    category: 'CHARACTERS',
  },
  {
    id: 'char-28',
    studentWord: 'Chú Sirius Black (Chân Nhồi)',
    undercoverWord: 'Peter Pettigrew (Đuôi Trùn Phản Bội)',
    category: 'CHARACTERS',
  },
  {
    id: 'char-29',
    studentWord: 'Fred Weasley (Anh)',
    undercoverWord: 'George Weasley (Em)',
    category: 'CHARACTERS',
  },
  {
    id: 'char-30',
    studentWord: 'Thần Sáng Alastor Mắt Điên Moody',
    undercoverWord: 'Barty Crouch Con (Kẻ Giả Mạo)',
    category: 'CHARACTERS',
  },
  {
    id: 'char-31',
    studentWord: 'Neville Longbottom',
    undercoverWord: 'Draco Malfoy',
    category: 'CHARACTERS',
  },
  {
    id: 'char-32',
    studentWord: 'Mẹ Narcissa Malfoy',
    undercoverWord: 'Mụ Cuồng Tín Bellatrix Lestrange',
    category: 'CHARACTERS',
  },
  {
    id: 'char-33',
    studentWord: 'Luna Lovegood (Mơ Màng)',
    undercoverWord: 'Cho Chang (Tầm Thủ Ravenclaw)',
    category: 'CHARACTERS',
  },
  {
    id: 'char-34',
    studentWord: 'Giáo Sư Minerva McGonagall',
    undercoverWord: 'Mụ Thứ Trưởng Dolores Umbridge (Hồng)',
    category: 'CHARACTERS',
  },

  // --- BỔ SUNG SINH VẬT HUYỀN BÍ ---
  {
    id: 'creat-22',
    studentWord: 'Bạch Kỳ Mã (Unicorn Lông Trắng)',
    undercoverWord: 'Vọng Mã Thestral (Ngựa Xương Có Cánh)',
    category: 'CREATURES',
  },
  {
    id: 'creat-23',
    studentWord: 'Tử Xà Basilisk Dưới Hầm Tối',
    undercoverWord: 'Rồng Đuôi Gai Hungary Khổng Lồ',
    category: 'CREATURES',
  },
  {
    id: 'creat-24',
    studentWord: 'Sinh Vật Boggart (Ông Kẹ Biến Hình)',
    undercoverWord: 'Giám Ngục Nhà Tù Azkaban (Dementor)',
    category: 'CREATURES',
  },
  {
    id: 'creat-25',
    studentWord: 'Gia Tinh Dobby (Tự Do Mang Chiếc Tất)',
    undercoverWord: 'Gia Tinh Kreacher (Trung Thành Nhà Black)',
    category: 'CREATURES',
  },
  {
    id: 'creat-26',
    studentWord: 'Thú Mũi Dài Đào Vàng Niffler',
    undercoverWord: 'Vệ Sĩ Giữ Cây Bowtruckle (Tí Hon)',
    category: 'CREATURES',
  },
  {
    id: 'creat-27',
    studentWord: 'Nhân Mã Rừng Cấm (Centaur Thông Thái)',
    undercoverWord: 'Người Khổng Lồ Grawp (Em Trai Hagrid)',
    category: 'CREATURES',
  },
  {
    id: 'creat-28',
    studentWord: 'Chim Phượng Hoàng Fawkes Lửa Đỏ',
    undercoverWord: 'Quái Điểu Lôi Điểu (Thunderbird Sấm Sét)',
    category: 'CREATURES',
  },
];

const CUSTOM_WORDS_STORAGE_KEY = 'hogwarts_undercover_custom_words';
export const PLAYED_WORDS_STORAGE_KEY = 'hogw_played_words_history';

/**
 * Get IDs of word pairs that were already played (persisted across sessions & days)
 */
export function getPlayedWordIds(): string[] {
  try {
    const raw = localStorage.getItem(PLAYED_WORDS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

/**
 * Mark a word pair as played in persistent storage
 */
export function markWordAsPlayed(id: string): void {
  try {
    const played = getPlayedWordIds();
    if (!played.includes(id)) {
      played.push(id);
      localStorage.setItem(PLAYED_WORDS_STORAGE_KEY, JSON.stringify(played));
    }
  } catch (err) {}
}

/**
 * Reset played words history (reshuffle the full deck)
 */
export function resetPlayedWords(category?: string): void {
  try {
    if (!category || category === 'ALL') {
      localStorage.removeItem(PLAYED_WORDS_STORAGE_KEY);
    } else {
      const customPairs = getCustomWordPairs();
      const allPairs = [...DEFAULT_WORD_PAIRS, ...customPairs];
      const categoryPairIds = new Set(allPairs.filter((p) => p.category === category).map((p) => p.id));
      const played = getPlayedWordIds().filter((id) => !categoryPairIds.has(id));
      localStorage.setItem(PLAYED_WORDS_STORAGE_KEY, JSON.stringify(played));
    }
  } catch (err) {}
}

/**
 * Get statistics on how many words have been played vs remaining in the deck
 */
export function getWordDeckStats(categories: string[] = ['ALL']): {
  playedCount: number;
  totalCount: number;
  remainingCount: number;
} {
  const customPairs = getCustomWordPairs();
  let pool = [...DEFAULT_WORD_PAIRS, ...customPairs];
  const useAll = categories.length === 0 || categories.includes('ALL');
  if (!useAll) {
    pool = pool.filter((p) => categories.includes(p.category));
  }
  const playedIds = new Set(getPlayedWordIds());
  const playedCount = pool.filter((p) => playedIds.has(p.id)).length;
  const totalCount = pool.length;
  const remainingCount = Math.max(0, totalCount - playedCount);

  return { playedCount, totalCount, remainingCount };
}

export function getCustomWordPairs(): WordPair[] {
  try {
    const raw = localStorage.getItem(CUSTOM_WORDS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load custom words from localStorage:', err);
    return [];
  }
}

export function saveCustomWordPair(pair: Omit<WordPair, 'id' | 'isCustom'>): WordPair {
  const customPairs = getCustomWordPairs();
  const newPair: WordPair = {
    ...pair,
    id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    isCustom: true,
  };
  customPairs.unshift(newPair);
  localStorage.setItem(CUSTOM_WORDS_STORAGE_KEY, JSON.stringify(customPairs));
  return newPair;
}

export function deleteCustomWordPair(id: string): void {
  const customPairs = getCustomWordPairs();
  const filtered = customPairs.filter((p) => p.id !== id);
  localStorage.setItem(CUSTOM_WORDS_STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Select random word pair with ABSOLUTE ANTI-REPEAT across sessions & days
 * (Full Deck Dealing: Never repeats until all words in the pool have been played)
 */
export function selectRandomWordPair(
  categories: string[] = ['ALL'],
  sessionUsedIds: string[] = []
): WordPair {
  const customPairs = getCustomWordPairs();
  let pool = [...DEFAULT_WORD_PAIRS, ...customPairs];

  const useAll = categories.length === 0 || categories.includes('ALL');
  if (!useAll) {
    pool = pool.filter((p) => categories.includes(p.category));
  }

  if (pool.length === 0) {
    return DEFAULT_WORD_PAIRS[0];
  }

  // Combine persistent history (across days) and current session used IDs
  const persistentPlayed = new Set(getPlayedWordIds());
  const sessionPlayed = new Set(sessionUsedIds);

  // 1. First priority: Words never played across days OR session
  let candidatePool = pool.filter((p) => !persistentPlayed.has(p.id) && !sessionPlayed.has(p.id));

  // 2. If all words in this category have been played across previous days, automatically reset history for this category!
  if (candidatePool.length === 0) {
    console.log('[Words] All words in category pool have been played! Reshuffling deck...');
    resetPlayedWords(useAll ? 'ALL' : categories[0]);
    // Try to at least avoid words played in the current session
    candidatePool = pool.filter((p) => !sessionPlayed.has(p.id));
    if (candidatePool.length === 0) {
      candidatePool = pool;
    }
  }

  const randomIndex = Math.floor(Math.random() * candidatePool.length);
  const selected = candidatePool[randomIndex];

  // Persist to played history so it will NEVER repeat tomorrow or in future games
  markWordAsPlayed(selected.id);

  return selected;
}
