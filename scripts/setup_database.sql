-- ==============================================================================
-- UNDERCOVER HOGWARTS: DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- ==============================================================================
-- Chạy script này tại: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. ENUM TRẠNG THÁI TRÒ CHƠI
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'game_status_type') THEN
        CREATE TYPE game_status_type AS ENUM ('LOBBY', 'PLAYING', 'VOTING', 'REVEALED');
    END IF;
END $$;

-- 2. BẢNG PHÒNG CHƠI (ROOMS)
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(6) UNIQUE NOT NULL,                       -- Mã phòng 4 ký tự viết hoa (VD: 'HOGW')
    host_id VARCHAR(64) NOT NULL,                          -- ID định danh của chủ phòng
    status game_status_type NOT NULL DEFAULT 'LOBBY',      -- Trạng thái hiện tại
    config JSONB NOT NULL DEFAULT '{                       -- Cấu hình luật chơi
        "hostRole": "PLAYER",
        "undercoverCount": 1,
        "mrWhiteCount": 0,
        "selectedCategories": ["ALL"]
    }'::jsonb,
    round_number INT NOT NULL DEFAULT 1,                   -- Vòng chơi
    current_pair JSONB NULL,                               -- Cặp từ khóa (chỉ công khai khi REVEALED)
    current_speaker_id VARCHAR(64) NULL,                   -- Người chơi đang đến lượt phát biểu
    winner VARCHAR(20) NULL,                               -- Phe chiến thắng: STUDENT / DEATH_EATER / MR_WHITE
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now()    -- Dùng cho TTL cleanup phòng cũ
);

CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_activity ON public.rooms(last_activity_at);

-- 3. BẢNG NGƯỜI CHƠI TRONG PHÒNG (PLAYERS)
CREATE TABLE IF NOT EXISTS public.players (
    id VARCHAR(64) NOT NULL,                               -- Persistent Player ID
    room_code VARCHAR(6) NOT NULL REFERENCES public.rooms(code) ON DELETE CASCADE,
    name VARCHAR(40) NOT NULL,
    house VARCHAR(20) NOT NULL DEFAULT 'GRYFFINDOR',
    role VARCHAR(20) NULL,                                 -- STUDENT / DEATH_EATER / MR_WHITE
    word TEXT NULL,                                        -- Từ khóa bí mật
    hint TEXT NULL,
    is_host BOOLEAN NOT NULL DEFAULT false,
    is_ai BOOLEAN NOT NULL DEFAULT false,
    is_eliminated BOOLEAN NOT NULL DEFAULT false,
    speaking_order INT NOT NULL DEFAULT 0,
    is_online BOOLEAN NOT NULL DEFAULT true,               -- Đang active hay đang chạy ngầm/idle
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (id, room_code)
);

CREATE INDEX IF NOT EXISTS idx_players_room ON public.players(room_code);

-- 4. BẬT ROW LEVEL SECURITY (RLS)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Xóa các policy cũ nếu có để tránh trùng lặp khi chạy lại
DROP POLICY IF EXISTS "Public access to rooms" ON public.rooms;
DROP POLICY IF EXISTS "Public access to players" ON public.players;

-- Cho phép đọc / ghi dữ liệu phòng (Client tương tác qua mã phòng)
CREATE POLICY "Public access to rooms" ON public.rooms
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public access to players" ON public.players
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. BẬT REALTIME PUBLICATION CHO SUPABASE
-- Giúp máy khách tự động nhận sự kiện khi Database thay đổi (Postgres Changes)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'rooms'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'players'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
    END IF;
END $$;

-- 6. HÀM TỰ ĐỘNG DỌN DẸP PHÒNG CŨ (TTL CLEANUP)
-- Xóa các phòng không có hoạt động trong 4 tiếng
CREATE OR REPLACE FUNCTION cleanup_stale_rooms() 
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM public.rooms 
    WHERE last_activity_at < now() - INTERVAL '4 hours';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.rooms IS 'Lưu trữ ván cờ Undercover Hogwarts bền vững trên Cloud PostgreSQL';
COMMENT ON TABLE public.players IS 'Lưu trữ thông tin người chơi và thẻ bài bí mật trong từng phòng';
