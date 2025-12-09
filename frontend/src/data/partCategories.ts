export interface PartOption {
  value: string;
  label: string;
}

export interface PartCategory {
  label: string;
  options: PartOption[];
}

export const PART_CATEGORIES: PartCategory[] = [
  {
    label: "Slide Components",
    options: [
      { value: "slide_main", label: "Slide Body" },
      { value: "slide_cover_plate", label: "Slide Cover Plate" },
      { value: "slide_window", label: "Slide Window/Cut" },
      { value: "slide_serrations_front", label: "Front Serrations" },
      { value: "slide_serrations_rear", label: "Rear Serrations" },
      { value: "extractor", label: "Extractor" },
      { value: "firing_pin", label: "Firing Pin" },
      { value: "firing_pin_safety", label: "Firing Pin Safety" },
      { value: "striker", label: "Striker" },
      { value: "ejector", label: "Ejector" },
      { value: "slide_stop", label: "Slide Stop/Release Lever" },
    ],
  },
  {
    label: "Frame/Grip Components",
    options: [
      { value: "frame_main", label: "Frame Body" },
      { value: "grip_module", label: "Grip Module" },
      { value: "backstrap", label: "Backstrap" },
      { value: "grip_panel_left", label: "Grip Panel (Left)" },
      { value: "grip_panel_right", label: "Grip Panel (Right)" },
      { value: "grip_texture", label: "Grip Texturing/Stippling" },
      { value: "dust_cover", label: "Dust Cover" },
      { value: "accessory_rail", label: "Accessory Rail (Picatinny/M-LOK)" },
      { value: "trigger_guard", label: "Trigger Guard" },
      { value: "mag_well", label: "Magazine Well/Funnel" },
    ],
  },
  {
    label: "Barrel Components",
    options: [
      { value: "barrel_main", label: "Barrel Body" },
      { value: "barrel_hood", label: "Barrel Hood" },
      { value: "barrel_lug", label: "Barrel Lug" },
      { value: "chamber", label: "Chamber" },
      { value: "rifling", label: "Rifling" },
      { value: "muzzle_threads", label: "Muzzle Threads" },
      { value: "muzzle_crown", label: "Muzzle Crown" },
      { value: "compensator", label: "Compensator" },
      { value: "muzzle_brake", label: "Muzzle Brake" },
      { value: "suppressor", label: "Suppressor/Silencer" },
      { value: "thread_protector", label: "Thread Protector" },
    ],
  },
  {
    label: "Trigger Assembly",
    options: [
      { value: "trigger_main", label: "Trigger Body" },
      { value: "trigger_shoe", label: "Trigger Shoe/Face" },
      { value: "trigger_bar", label: "Trigger Bar" },
      { value: "trigger_safety", label: "Trigger Safety Lever" },
      { value: "trigger_spring", label: "Trigger Spring" },
      { value: "connector", label: "Connector" },
      { value: "cruciform", label: "Cruciform" },
      { value: "sear", label: "Sear" },
      { value: "hammer", label: "Hammer" },
      { value: "disconnector", label: "Disconnector" },
    ],
  },
  {
    label: "Sights & Optics",
    options: [
      { value: "front_sight_iron", label: "Front Iron Sight" },
      { value: "front_sight_post", label: "Front Sight Post" },
      { value: "front_sight_fiber", label: "Front Fiber Optic Sight" },
      { value: "front_sight_tritium", label: "Front Tritium Night Sight" },
      { value: "rear_sight_iron", label: "Rear Iron Sight" },
      { value: "rear_sight_notch", label: "Rear Sight Notch" },
      { value: "rear_sight_adjustable", label: "Rear Adjustable Sight" },
      { value: "rear_sight_tritium", label: "Rear Tritium Night Sight" },
      { value: "optic_mount_plate", label: "Optic Mount Plate" },
      { value: "red_dot_body", label: "Red Dot Sight Body" },
      { value: "red_dot_lens", label: "Red Dot Lens" },
      { value: "red_dot_hood", label: "Red Dot Hood" },
      { value: "scope_body", label: "Scope Body" },
      { value: "scope_mount", label: "Scope Mount" },
      { value: "scope_rings", label: "Scope Rings" },
      { value: "scope_objective", label: "Scope Objective Lens" },
      { value: "scope_ocular", label: "Scope Ocular Lens" },
      { value: "scope_turrets", label: "Scope Turrets" },
      { value: "laser_sight", label: "Laser Sight" },
    ],
  },
  {
    label: "Magazine Components",
    options: [
      { value: "magazine_body", label: "Magazine Body" },
      { value: "magazine_basepad", label: "Magazine Basepad/Floorplate" },
      { value: "magazine_follower", label: "Magazine Follower" },
      { value: "magazine_spring", label: "Magazine Spring" },
      { value: "magazine_catch", label: "Magazine Catch/Release" },
      { value: "magazine_extension", label: "Magazine Extension" },
    ],
  },
  {
    label: "Safety & Controls",
    options: [
      { value: "safety_lever", label: "Manual Safety Lever" },
      { value: "safety_thumb", label: "Thumb Safety" },
      { value: "safety_grip", label: "Grip Safety" },
      { value: "decocker", label: "Decocker Lever" },
      { value: "takedown_lever", label: "Takedown Lever/Pin" },
      { value: "slide_lock", label: "Slide Lock Lever" },
    ],
  },
  {
    label: "Internal Components",
    options: [
      { value: "recoil_spring", label: "Recoil Spring" },
      { value: "recoil_spring_guide", label: "Recoil Spring Guide Rod" },
      { value: "locking_block", label: "Locking Block" },
      { value: "cam_pin", label: "Cam Pin" },
      { value: "bolt_carrier", label: "Bolt Carrier" },
      { value: "bolt", label: "Bolt" },
      { value: "gas_piston", label: "Gas Piston" },
      { value: "gas_block", label: "Gas Block" },
    ],
  },
  {
    label: "Pins & Hardware",
    options: [
      { value: "pin_trigger", label: "Trigger Pin" },
      { value: "pin_slide_stop", label: "Slide Stop Pin" },
      { value: "pin_takedown", label: "Takedown Pin" },
      { value: "pin_roll", label: "Roll Pin" },
      { value: "screw", label: "Screw/Fastener" },
      { value: "spring", label: "Spring (Generic)" },
      { value: "detent", label: "Detent" },
    ],
  },
  {
    label: "Stock & Furniture",
    options: [
      { value: "stock_body", label: "Stock Body" },
      { value: "buttpad", label: "Buttpad/Recoil Pad" },
      { value: "cheek_rest", label: "Cheek Rest" },
      { value: "handguard", label: "Handguard/Forend" },
      { value: "pistol_grip", label: "Pistol Grip" },
      { value: "fore_grip", label: "Fore Grip/Vertical Grip" },
      { value: "sling_mount", label: "Sling Mount/Swivel" },
      { value: "qd_socket", label: "QD (Quick Detach) Socket" },
    ],
  },
  {
    label: "Accessories",
    options: [
      { value: "light_body", label: "Weapon Light Body" },
      { value: "light_lens", label: "Weapon Light Lens" },
      { value: "light_mount", label: "Light Mount" },
      { value: "flashlight_switch", label: "Flashlight Pressure Switch" },
      { value: "bipod", label: "Bipod" },
      { value: "sling", label: "Sling" },
      { value: "case_deflector", label: "Brass Deflector/Case Deflector" },
    ],
  },
  {
    label: "Miscellaneous",
    options: [
      { value: "charging_handle", label: "Charging Handle" },
      { value: "buffer_tube", label: "Buffer Tube" },
      { value: "buffer", label: "Buffer" },
      { value: "buffer_spring", label: "Buffer Spring" },
      { value: "endplate", label: "Endplate" },
      { value: "castle_nut", label: "Castle Nut" },
      { value: "other", label: "Other/Custom Part" },
    ],
  },
];

// Helper to get label for a part value
export function getPartLabel(value: string): string {
  for (const category of PART_CATEGORIES) {
    const option = category.options.find(opt => opt.value === value);
    if (option) return option.label;
  }
  return value;
}

// Get category for a part value
export function getPartCategory(value: string): string | null {
  for (const category of PART_CATEGORIES) {
    const found = category.options.find(opt => opt.value === value);
    if (found) return category.label;
  }
  return null;
}