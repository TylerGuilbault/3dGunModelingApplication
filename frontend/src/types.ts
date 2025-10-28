export type Finish = { id: string; name: string; hex: string; price: number };
export type PartOption = { id: string; name: string; price: number };
export type PartGroup = { id: string; name: string; options: PartOption[] };

export type Firearm = {
  id: string;
  name: string;
  partGroups: PartGroup[];
};

export type Catalog = { firearms: Firearm[]; finishes: Finish[] };

export type BuildConfig = {
    firearmId: string;
    parts: Record<string, string>;
    finishes: Record<string, string>; // { frame, slide, trigger, magazine }
  };
  
  
export type PriceResponse = {
  total: number;
  breakdown: { base: number; partsSum: number; finishAdd: number };
  currency: string;
  etaDays: number;
};

export type SavedConfig = BuildConfig & { id: string; createdAt: string };
