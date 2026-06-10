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
    label: "REST Countries",
    url: "https://restcountries.com/v3.1/all?fields=name,population,area",
    fields: [
      { key: "population", label: "População" },
      { key: "area", label: "Área (km²)" },
    ],
    parse: (raw: any[]) =>
      raw.slice(0, 80).map((c) => ({
        name: c.name?.common ?? "?",
        values: { population: c.population ?? 0, area: c.area ?? 0 },
      })),
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
        values: { rating: (s.rating?.average ?? 0) * 10, weight: s.weight ?? 0 },
      })),
  },
  {
    id: "spacex",
    label: "SpaceX Launches",
    url: "https://api.spacexdata.com/v4/launches",
    fields: [
      { key: "date_unix", label: "Data (unix)" },
      { key: "flight_number", label: "Nº de voo" },
    ],
    parse: (raw: any[]) =>
      raw.slice(0, 80).map((l) => ({
        name: l.name,
        values: { date_unix: Math.floor((l.date_unix ?? 0) / 100000), flight_number: l.flight_number ?? 0 },
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
