import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, User, Users, Heart, Wand2, RotateCcw } from "lucide-react";
import { AuroraGradient, CinematicButton, PosterPreviewCard, PortalLoadingOverlay } from "@/components/eku";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChildProfile, createJob } from "@/lib/jobStore";
import { saveDraft, loadDraft, clearDraft } from "@/lib/storage";
import { toast } from "sonner";

const STEPS = ["Child Basics", "Family & Friends", "Favorites & Traits", "Adventure Setup"];
const READING_LEVELS = ["Preschool", "Early Reader", "Chapter"];
const THEMES = ["Space Quest", "Magic Forest", "Ocean Voyage", "Super Builders", "Dino Discovery"];
const FAVORITES = ["Dinosaurs", "Space", "Princess", "Robots", "Cars", "Animals", "Music", "Sports", "Art", "Cooking"];
const ROLES = ["Mom", "Dad", "Sister", "Brother", "Friend", "Pet", "Grandma", "Grandpa"];
const MOODS = ["Calm", "Excited", "Silly"];
const LESSONS = ["Sharing", "Confidence", "Numbers", "Reading", "Friendship", "Kindness"];

const defaultProfile: ChildProfile = {
  childName: "",
  age: 5,
  readingLevel: "Early Reader",
  pronouns: "",
  familyFriends: [],
  favorites: [],
  personality: { brave: 50, curious: 50, funny: 50, kind: 50, adventurous: 50 },
  mood: "Excited",
  theme: "Space Quest",
  setting: "",
  lessonFocus: "",
};

export default function CreateWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ChildProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [newFriend, setNewFriend] = useState({ name: "", role: "Friend" });

  useEffect(() => {
    const draft = loadDraft();
    if (draft) setProfile({ ...defaultProfile, ...draft });
  }, []);

  useEffect(() => {
    saveDraft(profile);
  }, [profile]);

  const updateProfile = (updates: Partial<ChildProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    if (step === 0) return profile.childName.trim() && profile.age >= 3 && profile.age <= 12;
    if (step === 2) return profile.favorites.length >= 3;
    return true;
  };

  const handleGenerate = () => {
    if (!canProceed()) return;
    setIsLoading(true);
    const jobId = createJob(profile);
    clearDraft();
    setTimeout(() => navigate(`/create/status?jobId=${jobId}`), 1500);
  };

  const handleReset = () => {
    setProfile(defaultProfile);
    clearDraft();
    setStep(0);
    toast.success("Wizard reset!");
  };

  const addFriend = () => {
    if (newFriend.name && profile.familyFriends.length < 6) {
      updateProfile({ familyFriends: [...profile.familyFriends, { ...newFriend }] });
      setNewFriend({ name: "", role: "Friend" });
    }
  };

  const removeFriend = (index: number) => {
    updateProfile({ familyFriends: profile.familyFriends.filter((_, i) => i !== index) });
  };

  const toggleFavorite = (fav: string) => {
    const has = profile.favorites.includes(fav);
    if (has) {
      updateProfile({ favorites: profile.favorites.filter(f => f !== fav) });
    } else if (profile.favorites.length < 8) {
      updateProfile({ favorites: [...profile.favorites, fav] });
    }
  };

  const getTagline = () => {
    const moodMap: Record<string, string> = {
      Calm: "A peaceful journey",
      Excited: "An epic adventure",
      Silly: "A hilarious quest",
    };
    const base = moodMap[profile.mood] || "An amazing adventure";
    return profile.lessonFocus ? `${base} about ${profile.lessonFocus.toLowerCase()}` : base;
  };

  return (
    <div className="relative min-h-screen">
      <AuroraGradient intensity="low" />
      <PortalLoadingOverlay isOpen={isLoading} message="Opening your adventure portal..." />

      <div className="relative z-10 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl md:text-4xl font-bold aurora-text mb-2">Adventure Forge</h1>
            <p className="text-muted-foreground">Create a personalized story for your child</p>
          </div>

          {/* Progress Stepper */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => (
                <div key={i} className="flex items-center">
                  <motion.div
                    animate={{ scale: i === step ? 1.1 : 1 }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      i < step ? "bg-primary text-primary-foreground" :
                      i === step ? "bg-primary text-primary-foreground glow-button" :
                      "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </motion.div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-8 h-1 mx-1 rounded ${i < step ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Form */}
            <div className="glass-card p-6 md:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="font-heading text-xl font-bold mb-6 flex items-center gap-2">
                    {step === 0 && <><User className="w-5 h-5 text-primary" /> Child Basics</>}
                    {step === 1 && <><Users className="w-5 h-5 text-primary" /> Family & Friends</>}
                    {step === 2 && <><Heart className="w-5 h-5 text-primary" /> Favorites & Traits</>}
                    {step === 3 && <><Wand2 className="w-5 h-5 text-primary" /> Adventure Setup</>}
                  </h2>

                  {step === 0 && (
                    <div className="space-y-6">
                      <div>
                        <Label>Child's Name *</Label>
                        <Input value={profile.childName} onChange={e => updateProfile({ childName: e.target.value })} placeholder="Enter name" className="mt-2" />
                      </div>
                      <div>
                        <Label>Age (3-12) *</Label>
                        <Input type="number" min={3} max={12} value={profile.age} onChange={e => updateProfile({ age: parseInt(e.target.value) || 5 })} className="mt-2" />
                      </div>
                      <div>
                        <Label>Reading Level</Label>
                        <Select value={profile.readingLevel} onValueChange={v => updateProfile({ readingLevel: v })}>
                          <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {READING_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Pronouns (optional)</Label>
                        <Input value={profile.pronouns} onChange={e => updateProfile({ pronouns: e.target.value })} placeholder="e.g., she/her" className="mt-2" />
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-6">
                      <p className="text-sm text-muted-foreground">Add up to 6 family members or friends to appear in the story.</p>
                      <div className="flex gap-2">
                        <Input value={newFriend.name} onChange={e => setNewFriend(p => ({ ...p, name: e.target.value }))} placeholder="Name" className="flex-1" />
                        <Select value={newFriend.role} onValueChange={v => setNewFriend(p => ({ ...p, role: v }))}>
                          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button onClick={addFriend} disabled={!newFriend.name || profile.familyFriends.length >= 6}>Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.familyFriends.map((f, i) => (
                          <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeFriend(i)}>
                            {f.name} ({f.role}) ×
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      <div>
                        <Label>Favorites (pick 3-8) *</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {FAVORITES.map(f => (
                            <Badge key={f} variant={profile.favorites.includes(f) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleFavorite(f)}>
                              {f}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <Label>Personality</Label>
                        {(Object.keys(profile.personality) as Array<keyof typeof profile.personality>).map(trait => (
                          <div key={trait} className="space-y-2">
                            <div className="flex justify-between text-sm"><span className="capitalize">{trait}</span><span>{profile.personality[trait]}%</span></div>
                            <Slider value={[profile.personality[trait]]} onValueChange={([v]) => updateProfile({ personality: { ...profile.personality, [trait]: v } })} max={100} />
                          </div>
                        ))}
                      </div>
                      <div>
                        <Label>Mood</Label>
                        <div className="flex gap-2 mt-2">
                          {MOODS.map(m => (
                            <Badge key={m} variant={profile.mood === m ? "default" : "outline"} className="cursor-pointer" onClick={() => updateProfile({ mood: m })}>
                              {m}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6">
                      <div>
                        <Label>Theme *</Label>
                        <Select value={profile.theme} onValueChange={v => updateProfile({ theme: v })}>
                          <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                          <SelectContent>{THEMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Setting (optional)</Label>
                        <Input value={profile.setting} onChange={e => updateProfile({ setting: e.target.value })} placeholder="Where does it happen?" className="mt-2" />
                      </div>
                      <div>
                        <Label>Lesson Focus (optional)</Label>
                        <Select value={profile.lessonFocus || ""} onValueChange={v => updateProfile({ lessonFocus: v })}>
                          <SelectTrigger className="mt-2"><SelectValue placeholder="Choose a lesson" /></SelectTrigger>
                          <SelectContent>{LESSONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <div className="flex gap-2">
                  {step > 0 && <Button variant="ghost" onClick={() => setStep(s => s - 1)}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>}
                  <Dialog>
                    <DialogTrigger asChild><Button variant="ghost" size="icon"><RotateCcw className="w-4 h-4" /></Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Reset Wizard?</DialogTitle><DialogDescription>This will clear all your progress.</DialogDescription></DialogHeader>
                      <DialogFooter><Button variant="destructive" onClick={handleReset}>Reset</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                {step < 3 ? (
                  <CinematicButton onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
                    Next <ChevronRight className="w-4 h-4" />
                  </CinematicButton>
                ) : (
                  <CinematicButton onClick={handleGenerate} disabled={!canProceed()}>
                    <Sparkles className="w-4 h-4" /> Generate Adventure
                  </CinematicButton>
                )}
              </div>
            </div>

            {/* Live Preview */}
            <div className="hidden lg:block">
              <PosterPreviewCard
                title={profile.childName ? `${profile.childName}'s ${profile.theme}` : "Your Adventure Awaits"}
                tagline={getTagline()}
                theme={profile.theme}
                childName={profile.childName}
                className="w-full max-w-sm mx-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}