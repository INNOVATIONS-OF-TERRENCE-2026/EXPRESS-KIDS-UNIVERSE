// Mock job store and story generation
export interface ChildProfile {
  childName: string;
  age: number;
  readingLevel: string;
  pronouns?: string;
  familyFriends: Array<{ name: string; role: string }>;
  favorites: string[];
  personality: { brave: number; curious: number; funny: number; kind: number; adventurous: number };
  mood: string;
  theme: string;
  setting: string;
  lessonFocus?: string;
}

export interface StoryResult {
  storyTitle: string;
  storyText: string;
  scenes: Array<{ id: string; caption: string; imageUrl?: string }>;
  meta: { childName: string; theme: string; readingLevel: string };
}

export interface Job {
  id: string;
  status: "queued" | "running" | "done" | "failed";
  profile: ChildProfile;
  result?: StoryResult;
  error?: string;
  createdAt: number;
}

const jobs: Map<string, Job> = new Map();

export function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createJob(profile: ChildProfile): string {
  const jobId = generateJobId();
  const job: Job = {
    id: jobId,
    status: "queued",
    profile,
    createdAt: Date.now(),
  };
  jobs.set(jobId, job);

  // Simulate async processing
  setTimeout(() => {
    const j = jobs.get(jobId);
    if (j) j.status = "running";
  }, 1000);

  setTimeout(() => {
    const j = jobs.get(jobId);
    if (j) {
      j.status = "done";
      j.result = generateMockStory(profile);
    }
  }, 4000);

  return jobId;
}

export function getJob(jobId: string): Job | undefined {
  return jobs.get(jobId);
}

function generateMockStory(profile: ChildProfile): StoryResult {
  const { childName, theme, readingLevel, mood, lessonFocus, familyFriends } = profile;
  
  const titles: Record<string, string> = {
    "Space Quest": `${childName}'s Galactic Adventure`,
    "Magic Forest": `${childName} and the Enchanted Woods`,
    "Ocean Voyage": `${childName}'s Deep Sea Discovery`,
    "Super Builders": `${childName}: Master Builder`,
    "Dino Discovery": `${childName} Meets the Dinosaurs`,
  };

  const storyTitle = titles[theme] || `${childName}'s Amazing Adventure`;
  
  const friend = familyFriends[0]?.name || "a new friend";
  const lesson = lessonFocus || "being brave";
  
  const storyText = `Once upon a time, there was a wonderful child named ${childName}. ${childName} was feeling ${mood.toLowerCase()} today and ready for an adventure!\n\nOne magical morning, ${childName} discovered a mysterious portal in the backyard. With a deep breath and a courageous heart, ${childName} stepped through...\n\nOn the other side was an incredible world of ${theme.toLowerCase()}! ${childName} met ${friend}, who became a loyal companion on this journey.\n\nTogether, they faced exciting challenges and learned about ${lesson}. ${childName} discovered that the greatest adventures come from being true to yourself.\n\nAs the sun set on this magical day, ${childName} returned home with wonderful memories and new wisdom. The end... or is it just the beginning?`;

  const scenes = [
    { id: "1", caption: `${childName} discovers the magical portal` },
    { id: "2", caption: `Entering the world of ${theme}` },
    { id: "3", caption: `Meeting ${friend} for the first time` },
    { id: "4", caption: `The big adventure begins!` },
    { id: "5", caption: `${childName} learns about ${lesson}` },
    { id: "6", caption: `Returning home as a hero` },
  ];

  return {
    storyTitle,
    storyText,
    scenes,
    meta: { childName, theme, readingLevel },
  };
}