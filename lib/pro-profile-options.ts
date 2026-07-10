// Chip options for the progressive professional-profile capture
// (ONBOARDING-FRICTION-SPEC.md #5 / AUDIENCE-INTELLIGENCE-SPEC.md).
// role_category/industry/company_size values must match the Postgres
// enums in supabase/migrations/0016_pro_profile_fields.sql exactly.

export const ROLE_CATEGORY_OPTIONS = [
  { value: "founder_owner",      label: "Founder / Owner" },
  { value: "executive",          label: "Executive" },
  { value: "marketing",          label: "Marketing" },
  { value: "sales_bd",           label: "Sales / BD" },
  { value: "consultant_coach",   label: "Consultant / Coach" },
  { value: "engineering_data",   label: "Engineering / Data" },
  { value: "product_design",     label: "Product / Design" },
  { value: "operations",         label: "Operations" },
  { value: "hr_recruiting",      label: "HR / Recruiting" },
  { value: "finance_legal",      label: "Finance / Legal" },
  { value: "content_creator",    label: "Content Creator" },
  { value: "student",            label: "Student" },
  { value: "other",              label: "Other" },
] as const;

export const INDUSTRY_OPTIONS = [
  { value: "agency_consulting",    label: "Agency / Consulting" },
  { value: "saas_tech",            label: "SaaS / Tech" },
  { value: "ecommerce_retail",     label: "Ecommerce / Retail" },
  { value: "coaching_education",   label: "Coaching / Education" },
  { value: "health_wellness",      label: "Health / Wellness" },
  { value: "finance_insurance",    label: "Finance / Insurance" },
  { value: "real_estate",          label: "Real Estate" },
  { value: "legal",                label: "Legal" },
  { value: "marketing_media",      label: "Marketing / Media" },
  { value: "manufacturing_trades", label: "Manufacturing / Trades" },
  { value: "nonprofit",            label: "Nonprofit" },
  { value: "other",                label: "Other" },
] as const;

export const COMPANY_SIZE_OPTIONS = [
  { value: "solo",       label: "Just me" },
  { value: "s2_10",      label: "2–10" },
  { value: "s11_50",     label: "11–50" },
  { value: "s51_200",    label: "51–200" },
  { value: "s201_1000",  label: "201–1,000" },
  { value: "s1000_plus", label: "1,000+" },
] as const;

// Not a DB enum — goals is a free-form text[], these are just curated
// suggestions rendered as chips. Selecting one stores its exact label.
export const GOAL_OPTIONS = [
  "Save time on repetitive writing",
  "Improve output quality",
  "Onboard or train my team",
  "Build a personal prompt library",
  "Monetize my own prompts",
  "Keep up with new AI tools",
] as const;
