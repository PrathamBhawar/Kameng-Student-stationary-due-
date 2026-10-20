import React, { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { Anim } from '../anim';
import { DismissKeyboard, Glass, Icon, PillButton, T, Tap } from '../components/ui';
import { BackBtn } from '../components/parts';
import { HOSTELS } from '../data';
import { tapLight, useLook, useStore } from '../store';
import { useSafe } from '../safe';
import { Glow, OnbBg, RadioDot } from './Onboarding';

const W = '#FFFFFF';

/**
 * Choose the shop's hostel at IIT Guwahati, or add one that's missing. Shown after every sign-up and
 * log-in, and from Profile → Hostel to switch.
 */
export function HostelPick() {
  const { state, set, back, toast } = useStore();
  const { fs } = useLook();
  const { top, bottom } = useSafe();
  const fromProfile = state.stack.length > 1;
  const [sel, setSel] = useState(state.shopHostel);
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState('');
  const [addErr, setAddErr] = useState<string | null>(null);

  const all = HOSTELS.concat(state.customHostels);
  const query = q.trim().toLowerCase();
  const shown = all.filter((h) => !query || h.toLowerCase().includes(query));

  const add = () => {
    const name = draft.trim().replace(/\s+/g, ' ').replace(/\s*hostel$/i, '');
    if (name.replace(/[^A-Za-zঀ-৿]/g, '').length < 2) { setAddErr('Enter the hostel’s name'); return; }
    const pretty = name.charAt(0).toUpperCase() + name.slice(1);
    const existing = all.find((h) => h.toLowerCase() === pretty.toLowerCase());
    if (existing) { setSel(existing); setDraft(''); setAddErr(null); toast(existing + ' is already in the list'); return; }
    Keyboard.dismiss();
    tapLight();
    set({ customHostels: state.customHostels.concat([pretty]) });
    setSel(pretty); setDraft(''); setQ(''); setAddErr(null);
    toast(pretty + ' added');
  };
  const done = () => {
    set({ shopHostel: sel });
    if (fromProfile) { back(); toast('Switched to ' + sel + ' Hostel'); }
    else set({ stack: ['overview'], dir: 1 });
  };

  return (
    <DismissKeyboard>
      <OnbBg />
      <Glow size={420} top={top - 60} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ paddingTop: top + 4, paddingHorizontal: 16, minHeight: top + 48 }}>
          {fromProfile ? <BackBtn color={W} onPress={back} style={{ marginLeft: -10 }} /> : null}
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <Anim type="rise" style={{ marginTop: fromProfile ? 10 : 0 }}>
            <T size={40} weight={900} face="display" ls={-0.01} lh={1.02} upper color={W} accessibilityRole="header">Choose hostel</T>
          </Anim>
          <Anim type="rise" delay={80} style={{ marginTop: 8 }}>
            <T size={17} color="rgba(255,255,255,0.78)">Your shop’s hostel at IIT Guwahati.</T>
          </Anim>

          <Anim type="rise" delay={140} style={{ marginTop: 22, justifyContent: 'center' }}>
            <View style={{ position: 'absolute', left: 14, zIndex: 1 }} pointerEvents="none"><Icon name="search" size={20} color="rgba(255,255,255,0.7)" /></View>
            <TextInput accessibilityLabel="Search hostels" placeholder="Search hostels" placeholderTextColor="rgba(255,255,255,0.5)"
              value={q} onChangeText={setQ} autoCorrect={false} returnKeyType="search" keyboardAppearance="dark"
              style={{ height: 50, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', color: W, fontFamily: 'Inter_500Medium', fontSize: fs(16), paddingLeft: 44, paddingRight: 16 }} />
          </Anim>

          <Anim type="rise" delay={200} style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {shown.map((h) => {
              const on = sel === h;
              const custom = !HOSTELS.includes(h);
              return (
                <Tap key={h} onPress={() => { tapLight(); setSel(h); Keyboard.dismiss(); }} accessibilityRole="radio" accessibilityState={{ checked: on }}
                  label={h + ' Hostel'} scaleTo={0.96} style={{ width: '48.5%', flexGrow: 0 }}>
                  <Glass tint={on ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.07)'} radius={18} intensity={16}
                    style={{ minHeight: 60, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: on ? 2 : 1, borderColor: on ? W : 'rgba(255,255,255,0.14)' }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T size={16} weight={700} color={W} numberOfLines={1}>{h}</T>
                      {custom ? <T size={12} weight={600} color="#8FA8FF">Added by you</T> : null}
                    </View>
                    <RadioDot on={on} />
                  </Glass>
                </Tap>
              );
            })}
            {shown.length === 0 ? (
              <T size={15} color="rgba(255,255,255,0.7)" style={{ paddingVertical: 8 }}>No hostel called “{q.trim()}”. Add it below.</T>
            ) : null}
          </Anim>

          <T size={14} weight={600} color="rgba(255,255,255,0.8)" style={{ marginTop: 24, marginBottom: 6 }}>Add new hostel</T>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput accessibilityLabel="New hostel name" placeholder="Hostel name" placeholderTextColor="rgba(255,255,255,0.45)"
              value={draft} onChangeText={(v) => { setDraft(v.slice(0, 30)); setAddErr(null); }} autoCapitalize="words" autoCorrect={false}
              returnKeyType="done" onSubmitEditing={add} keyboardAppearance="dark"
              style={{ flex: 1, minWidth: 0, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', color: W, fontFamily: 'Inter_500Medium', fontSize: fs(16), paddingHorizontal: 16, borderWidth: addErr ? 2 : 1, borderColor: addErr ? '#FFB4AB' : 'rgba(255,255,255,0.14)' }} />
            <PillButton title="Add" onPress={add} bg="rgba(255,255,255,0.18)" fg={W} height={52} style={{ paddingHorizontal: 22 }}>
              <Icon name="plus" size={18} color={W} sw={2.4} />
            </PillButton>
          </View>
          {addErr ? <T accessibilityRole="alert" size={13} weight={600} color="#FFB4AB" style={{ marginTop: 6 }}>{addErr}</T> : null}
        </ScrollView>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: Math.max(bottom, 16) }}>
          <PillButton title={fromProfile ? 'Save ' + sel + ' Hostel' : 'Continue with ' + sel} onPress={done} bg={W} fg="#0B0F19" />
        </View>
      </KeyboardAvoidingView>
    </DismissKeyboard>
  );
}
