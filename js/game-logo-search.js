const WIKIPEDIA_ENDPOINTS = [
  "https://zh.wikipedia.org/w/api.php",
  "https://en.wikipedia.org/w/api.php",
];

function buildSearchUrl(endpoint, title) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrsearch: `${title} video game logo`,
    gsrlimit: "5",
    prop: "pageimages",
    pithumbsize: "720",
  });

  return `${endpoint}?${params.toString()}`;
}

function pickBestImage(pages = {}) {
  return Object.values(pages)
    .map((page) => page.thumbnail?.source)
    .find(Boolean) || "";
}

export async function findGameLogoUrl(title) {
  const keyword = title.trim();

  if (!keyword) {
    return "";
  }

  for (const endpoint of WIKIPEDIA_ENDPOINTS) {
    try {
      const response = await fetch(buildSearchUrl(endpoint, keyword));

      if (!response.ok) {
        continue;
      }

      const result = await response.json();
      const imageUrl = pickBestImage(result.query?.pages);

      if (imageUrl) {
        return imageUrl;
      }
    } catch (error) {
      console.warn("自動搜尋遊戲圖片失敗", error);
    }
  }

  return "";
}
