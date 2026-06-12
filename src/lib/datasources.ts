export interface FieldDef { key: string; label: string }
export interface DataSource {
  id: string;
  label: string;
  url: string;
  fields: FieldDef[];
  parse: (raw: any) => Array<{ name: string; values: Record<string, number> }>;
}

export const DATA_SOURCES: DataSource[] = [
  {
    id: "pokeapi",
    label: "PokéAPI",
    url: "https://pokeapi.co/api/v2/pokemon?limit=100",
    fields: [
      { key: "base_experience", label: "Experiência base" },
      { key: "weight", label: "Peso" },
      { key: "height", label: "Altura" },
    ],
    parse: async (raw: any) => {
      // raw.results = [{name, url}]
      const items = await Promise.all(
        raw.results.slice(0, 60).map(async (r: any) => {
          const res = await fetch(r.url);
          const d = await res.json();
          return {
            name: d.name,
            values: {
              base_experience: d.base_experience ?? 0,
              weight: d.weight ?? 0,
              height: d.height ?? 0,
            },
          };
        })
      );
      return items;
    },
  },
  {
    id: "countries",
    label: "Países (World Bank)",
    url: "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2022&per_page=400",
    fields: [
      { key: "population", label: "População" },
      { key: "year", label: "Ano" },
    ],
    parse: (raw: any) => {
      const rows: any[] = Array.isArray(raw) && Array.isArray(raw[1]) ? raw[1] : [];
      return rows
        .filter((r) => r && r.value != null && r.country?.value && r.countryiso3code)
        .slice(0, 80)
        .map((r) => ({
          name: r.country.value,
          values: { population: Number(r.value) || 0, year: Number(r.date) || 0 },
        }));
    },
  },

  {
    id: "rickmorty",
    label: "Rick and Morty",
    url: "https://rickandmortyapi.com/api/character",
    fields: [
      { key: "episodes", label: "Nº episódios" },
      { key: "id", label: "ID" },
    ],
    parse: (raw: any) =>
      raw.results.map((c: any) => ({
        name: c.name,
        values: { episodes: c.episode?.length ?? 0, id: c.id },
      })),
  },
  {
    id: "tvmaze",
    label: "TVMaze",
    url: "https://api.tvmaze.com/shows",
    fields: [
      { key: "rating", label: "Avaliação" },
      { key: "weight", label: "Popularidade" },
    ],
    parse: (raw: any[]) =>
      raw.slice(0, 80).map((s) => ({
        name: s.name,
        values: { rating: Math.round((s.rating?.average ?? 0) * 10), weight: s.weight ?? 0 },
      })),
  },
  {
    id: "ghibli",
    label: "Studio Ghibli",
    url: "https://ghibliapi.vercel.app/films",
    fields: [
      { key: "year", label: "Ano" },
      { key: "score", label: "Avaliação (RT)" },
      { key: "duration", label: "Duração (min)" },
    ],
    parse: (raw: any[]) =>
      raw.map((f) => ({
        name: f.title,
        values: {
          year: Number(f.release_date) || 0,
          score: Number(f.rt_score) || 0,
          duration: Number(f.running_time) || 0,
        },
      })),
  },
];

export async function loadDataSource(src: DataSource) {
  const res = await fetch(src.url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const parsed = await src.parse(json);
  return parsed;
}
