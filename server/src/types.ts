export type GroundingSource = {
  title: string;
  url: string;
};

export type DorkItem = {
  dork: string;
  description: string;
};

export type AIResponse = {
  type: "chat" | "dorks";
  message: string;
  dorks?: DorkItem[];
  sources?: GroundingSource[];
};
