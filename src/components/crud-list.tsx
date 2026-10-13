import type { Ordered } from '@/lib/types';
import type { FieldDef } from './fields';

import { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  Alert,
  Modal,
  Switch,
  Platform,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';

import { colors } from '@/theme';
import { createItem, deleteItem, updateItem, useResource, reorderItems } from '@/lib/store';

import { FormFields, useFieldForm } from './fields';
import { Card, toast, Button, Divider, Loading, EmptyState, IconButton } from './ui';

// ----------------------------------------------------------------------

type CrudListProps<T extends Ordered> = {
  /** API collection URL, e.g. /api/projects */
  url: string;
  title: string;
  subheader?: string;
  /** Singular noun for buttons and dialogs ("project"). */
  itemName: string;
  fields: FieldDef[];
  renderPrimary: (item: T) => React.ReactNode;
  renderSecondary?: (item: T) => React.ReactNode;
  renderLeading?: (item: T) => React.ReactNode;
};

/**
 * Full CRUD for one list resource: add / edit (full-screen form), delete (confirm),
 * show-hide switch and up/down ordering. Every change is live on the website.
 */
export function CrudList<T extends Ordered>({
  url,
  title,
  subheader,
  itemName,
  fields,
  renderPrimary,
  renderSecondary,
  renderLeading,
}: CrudListProps<T>) {
  const { data, isLoading, error } = useResource<T[]>(url);
  const items = data ?? [];
  const [editing, setEditing] = useState<T | null | 'new'>(null);

  const toggleVisible = async (item: T) => {
    try {
      await updateItem<T>(url, item.id, { visible: !item.visible } as Partial<T>);
      toast.success(item.visible ? 'Hidden from the website' : 'Shown on the website');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const move = async (index: number, delta: number) => {
    const ids = items.map((i) => i.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    try {
      await reorderItems<T>(url, ids);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const confirmDelete = (item: T) =>
    Alert.alert(`Delete ${itemName}?`, 'This removes it from the website and cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(url, item.id);
            toast.success(`Deleted ${itemName}`);
          } catch (e) {
            toast.error((e as Error).message);
          }
        },
      },
    ]);

  const renderList = () => {
    if (isLoading) return <Loading />;
    if (error && !data) return <EmptyState icon="cloud-offline-outline" title="Could not load" description={error.message} />;
    if (!items.length) {
      return (
        <EmptyState title={`No ${itemName}s yet`} description={`Tap "Add" to create the first one.`} />
      );
    }
    return items.map((item, index) => (
      <View key={item.id}>
        {index > 0 && <Divider dashed />}
        <View style={[styles.row, { opacity: item.visible ? 1 : 0.55 }]}>
          <View>
            <IconButton icon="chevron-up" label="Move up" size={18} disabled={index === 0} onPress={() => move(index, -1)} />
            <IconButton
              icon="chevron-down"
              label="Move down"
              size={18}
              disabled={index === items.length - 1}
              onPress={() => move(index, 1)}
            />
          </View>

          {renderLeading?.(item)}

          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Text style={styles.primary} numberOfLines={2}>
              {renderPrimary(item)}
            </Text>
            {renderSecondary && <View>{renderSecondary(item)}</View>}
          </View>

          <View style={{ alignItems: 'center' }}>
            <Switch
              value={item.visible}
              onValueChange={() => toggleVisible(item)}
              trackColor={{ true: colors.primary, false: '#C4CDD5' }}
              thumbColor={colors.white}
              accessibilityLabel="Visible on website"
            />
            <View style={{ flexDirection: 'row' }}>
              <IconButton icon="create-outline" label="Edit" onPress={() => setEditing(item)} />
              <IconButton icon="trash-outline" label="Delete" color={colors.error} onPress={() => confirmDelete(item)} />
            </View>
          </View>
        </View>
      </View>
    ));
  };

  return (
    <Card
      title={title}
      subheader={subheader}
      padded={false}
      action={<Button size="small" icon="add" label="Add" onPress={() => setEditing('new')} />}
    >
      {renderList()}

      <ItemEditor
        open={editing !== null}
        item={editing === 'new' ? null : editing}
        url={url}
        itemName={itemName}
        fields={fields}
        onClose={() => setEditing(null)}
      />
    </Card>
  );
}

// ----------------------------------------------------------------------

function ItemEditor<T extends Ordered>({
  open,
  item,
  url,
  itemName,
  fields,
  onClose,
}: {
  open: boolean;
  item: T | null;
  url: string;
  itemName: string;
  fields: FieldDef[];
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const allFields = useMemo<FieldDef[]>(
    () => [...fields, { name: 'visible', label: 'Show on website', type: 'switch' }],
    [fields]
  );
  const form = useFieldForm(allFields, item);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.validate()) return;
    setSaving(true);
    try {
      const body = form.body() as Partial<T>;
      if (item) {
        await updateItem<T>(url, item.id, body);
        toast.success(`Saved ${itemName}`);
      } else {
        await createItem<T>(url, body);
        toast.success(`Added ${itemName}`);
      }
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.editorHeader, { paddingTop: Platform.OS === 'ios' ? 16 : insets.top + 12 }]}>
          <Button variant="text" tone="default" label="Cancel" onPress={onClose} />
          <Text style={styles.editorTitle}>
            {item ? 'Edit' : 'Add'} {itemName}
          </Text>
          <Button variant="text" label={item ? 'Save' : 'Add'} loading={saving} onPress={save} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 48 }} keyboardShouldPersistTaps="handled">
          <Card>
            <FormFields fields={allFields} form={form} />
          </Card>
          <Button
            label={item ? 'Save changes' : `Add ${itemName}`}
            loading={saving}
            onPress={save}
            style={{ marginTop: 16 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 8 },
  primary: { fontSize: 15, fontWeight: '600', color: colors.text },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: colors.paper,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  editorTitle: { fontSize: 17, fontWeight: '700', color: colors.text, textTransform: 'capitalize' },
});
