import { MEDIA_BUCKET, supabase } from "./supabase-config.js";

export const STATUSES = ["遊玩中", "暫停", "已完成", "封存"];

export function formatDate(value) {
  if (!value) {
    return "剛剛";
  }

  return new Intl.DateTimeFormat("zh-Hant", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toMapByGameId(rows) {
  return rows.reduce((map, row) => {
    if (!map.has(row.game_id)) {
      map.set(row.game_id, []);
    }
    map.get(row.game_id).push(row);
    return map;
  }, new Map());
}

async function getStorageOwnerId() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("請先登入後再上傳檔案。");
  }

  return data.user.id;
}

export async function listGames() {
  const { data: games, error: gameError } = await supabase
    .from("games")
    .select("*")
    .order("updated_at", { ascending: false });

  if (gameError) {
    throw gameError;
  }

  const gameIds = games.map((game) => game.id);

  if (!gameIds.length) {
    return [];
  }

  const [notesResult, memoriesResult] = await Promise.all([
    supabase.from("notes").select("*").in("game_id", gameIds),
    supabase.from("memories").select("*").in("game_id", gameIds),
  ]);

  if (notesResult.error) throw notesResult.error;
  if (memoriesResult.error) throw memoriesResult.error;

  const notesByGame = toMapByGameId(notesResult.data || []);
  const memoriesByGame = toMapByGameId(memoriesResult.data || []);

  return games.map((game) => ({
    ...game,
    notes: notesByGame.get(game.id) || [],
    memories: memoriesByGame.get(game.id) || [],
  }));
}

export async function getGame(gameId) {
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();

  if (gameError) {
    if (gameError.code === "PGRST116") {
      return null;
    }
    throw gameError;
  }

  const [notesResult, memoriesResult] = await Promise.all([
    supabase.from("notes").select("*").eq("game_id", gameId).order("created_at", { ascending: false }),
    supabase.from("memories").select("*").eq("game_id", gameId).order("created_at", { ascending: false }),
  ]);

  if (notesResult.error) throw notesResult.error;
  if (memoriesResult.error) throw memoriesResult.error;

  return {
    ...game,
    notes: notesResult.data || [],
    memories: memoriesResult.data || [],
  };
}

export async function createGame({ title, platform, status }) {
  const { data, error } = await supabase
    .from("games")
    .insert({
      title,
      platform: platform || "未設定平台",
      status: status || "遊玩中",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateGame(gameId, values) {
  const { error } = await supabase
    .from("games")
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq("id", gameId);

  if (error) throw error;
}

export async function deleteGame(game) {
  const storagePaths = [
    game.cover_storage_path,
    ...(game.notes || []).map((note) => note.storage_path),
    ...(game.memories || []).map((memory) => memory.storage_path),
  ].filter(Boolean);

  const { error } = await supabase
    .from("games")
    .delete()
    .eq("id", game.id);

  if (error) throw error;

  if (storagePaths.length) {
    await supabase.storage.from(MEDIA_BUCKET).remove(storagePaths);
  }
}

export async function uploadGameCover(game, file) {
  const ownerId = await getStorageOwnerId();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-") || "cover";
  const path = `${ownerId}/${game.id}/cover-${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("games")
    .update({
      cover_url: data.publicUrl,
      cover_storage_path: path,
      updated_at: new Date().toISOString(),
    })
    .eq("id", game.id);

  if (updateError) throw updateError;

  if (game.cover_storage_path) {
    await supabase.storage.from(MEDIA_BUCKET).remove([game.cover_storage_path]);
  }
}

export async function addNote(gameId, { title, content, noteType = "text", file = null, videoUrl = "" }) {
  const note = {
    game_id: gameId,
    title,
    content,
    note_type: noteType,
  };

  if (noteType === "video" && videoUrl.trim()) {
    note.file_type = "external-url";
    note.public_url = videoUrl.trim();
  }

  if (file instanceof File && file.size) {
    const ownerId = await getStorageOwnerId();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-") || `${noteType}-note`;
    const path = `${ownerId}/${gameId}/notes/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);

    note.file_type = file.type;
    note.storage_path = path;
    note.public_url = data.publicUrl;
  }

  const { error } = await supabase
    .from("notes")
    .insert(note);

  if (error) throw error;
  await touchGame(gameId);
}

export async function deleteNote(note, gameId) {
  const { error } = await supabase.from("notes").delete().eq("id", note.id);
  if (error) throw error;

  if (note.storage_path) {
    await supabase.storage.from(MEDIA_BUCKET).remove([note.storage_path]);
  }

  await touchGame(gameId);
}

export async function updateNote(note, gameId, { title, content, videoUrl = "" }) {
  const values = {
    title,
    content,
  };

  if (note.note_type === "video" && note.file_type === "external-url") {
    values.public_url = videoUrl.trim();
  }

  const { error } = await supabase
    .from("notes")
    .update(values)
    .eq("id", note.id);

  if (error) throw error;
  await touchGame(gameId);
}

export async function uploadMemory(gameId, {
  file = null,
  customName = "",
  description = "",
  memoryType = "image",
  linkUrl = "",
}) {
  const memory = {
    game_id: gameId,
    name: customName.trim() || "未命名紀念",
    description,
    media_type: memoryType,
    file_type: "",
    storage_path: "",
    public_url: "",
  };

  if (memoryType === "link") {
    memory.name = customName.trim() || linkUrl.trim() || "未命名連結";
    memory.file_type = "external-url";
    memory.public_url = linkUrl.trim();
  } else if (file instanceof File && file.size) {
    const ownerId = await getStorageOwnerId();
    const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${ownerId}/${gameId}/${Date.now()}-${safeName || `memory.${extension}`}`;

    const { error: uploadError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);

    memory.name = customName.trim() || file.name;
    memory.file_type = file.type;
    memory.storage_path = path;
    memory.public_url = data.publicUrl;
  }

  const { error: insertError } = await supabase.from("memories").insert(memory);

  if (insertError) throw insertError;
  await touchGame(gameId);
}

export async function deleteMemory(memory, gameId) {
  const { error: deleteError } = await supabase.from("memories").delete().eq("id", memory.id);
  if (deleteError) throw deleteError;

  if (memory.storage_path) {
    await supabase.storage.from(MEDIA_BUCKET).remove([memory.storage_path]);
  }

  await touchGame(gameId);
}

export async function updateMemory(memory, gameId, { name, description, linkUrl = "" }) {
  const values = {
    name,
    description,
  };

  if (memory.media_type === "link") {
    values.public_url = linkUrl.trim();
  }

  const { error } = await supabase
    .from("memories")
    .update(values)
    .eq("id", memory.id);

  if (error) throw error;
  await touchGame(gameId);
}

export async function touchGame(gameId) {
  const { error } = await supabase
    .from("games")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", gameId);

  if (error) throw error;
}
