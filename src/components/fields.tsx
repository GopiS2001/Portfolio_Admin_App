import * as DocumentPicker from 'expo-document-picker';
import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  Switch,
  Linking,
  Pressable,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';

import { colors, radius } from '@/theme';
import { uploadFile, resolveFileUrl } from '@/lib/api';

import { Icon, toast, Button, IconButton } from './ui';

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
  return (
    <Text style={styles.label}>
      {label}
      {required ? <Text style={{ color: colors.error }}> *</Text> : null}
    </Text>
  );
}

export function Helper({ text, error }: { text?: string; error?: string }) {
  if (!error && !text) return null;
  return <Text style={[styles.helper, error ? { color: colors.error } : null]}>{error || text}</Text>;
}

export function Input(props: React.ComponentProps<typeof TextInput> & { invalid?: boolean }) {
  const { invalid, style, ...rest } = props;
  return (
    <TextInput
      placeholderTextColor={colors.textDisabled}
      {...rest}
      style={[
        styles.input,
        rest.multiline && { minHeight: 96, textAlignVertical: 'top', paddingTop: 12 },
        invalid && { borderColor: colors.error },
        style,
      ]}
    />
  );
}

/** Three colour stripes standing in for a CSS gradient. */
export function GradientSwatch({ css, width = 36, height = 18 }: { css: string; width?: number; height?: number }) {
  const stops = css.split(',').map((c) => c.trim());
  return (
    <View style={{ width, height, borderRadius: 5, overflow: 'hidden', flexDirection: 'row' }}>
      {stops.map((c, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: c }} />
      ))}
    </View>
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
      return (
        <Pressable style={styles.switchRow} onPress={() => onChange(!value)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>{field.label}</Text>
            <Helper text={field.helperText} />
          </View>
          <Switch
            value={!!value}
            onValueChange={onChange}
            trackColor={{ true: colors.primary, false: '#C4CDD5' }}
            thumbColor={colors.white}
          />
        </Pressable>
      );
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
      return (
        <View>
          <FieldLabel label={field.label} />
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <View
              style={[
                styles.colorSwatch,
                { backgroundColor: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : 'transparent' },
              ]}
            />
            <Input
              style={{ flex: 1 }}
              value={value ?? ''}
              onChangeText={onChange}
              placeholder="#c2410c"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <Helper text={field.helperText ?? 'Hex colour, e.g. #c2410c'} />
        </View>
      );
    default:
      return (
        <View>
          <FieldLabel label={field.label} required={field.required} />
          <Input
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
    <View style={{ gap: 18 }}>
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
  const [open, setOpen] = useState(false);
  const options = field.options ?? [];
  const current = options.find((o) => o.value === value);

  return (
    <View>
      <FieldLabel label={field.label} />
      <Pressable style={[styles.input, styles.select]} onPress={() => setOpen(true)}>
        {current?.css && <GradientSwatch css={current.css} />}
        <Text style={{ flex: 1, color: current ? colors.text : colors.textDisabled, fontSize: 15 }}>
          {current?.label ?? (value || 'Choose…')}
        </Text>
        <Icon name="chevron-down" size={18} color={colors.textSecondary} />
      </Pressable>
      <Helper text={field.helperText} />

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{field.label}</Text>
            <ScrollView style={{ maxHeight: 420 }}>
              {options.map((o) => (
                <Pressable
                  key={o.value}
                  style={({ pressed }) => [
                    styles.option,
                    (pressed || o.value === value) && { backgroundColor: colors.neutral },
                  ]}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  {o.css && <GradientSwatch css={o.css} />}
                  <Text style={{ flex: 1, fontSize: 15, color: colors.text }}>{o.label}</Text>
                  {o.value === value && <Icon name="checkmark" color={colors.primary} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
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
      <FieldLabel label={field.label} />
      {value.length > 0 && (
        <View style={styles.tagWrap}>
          {value.map((t) => (
            <Pressable
              key={t}
              style={styles.tag}
              onPress={() => onChange(value.filter((x) => x !== t))}
              accessibilityLabel={`Remove ${t}`}
            >
              <Text style={{ fontSize: 13, color: colors.text }}>{t}</Text>
              <Icon name="close-circle" size={15} color={colors.textDisabled} />
            </Pressable>
          ))}
        </View>
      )}
      <Input
        value={draft}
        onChangeText={(t) => (t.endsWith(',') ? add(t) : setDraft(t))}
        onSubmitEditing={() => add(draft)}
        onBlur={() => draft.trim() && add(draft)}
        submitBehavior="submit"
        returnKeyType="done"
        placeholder={field.placeholder ?? 'Type and press Enter (or comma)'}
      />
      <Helper text={field.helperText ?? 'Tap a tag to remove it.'} />
    </View>
  );
}

// ---------------------------------------------------------------------- links

type LinkRow = { label: string; url: string };

function LinksField({ field, value, onChange }: { field: FieldDef; value: LinkRow[]; onChange: (v: LinkRow[]) => void }) {
  const update = (i: number, patch: Partial<LinkRow>) =>
    onChange(value.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <View style={{ gap: 10 }}>
      <View>
        <FieldLabel label={field.label} />
        <Helper text={field.helperText} />
      </View>
      {value.map((row, i) => (
        <View key={i} style={styles.linkRow}>
          <View style={{ flex: 1, gap: 8 }}>
            <Input value={row.label} onChangeText={(t) => update(i, { label: t })} placeholder="Button label (Admin dashboard)" />
            <Input
              value={row.url}
              onChangeText={(t) => update(i, { url: t })}
              placeholder="https://admin.example.com"
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
          <IconButton
            icon="trash-outline"
            label="Remove link"
            color={colors.error}
            onPress={() => onChange(value.filter((_, j) => j !== i))}
          />
        </View>
      ))}
      <Button
        size="small"
        variant="soft"
        icon="add"
        label="Add link"
        onPress={() => onChange([...value, { label: '', url: '' }])}
        style={{ alignSelf: 'flex-start' }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------- upload

/** URL text field with an upload button — paste a link or upload a file from the phone. */
function UploadField({ field, value, error, onChange }: { field: FieldDef; value: string; error?: string; onChange: (v: string) => void }) {
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

  return (
    <View>
      <FieldLabel label={field.label} />
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        {isImage && (
          <View style={styles.thumb}>
            {preview ? (
              <Image source={{ uri: preview }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <Icon name="image-outline" color={colors.textDisabled} />
            )}
          </View>
        )}
        <Input
          style={{ flex: 1 }}
          value={value}
          onChangeText={onChange}
          placeholder="https://… or upload"
          autoCapitalize="none"
          autoCorrect={false}
          invalid={!!error}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <Button size="small" variant="soft" icon="cloud-upload-outline" label="Upload file" loading={uploading} onPress={pick} />
        {!isImage && !!preview && (
          <Button size="small" variant="outlined" tone="default" icon="open-outline" label="Open" onPress={() => Linking.openURL(preview)} />
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
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  helper: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(145, 158, 171, 0.32)',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    minHeight: 48,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.paper,
  },
  select: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchLabel: { fontSize: 15, color: colors.text },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(22, 28, 36, 0.48)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: 32,
    paddingTop: 8,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', padding: 16, color: colors.text },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(145, 158, 171, 0.16)',
    borderRadius: 14,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 5,
  },
  linkRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    padding: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.neutral,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.neutral,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
