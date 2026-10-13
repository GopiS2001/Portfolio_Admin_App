import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState, useCallback } from 'react';
import { View, Image, Linking, Pressable, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  Chip,
  Icon,
  Dialog,
  Portal,
  Switch,
  TextInput,
  HelperText,
  RadioButton,
  TouchableRipple,
} from 'react-native-paper';

import { useAppTheme } from '@/theme';
import { uploadFile, resolveFileUrl } from '@/lib/api';

import { toast, Button, IconButton } from './ui';

// ----------------------------------------------------------------------

/** Declarative form field — one list drives the form UI, defaults and validation (same as the dashboard). */
export type FieldDef = {
  name: string;
  label: string;
  type?: 'text' | 'password' | 'textarea' | 'tags' | 'switch' | 'select' | 'image' | 'file' | 'color' | 'links';
  required?: boolean;
  helperText?: string;
  placeholder?: string;
  options?: { value: string; label: string; css?: string }[];
  rows?: number;
  /** MIME types offered by the file picker for "file" fields (default: images and PDF). */
  pickTypes?: string[];
  keyboard?: 'email-address' | 'phone-pad' | 'url';
};

export type FormValues = Record<string, any>;

/** API value -> form value. */
export function toFormValues(fields: FieldDef[], item?: Record<string, any> | null): FormValues {
  return Object.fromEntries(
    fields.map((f) => {
      const v = item?.[f.name];
      switch (f.type) {
        case 'switch':
          return [f.name, v ?? f.name === 'visible'];
        case 'tags':
        case 'links':
          return [f.name, Array.isArray(v) ? v : []];
        case 'select':
          return [f.name, v ?? f.options?.[0]?.value ?? ''];
        default:
          return [f.name, v ?? ''];
      }
    })
  );
}

/** Form value -> API value. */
export function fromFormValues(fields: FieldDef[], values: FormValues) {
  return Object.fromEntries(
    fields.map((f) => {
      const v = values[f.name];
      if (f.type === 'links') {
        // Rows without a URL are dropped; a blank label falls back to "Live site".
        const rows: { label?: string; url?: string }[] = v ?? [];
        return [
          f.name,
          rows
            .map((l) => ({ label: (l.label ?? '').trim(), url: (l.url ?? '').trim() }))
            .filter((l) => l.url)
            .map((l) => ({ ...l, label: l.label || 'Live site' })),
        ];
      }
      if (f.type === 'tags') return [f.name, (v ?? []).map((t: string) => t.trim()).filter(Boolean)];
      if (typeof v === 'string') return [f.name, v.trim()];
      return [f.name, v];
    })
  );
}

/** Form state for a list of fields, reset whenever the source record changes. */
export function useFieldForm(fields: FieldDef[], source?: Record<string, any> | null) {
  const initial = useMemo(() => toFormValues(fields, source), [fields, source]);
  const [values, setValues] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Start over when the record is (re)loaded or saved
  const [prevInitial, setPrevInitial] = useState(initial);
  if (prevInitial !== initial) {
    setPrevInitial(initial);
    setValues(initial);
    setErrors({});
  }

  const set = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev));
  }, []);

  const validate = () => {
    const next: Record<string, string> = {};
    for (const f of fields) {
      if (f.required && !String(values[f.name] ?? '').trim()) next[f.name] = `${f.label} is required`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  return {
    values,
    errors,
    set,
    validate,
    isDirty: JSON.stringify(values) !== JSON.stringify(initial),
    reset: () => setValues(initial),
    body: () => fromFormValues(fields, values),
  };
}

// ---------------------------------------------------------------------- building blocks

export function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  const theme = useAppTheme();
  return (
    <Text variant="labelLarge" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
      {label}
      {required ? <Text style={{ color: theme.colors.error }}> *</Text> : null}
    </Text>
  );
}

export function Helper({ text, error }: { text?: string; error?: string }) {
  if (!error && !text) return null;
  return (
    <HelperText type={error ? 'error' : 'info'} visible style={styles.helper}>
      {error || text}
    </HelperText>
  );
}

/** Outlined Material text field with a floating label. */
export function Input(
  props: Omit<React.ComponentProps<typeof TextInput>, 'mode' | 'error'> & { invalid?: boolean }
) {
  const theme = useAppTheme();
  const { invalid, style, multiline, ...rest } = props;
  return (
    <TextInput
      mode="outlined"
      error={invalid}
      multiline={multiline}
      outlineStyle={{ borderRadius: 14, borderWidth: 1 }}
      outlineColor={theme.colors.outline}
      activeOutlineColor={theme.colors.primary}
      placeholderTextColor={theme.colors.onSurfaceVariant}
      {...rest}
      style={[
        { backgroundColor: theme.colors.surface, fontSize: 15 },
        multiline && { minHeight: 110 },
        style,
      ]}
    />
  );
}

/** The website's gradient covers (`css` is the comma-separated colour stops). */
export function GradientSwatch({
  css,
  width = 36,
  height = 18,
  radius = 6,
}: {
  css: string;
  width?: number;
  height?: number;
  radius?: number;
}) {
  const stops = css.split(',').map((c) => c.trim()) as [string, string, ...string[]];
  return (
    <LinearGradient colors={stops} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width, height, borderRadius: radius }} />
  );
}

// ---------------------------------------------------------------------- one field

type FieldProps = {
  field: FieldDef;
  value: any;
  error?: string;
  onChange: (value: any) => void;
};

export function FormField({ field, value, error, onChange }: FieldProps) {
  switch (field.type) {
    case 'switch':
      return <SwitchRow label={field.label} helperText={field.helperText} value={!!value} onChange={onChange} />;
    case 'select':
      return <SelectField field={field} value={value} onChange={onChange} />;
    case 'tags':
      return <TagsField field={field} value={value ?? []} onChange={onChange} />;
    case 'links':
      return <LinksField field={field} value={value ?? []} onChange={onChange} />;
    case 'image':
    case 'file':
      return <UploadField field={field} value={value ?? ''} error={error} onChange={onChange} />;
    case 'color':
      return <ColorField field={field} value={value ?? ''} onChange={onChange} />;
    default:
      return (
        <View>
          <Input
            label={field.required ? `${field.label} *` : field.label}
            value={value ?? ''}
            onChangeText={onChange}
            placeholder={field.placeholder}
            multiline={field.type === 'textarea'}
            numberOfLines={field.type === 'textarea' ? field.rows ?? 3 : 1}
            invalid={!!error}
            keyboardType={field.keyboard ?? 'default'}
            secureTextEntry={field.type === 'password'}
            autoCapitalize={field.keyboard || field.type === 'password' ? 'none' : 'sentences'}
          />
          <Helper text={field.helperText} error={error} />
        </View>
      );
  }
}

/** All fields stacked, each bound to the form state. */
export function FormFields({
  fields,
  form,
}: {
  fields: FieldDef[];
  form: { values: FormValues; errors: Record<string, string>; set: (n: string, v: unknown) => void };
}) {
  return (
    <View style={{ gap: 14 }}>
      {fields.map((f) => (
        <FormField
          key={f.name}
          field={f}
          value={form.values[f.name]}
          error={form.errors[f.name]}
          onChange={(v) => form.set(f.name, v)}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------- switch

export function SwitchRow({
  label,
  helperText,
  value,
  onChange,
  disabled,
}: {
  label: string;
  helperText?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <TouchableRipple
      onPress={() => onChange(!value)}
      disabled={disabled}
      borderless
      style={[styles.switchRow, { backgroundColor: theme.custom.neutral }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall">{label}</Text>
          {helperText && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
              {helperText}
            </Text>
          )}
        </View>
        <Switch value={value} onValueChange={onChange} disabled={disabled} />
      </View>
    </TouchableRipple>
  );
}

// ---------------------------------------------------------------------- select

export function SelectField({
  field,
  value,
  onChange,
}: {
  field: Pick<FieldDef, 'label' | 'options' | 'helperText'>;
  value: string;
  onChange: (v: string) => void;
}) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const options = field.options ?? [];
  const current = options.find((o) => o.value === value);
  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <View>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={field.label}>
        {/* Decorations are plain views (not TextInput.Icon buttons) so nothing tappable nests in the field */}
        <View pointerEvents="none" style={{ justifyContent: 'center' }}>
          <Input
            label={field.label}
            value={current?.label ?? value ?? ''}
            editable={false}
            contentStyle={{ paddingLeft: current?.css ? 52 : undefined, paddingRight: 44 }}
          />
          {current?.css && (
            <View style={[styles.adornment, { left: 14 }]}>
              <GradientSwatch css={current.css} width={28} height={18} />
            </View>
          )}
          <View style={[styles.adornment, { right: 14 }]}>
            <Icon source="chevron-down" size={22} color={theme.colors.onSurfaceVariant} />
          </View>
        </View>
      </Pressable>
      <Helper text={field.helperText} />

      <Portal>
        <Dialog
          visible={open}
          onDismiss={() => setOpen(false)}
          style={{ backgroundColor: theme.colors.surface, borderRadius: 24, maxHeight: '80%' }}
        >
          <Dialog.Title>{field.label}</Dialog.Title>
          <Dialog.ScrollArea style={{ paddingHorizontal: 0, borderColor: theme.custom.divider }}>
            <ScrollView>
              <RadioButton.Group value={value} onValueChange={choose}>
                {options.map((o) => (
                  <TouchableRipple key={o.value} onPress={() => choose(o.value)}>
                    <View style={styles.option}>
                      <RadioButton value={o.value} />
                      {o.css && <GradientSwatch css={o.css} width={30} height={18} />}
                      <Text variant="bodyLarge" style={{ flex: 1 }}>
                        {o.label}
                      </Text>
                    </View>
                  </TouchableRipple>
                ))}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>
    </View>
  );
}

// ---------------------------------------------------------------------- tags

function TagsField({ field, value, onChange }: { field: FieldDef; value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState('');

  const add = (text: string) => {
    const parts = text.split(',').map((t) => t.trim()).filter(Boolean);
    const next = [...value];
    for (const p of parts) if (!next.includes(p)) next.push(p);
    onChange(next);
    setDraft('');
  };

  return (
    <View>
      <Input
        label={field.label}
        value={draft}
        onChangeText={(t) => (t.endsWith(',') ? add(t) : setDraft(t))}
        onSubmitEditing={() => add(draft)}
        onBlur={() => draft.trim() && add(draft)}
        submitBehavior="submit"
        returnKeyType="done"
        placeholder={field.placeholder ?? 'Type and press Enter'}
        right={draft.trim() ? <TextInput.Icon icon="plus-circle" onPress={() => add(draft)} /> : undefined}
      />
      {value.length > 0 && (
        <View style={styles.tagWrap}>
          {value.map((t) => (
            <Chip key={t} compact onClose={() => onChange(value.filter((x) => x !== t))} style={{ borderRadius: 10 }}>
              {t}
            </Chip>
          ))}
        </View>
      )}
      <Helper text={field.helperText ?? 'Press Enter or type a comma to add. Tap × to remove.'} />
    </View>
  );
}

// ---------------------------------------------------------------------- links

type LinkRow = { label: string; url: string };

function LinksField({ field, value, onChange }: { field: FieldDef; value: LinkRow[]; onChange: (v: LinkRow[]) => void }) {
  const theme = useAppTheme();
  const update = (i: number, patch: Partial<LinkRow>) =>
    onChange(value.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <View style={{ gap: 10 }}>
      <View>
        <Text variant="titleSmall">{field.label}</Text>
        {field.helperText && (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
            {field.helperText}
          </Text>
        )}
      </View>
      {value.map((row, i) => (
        <View key={i} style={[styles.linkRow, { backgroundColor: theme.custom.neutral }]}>
          <View style={{ flex: 1, gap: 8 }}>
            <Input
              dense
              label="Button label"
              value={row.label}
              onChangeText={(t) => update(i, { label: t })}
              placeholder="Admin dashboard"
            />
            <Input
              dense
              label="URL"
              value={row.url}
              onChangeText={(t) => update(i, { url: t })}
              placeholder="https://admin.example.com"
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
          <IconButton
            icon="trash-can-outline"
            label="Remove link"
            color={theme.colors.error}
            onPress={() => onChange(value.filter((_, j) => j !== i))}
          />
        </View>
      ))}
      <Button
        size="small"
        variant="soft"
        icon="plus"
        label="Add link"
        onPress={() => onChange([...value, { label: '', url: '' }])}
        style={{ alignSelf: 'flex-start' }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------- colour

function ColorField({ field, value, onChange }: { field: FieldDef; value: string; onChange: (v: string) => void }) {
  const theme = useAppTheme();
  const valid = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
  return (
    <View>
      <Input
        label={field.label}
        value={value}
        onChangeText={onChange}
        placeholder="#c2410c"
        autoCapitalize="none"
        autoCorrect={false}
        left={
          <TextInput.Icon
            icon={() => (
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: valid ? value : 'transparent', borderColor: theme.colors.outline },
                ]}
              />
            )}
          />
        }
      />
      <Helper text={field.helperText ?? 'Hex colour, e.g. #c2410c'} />
    </View>
  );
}

// ---------------------------------------------------------------------- upload

/** URL text field with an upload button — paste a link or upload a file from the phone. */
function UploadField({
  field,
  value,
  error,
  onChange,
}: {
  field: FieldDef;
  value: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  const theme = useAppTheme();
  const [uploading, setUploading] = useState(false);
  const isImage = field.type === 'image';

  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: field.pickTypes ?? (isImage ? ['image/*'] : ['image/*', 'application/pdf']),
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return;
    setUploading(true);
    try {
      onChange(await uploadFile(result.assets[0]));
      toast.success('File uploaded');
    } catch (e) {
      toast.error((e as Error).message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const preview = resolveFileUrl(value);
  const fileName = value ? value.split('/').pop() : 'Nothing uploaded';

  return (
    <View style={[styles.upload, { borderColor: theme.colors.outline }]}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={[styles.thumb, { backgroundColor: theme.custom.neutral }]}>
          {isImage && preview ? (
            <Image source={{ uri: preview }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Icon
              source={isImage ? 'image-outline' : value ? 'file-check-outline' : 'file-upload-outline'}
              size={26}
              color={value ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall">{field.label}</Text>
          <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
            {fileName}
          </Text>
        </View>
      </View>

      <Input
        dense
        label="URL"
        value={value}
        onChangeText={onChange}
        placeholder="https://… or upload"
        autoCapitalize="none"
        autoCorrect={false}
        invalid={!!error}
        style={{ marginTop: 12 }}
      />

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <Button
          size="small"
          variant="soft"
          icon="cloud-upload-outline"
          label={uploading ? 'Uploading…' : 'Upload'}
          loading={uploading}
          onPress={pick}
        />
        {!isImage && !!preview && (
          <Button
            size="small"
            variant="outlined"
            tone="default"
            icon="open-in-new"
            label="Open"
            onPress={() => Linking.openURL(preview)}
          />
        )}
        {!!value && (
          <Button size="small" variant="text" tone="error" icon="close" label="Clear" onPress={() => onChange('')} />
        )}
      </View>
      <Helper text={field.helperText} error={error} />
    </View>
  );
}

// ----------------------------------------------------------------------

const styles = StyleSheet.create({
  helper: { paddingHorizontal: 4, paddingTop: 2, paddingBottom: 0 },
  switchRow: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 6 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  linkRow: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 10, borderRadius: 14 },
  colorDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1 },
  upload: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, padding: 14 },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
