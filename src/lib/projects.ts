// A looping demo video, or a still screenshot where no recording fits.
export type Media =
  | {
      kind: "video";
      // Base path under /projects/: <name>.webm, <name>.mp4 and <name>-poster.jpg.
      name: string;
      width: number;
      height: number;
    }
  | {
      kind: "image";
      // File under /projects/.
      file: string;
      alt: string;
      width: number;
      height: number;
    };

export interface Link {
  label: string;
  href: string;
}

export interface Project {
  name: string;
  line: string;
  badge?: string;
  facts?: readonly string[];
  tags: readonly string[];
  links: readonly Link[];
  media: Media;
}

// The first project is featured; the rest form the grid below it.
export const projects: readonly Project[] = [
  {
    name: "Folio",
    badge: "Private beta",
    line: "Tasks, calendar and an AI assistant in one private place.",
    facts: [
      "Booking invites land in Google Calendar",
      "Google Drive files, your own AI key",
      "Next.js, Postgres and Cloudflare Workers",
    ],
    tags: ["Next.js", "AI SDK", "Postgres", "Workers"],
    links: [{ label: "Live site", href: "https://folio.tonekyilay.com" }],
    media: { kind: "video", name: "folio", width: 960, height: 600 },
  },
  {
    name: "Movie Recommender",
    line: "Pick a film and get the 50 closest by content, from a model built in Python.",
    tags: ["Python", "scikit-learn", "Cloudflare"],
    links: [
      { label: "Try it", href: "https://movies.aungkokolwin.workers.dev" },
      { label: "Code", href: "https://github.com/aakwat/movie-recommender-system-python" },
    ],
    media: { kind: "video", name: "movies", width: 960, height: 600 },
  },
  {
    name: "FortiPass",
    line: "A password manager for the terminal, written in Rust.",
    tags: ["Rust", "CLI", "Crypto"],
    links: [{ label: "Code", href: "https://github.com/aakwat/fortipass" }],
    media: { kind: "video", name: "fortipass", width: 600, height: 374 },
  },
  {
    name: "Korean to Romaji",
    line: "Turns Hangul into romanised text, so it is easy to read aloud.",
    tags: ["Rust", "WebAssembly", "Yew"],
    links: [{ label: "Code", href: "https://github.com/aakwat/korean-romanization-converter" }],
    media: {
      kind: "image",
      file: "korean-to-romaji.png",
      alt: "The converter on a phone, turning 안녕 into annyeong",
      width: 404,
      height: 374,
    },
  },
];
