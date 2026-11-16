export type FieldType =
  | "short_text" | "long_text" | "number" | "dropdown"
  | "multiple_choice" | "checkboxes" | "yes_no" | "date";

export const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "dropdown", label: "Dropdown" },
  { value: "multiple_choice", label: "Multiple choice (pick one)" },
  { value: "checkboxes", label: "Checkboxes (pick many)" },
  { value: "yes_no", label: "Yes / No" },
  { value: "date", label: "Date" },
];

export const CHOICE_TYPES: FieldType[] = ["dropdown", "multiple_choice", "checkboxes"];

export interface FormField {
  id?: string;
  key: string;
  label: string;
  help_text: string | null;
  type: FieldType;
  options: string[];
  required: boolean;
  enabled: boolean;
  sort_order: number;
}

export interface Settings {
  event_name: string;
  event_date: string;
  minor_age: number;
  require_guardian_ack: boolean;
}
