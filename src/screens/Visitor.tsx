import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { Anim } from '../anim';
import { DismissKeyboard, PillButton, T, Tap } from '../components/ui';
import { BackBtn } from '../components/parts';
import { initials, isVisitor, Student, visitorId } from '../data';
import { useLook, useStore } from '../store';
import { useSafe } from '../safe';
import { EditStudent } from './StudentScreens';

type Values = { name: string; phone: string; city: string };

/** Name, phone and city, the only details asked of a visitor from off campus. */
function VisitorForm({ title, sub, initial, submit, editingId, onSubmit, onCancel }: {
  title: string; sub: string; initial: Values; submit: string; editingId?: string;
  onSubmit: (v: Values) => void; onCancel: () => void;
}) {
  const { state, back, landOnStudent } = useStore();
  const { c, fs, isDark } = useLook();
  const { top, bottom } = useSafe();
  const [v, setV] = useState<Values>(initial);
  const [tried, setTried] = useState(false);
  const name = v.name.trim(), city = v.city.trim();
  const errs = {
    name: name.replace(/[^A-Za-zঀ-৿]/g, '').length < 2 ? 'Enter their name' : null,
    phone: v.phone.length !== 10 ? 'Enter the 10-digit mobile number' : null,
    city: city.replace(/[^A-Za-zঀ-৿]/g, '').length < 2 ? 'Enter their city' : null,
  };
  // Someone already saved with this number: offer their profile instead of a duplicate.
  const same: Student | undefined = v.phone.length === 10 ? state.students.find((s) => s.phone === v.phone && s.id !== editingId) : undefined;
  const show = (k: keyof typeof errs) => (tried || (k === 'phone' && v.phone.length >= 10) ? errs[k] : null);
  const go = () => {
    setTried(true);
    if (Object.values(errs).some(Boolean) || same) return;
    onSubmit({ name, phone: v.phone, city: city.charAt(0).toUpperCase() + city.slice(1) });
  };
  const ka = isDark ? 'dark' : 'light';
  const input = (err: string | null, extra: object = {}) => ({
    height: 54, borderRadius: 14, backgroundColor: c.surface, color: c.text, fontFamily: 'Inter_400Regular', fontSize: fs(17),
    paddingHorizontal: 16, borderWidth: 2, borderColor: err ? c.red : 'transparent', ...extra,
  });
  const field = (label: string, el: React.ReactNode, err: string | null) => (
    <View style={{ gap: 6 }}>
      <T size={15} weight={600}>{label}</T>
      {el}
      {err ? <T accessibilityRole="alert" size={14} weight={600} color={c.red}>{err}</T> : null}
    </View>
  );
  return (
    <DismissKeyboard>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={{ flex: 1, paddingTop: top + 2, paddingHorizontal: 16, paddingBottom: Math.max(bottom - 2, 16) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
            <BackBtn color={c.text} onPress={back} style={{ marginLeft: -6 }} />
            <Tap onPress={onCancel} label="Cancel" style={{ paddingVertical: 10, paddingHorizontal: 2 }}><T size={17} weight={600} color={c.primaryInk}>Cancel</T></Tap>
          </View>
          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Anim type="rise" style={{ marginTop: 6 }}><T size={34} weight={800} face="display" ls={-0.03} accessibilityRole="header">{title}</T></Anim>
            <T size={16} color={c.text2} style={{ marginTop: 6 }}>{sub}</T>
            <Anim type="rise" delay={80} style={{ marginTop: 18, gap: 14 }}>
              {field('Full name', (
                <TextInput accessibilityLabel="Full name" placeholder="e.g. Rahul Sharma" placeholderTextColor={c.text3} value={v.name}
                  onChangeText={(t) => setV({ ...v, name: t.slice(0, 40) })} autoCapitalize="words" autoCorrect={false} keyboardAppearance={ka}
                  style={input(show('name'))} />
              ), show('name'))}
              {field('Phone', (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ height: 54, paddingHorizontal: 14, borderRadius: 14, backgroundColor: c.surface2, justifyContent: 'center' }}>
                    <T size={17} weight={600} color={c.text2}>+91</T>
                  </View>
                  <TextInput accessibilityLabel="Phone" placeholder="10 digits" placeholderTextColor={c.text3} value={v.phone} keyboardType="number-pad"
                    onChangeText={(t) => setV({ ...v, phone: t.replace(/\D/g, '').slice(0, 10) })} textContentType="telephoneNumber" keyboardAppearance={ka}
                    style={input(show('phone') || (same ? 'same' : null), { flex: 1, minWidth: 0 })} />
                </View>
              ), show('phone'))}
              {same ? (
                <View accessibilityRole="alert" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: c.primarySoft }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
                    <T fixed size={13} weight={700} color={c.primaryInk}>{initials(same.name)}</T>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T size={14} weight={700} color={c.primaryInk}>Number already saved</T>
                    <T size={14} color={c.text} numberOfLines={1}>{same.name} · {isVisitor(same) ? same.city : same.hostel + ' ' + same.room}</T>
                  </View>
                  <Tap onPress={() => landOnStudent(same.id, '')} label={'Open ' + same.name} style={{ height: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: c.primary, justifyContent: 'center' }}>
                    <T size={14} weight={600} color="#FFFFFF">Open</T>
                  </Tap>
                </View>
              ) : null}
              {field('City', (
                <TextInput accessibilityLabel="City" placeholder="e.g. Shillong" placeholderTextColor={c.text3} value={v.city}
                  onChangeText={(t) => setV({ ...v, city: t.slice(0, 30) })} autoCapitalize="words" autoCorrect={false} keyboardAppearance={ka}
                  returnKeyType="done" onSubmitEditing={go} style={input(show('city'))} />
              ), show('city'))}
            </Anim>
          </ScrollView>
          {same ? (
            <PillButton title={'Open ' + same.name.split(' ')[0] + '’s profile'} onPress={() => landOnStudent(same.id, '')} bg={c.primary} fg="#FFFFFF" style={{ marginTop: 12 }} />
          ) : (
            <PillButton title={submit} onPress={go} bg={c.primary} fg="#FFFFFF" style={{ marginTop: 12 }} />
          )}
        </View>
      </KeyboardAvoidingView>
    </DismissKeyboard>
  );
}

/** 13b Visitor: someone from off campus with no ID card. */
export function Visitor() {
  const { state, set, tab, landOnStudent } = useStore();
  return (
    <VisitorForm
      title="Visitor" sub="No campus ID. Name, number and city." submit="Save & add due"
      initial={{ name: '', phone: '', city: '' }} onCancel={() => tab('overview')}
      onSubmit={(v) => {
        const id = visitorId();
        const fresh: Student = { id, kind: 'visitor', name: v.name, phone: v.phone, city: v.city, hostel: '', room: '', since: 0, tx: [] };
        set({ students: state.students.concat([fresh]) });
        landOnStudent(id, 'Visitor saved', 'addDue');
      }} />
  );
}

/** Edit details: a visitor's name, phone and city are all editable (there's no ID card to lock them to). */
function EditVisitor() {
  const { state, set, back, find, landOnStudent } = useStore();
  const s = find(state.sel);
  return (
    <VisitorForm
      title="Edit visitor" sub="Name, number and city." submit="Save" editingId={s.id}
      initial={{ name: s.name, phone: s.phone, city: s.city || '' }} onCancel={back}
      onSubmit={(v) => {
        set({ students: state.students.map((x) => (x.id === s.id ? { ...x, name: v.name, phone: v.phone, city: v.city } : x)) });
        landOnStudent(s.id, 'Details saved');
      }} />
  );
}

/** Edit details opens the right form for a student or a visitor. */
export function EditDetails() {
  const { state, find } = useStore();
  return isVisitor(find(state.sel)) ? <EditVisitor /> : <EditStudent />;
}
