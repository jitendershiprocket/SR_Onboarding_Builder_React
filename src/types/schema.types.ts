// ─── Top Level Schema ────────────────────────────────────────

export interface OnboardingSchema {
  id: string;
  version: number;
  name: string;
  status: 'draft' | 'published' | 'archived';
  totalSteps: number;
  steps: OnboardingStep[];
  settings: SchemaSettings;
  styles?: SchemaStyles;
  createdAt?: string;
  updatedAt?: string;
}

export interface SchemaSettings {
  heading: string;
  submitEndpoint: string;
  bottomBarText?: string;
  bottomBarIcon?: string;
  showProgressBar: boolean;
  showBackButton: boolean;
  showLogout: boolean;
  animations: boolean;
}

// ─── Step ────────────────────────────────────────────────────

export interface OnboardingStep {
  stepId: number;
  title: string;
  subtitle?: string;
  badge?: string;
  fields: FormField[];
  submitLabel: string;
  skipOption?: SkipOption;
  autoAdvance: boolean;
  onSubmit: StepSubmitConfig;
  skipCondition?: SkipCondition;
}

export interface SkipOption {
  label: string;
  submitValue: string;
}

export interface SkipCondition {
  dependsOnStep: number;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains';
  value: string | string[];
  action: 'skip' | 'show';
}

export interface StepSubmitConfig {
  label: string;
  mapFields: string[];
  additionalApi?: string;
}

// ─── Form Fields ─────────────────────────────────────────────

export type FormField =
  | TextField
  | EmailField
  | NumberField
  | CheckboxField
  | RadioGroupField
  | CheckboxGroupField
  | ImageCardField
  | SocialInputField;

export interface BaseField {
  key: string;
  label: string;
  placeholder?: string;
  required: boolean;
  validators?: FieldValidator[];
  defaultValue?: unknown;
  helpText?: string;
  hidden?: boolean;
  visibleWhen?: FieldCondition;
}

export interface TextField extends BaseField {
  type: 'text';
  maxLength?: number;
  minLength?: number;
  linkedCheckbox?: LinkedCheckbox;
  lookupApi?: string;
  readonly?: boolean;
}

export interface EmailField extends BaseField {
  type: 'email';
  readonly?: boolean;
  forbiddenDomains?: string[];
}

export interface NumberField extends BaseField {
  type: 'number';
  min?: number;
  max?: number;
  maxLength?: number;
}

export interface CheckboxField extends BaseField {
  type: 'checkbox';
  checkedValue?: string;
  uncheckedValue?: string;
}

export interface RadioGroupField extends BaseField {
  type: 'radio-group';
  options: FieldOption[];
  autoAdvance?: boolean;
}

export interface CheckboxGroupField extends BaseField {
  type: 'checkbox-group';
  options: CheckboxGroupOption[];
  layout: 'list' | 'grid' | 'card';
  hasOther?: boolean;
  otherPlaceholder?: string;
  minSelection?: number;
  maxSelection?: number;
}

export interface ImageCardField extends BaseField {
  type: 'image-card';
  options: ImageCardOption[];
  selectionMode: 'single' | 'multiple';
  autoAdvance?: boolean;
}

export interface SocialInputField extends BaseField {
  type: 'social-input';
  platforms: SocialPlatform[];
}

// ─── Sub Types ───────────────────────────────────────────────

export interface FieldOption {
  value: string;
  label: string;
}

export interface CheckboxGroupOption {
  id: string;
  value: string;
  label: string;
  description?: string;
  icon?: string;
  logo?: string;
}

export interface ImageCardOption {
  value: string;
  label: string;
  icon: string;
  description?: string;
}

export interface SocialPlatform {
  name: string;
  key: string;
  icon: string;
  placeholder: string;
  helpText: string;
  urlPattern?: string;
}

export interface LinkedCheckbox {
  label: string;
  targetField: string;
}

export interface FieldCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'is_checked' | 'is_not_empty';
  value?: string | boolean;
}

export interface FieldValidator {
  type: 'required' | 'pattern' | 'minLength' | 'maxLength' | 'email' | 'custom';
  value?: string | number;
  message: string;
  customType?: string;
}

// ─── Styles ─────────────────────────────────────────────────

export interface SchemaStyles {
  global: GlobalStyles;
  stepOverrides?: Record<number, Partial<StepStyles>>;
}

export interface GlobalStyles extends StepStyles {
  container?: ContainerStyle;
}

export interface StepStyles {
  background?: BackgroundStyle;
  typography?: TypographyStyle;
  button?: ButtonStyle;
  card?: CardStyle;
  spacing?: SpacingStyle;
}

export interface BackgroundStyle {
  type: 'color' | 'image' | 'gradient';
  color?: string;
  image?: string;
  gradient?: string;
}

export interface TypographyStyle {
  fontFamily?: string;
  headingColor?: string;
  headingSize?: string;
  bodyColor?: string;
  bodySize?: string;
  labelColor?: string;
}

export interface ButtonStyle {
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  hoverColor?: string;
}

export interface CardStyle {
  gridColumns?: number;
  gap?: string;
  borderRadius?: string;
  borderColor?: string;
  selectedBorderColor?: string;
  selectedBgColor?: string;
}

export interface SpacingStyle {
  padding?: string;
  sectionGap?: string;
}

export interface ContainerStyle {
  maxWidth?: string;
  alignment?: 'left' | 'center' | 'right';
}

// ─── Helpers ─────────────────────────────────────────────────

export const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text Input', icon: 'text_fields' },
  { value: 'email', label: 'Email Input', icon: 'email' },
  { value: 'number', label: 'Number Input', icon: 'pin' },
  { value: 'radio-group', label: 'Radio Group', icon: 'radio_button_checked' },
  { value: 'image-card', label: 'Image Cards', icon: 'view_module' },
  { value: 'checkbox-group', label: 'Checkbox Group', icon: 'check_box' },
  { value: 'social-input', label: 'Social Media', icon: 'share' },
] as const;

export const DEFAULT_EMPTY_SCHEMA: OnboardingSchema = {
  id: '',
  version: 1,
  name: 'New Onboarding Flow',
  status: 'draft',
  totalSteps: 1,
  settings: {
    heading: 'Shipping & fulfilment in india',
    submitEndpoint: 'users/onboarding-step',
    bottomBarText: 'Deliver to 19,000+ Indian pincodes with Shiprocket',
    bottomBarIcon: 'assets/images/announcement_img.png',
    showProgressBar: true,
    showBackButton: true,
    showLogout: true,
    animations: true,
  },
  steps: [
    {
      stepId: 1,
      title: 'Tell us about yourself',
      subtitle: '',
      fields: [],
      submitLabel: 'Proceed',
      autoAdvance: false,
      onSubmit: { label: 'step_1', mapFields: [] },
    },
  ],
};
