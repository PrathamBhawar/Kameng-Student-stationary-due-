import React, { useEffect, useState } from 'react';
import { Animated, Easing, ScrollView, View } from 'react-native';
import { reducedMotion } from '../anim';
import { useSafe } from '../safe';
import { firstName, tapLight, UNDO_MS, useLook, useStore } from '../store';
import { canDispute } from '../ledger/balance';
import type { DisputeReason, ReceiptState } from '../ledger/types';
import { fmt } from '../data';
import { Sheet, SheetButtons } from './Sheet';
import { Icon, T, Tap } from './ui';

/** "Sent ✓✓" (blue), "Opened ✓" (grey), "Not sent" / "No phone" (amber). Never "Delivered" or "Read". */
export function ReceiptStatusLine({ receipt }: { receipt: ReceiptState }) {
  const { c, t } = useLook();
  const look = {
    sent: { icon: 'ticks' as const, fg: c.primary, label: t.stSent },
    opened: { icon: 'check' as const, fg: c.text3, label: t.stOpened },
    not_sent: { icon: 'alert' as const, fg: c.amber, label: t.stNotSent },
    no_phone: { icon: 'alert' as const, fg: c.amber, label: t.stNoPhone },
  }[receipt.status];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} accessibilityLabel={t.receipt + ': ' + look.label}>
      <Icon name={look.icon} size={14} color={look.fg} sw={2.4} />
      <T size={12} weight={600} color={look.fg}>{look.label}</T>
    </View>
  );
}

/** WhatsApp-style chat bubble showing exactly the message that will be sent. */
function Bubble({ text }: { text: string }) {
  const { isDark, fs } = useLook();
  return (
    <View style={{ marginTop: 14, borderRadius: 20, padding: 12, backgroundColor: isDark ? '#0B141A' : '#EFEAE2' }}>
      <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignSelf: 'flex-end', maxWidth: '94%', borderRadius: 14, borderTopRightRadius: 4, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: isDark ? '#005C4B' : '#D9FDD3' }}>
          <T size={14} color={isDark ? '#E9EDEF' : '#111B21'} style={{ lineHeight: Math.round(fs(14) * 1.4) }} selectable>{text}</T>
        </View>
      </ScrollView>
    </View>
  );
}

/** After every entry: preview the receipt, then Send on WhatsApp or Later. */
export function ReceiptSheet() {
  const { state, messageFor, receiptOf, sendReceipt, nextReceipt, addNumber, find, set } = useStore();
  const { c, t } = useLook();
  const target = state.receiptQueue[0];
  const open = !!target && !state.confirmFor && !state.disputeFor;
  // Keep showing the last target while the sheet slides away.
  const [shown, setShown] = useState(target);
  if (target && (target.entryId !== shown?.entryId || target.kind !== shown?.kind)) setShown(target);
  const t2 = target || shown;
  const entry = t2 ? state.entries.find((e) => e.id === t2.entryId) : undefined;
  const receipt = t2 ? receiptOf(t2) : undefined;
  const student = entry ? find(entry.studentId) : undefined;
  const hasPhone = !!student?.phone;
  const again = receipt?.status === 'opened' || receipt?.status === 'sent';
  return (
    <Sheet open={open && !!entry} onClose={nextReceipt} title={t.receipt + ' ' + (entry?.receiptNo || '')}>
      {entry && receipt ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <T size={15} color={c.text2} numberOfLines={1} style={{ flexShrink: 1 }}>{student?.name}</T>
            <ReceiptStatusLine receipt={receipt} />
          </View>
          <Bubble text={messageFor(t2!)} />
          {!hasPhone ? (
            <View accessibilityRole="alert" style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 10, paddingLeft: 14, paddingRight: 6, borderRadius: 16, backgroundColor: c.amberSoft }}>
              <T size={15} weight={600} color={c.amber} style={{ flexShrink: 1 }}>{t.noWhatsApp}</T>
              <Tap onPress={() => addNumber(entry.studentId)} label={t.addNumber} style={{ minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' }}>
                <T size={15} weight={700} color={c.primaryInk}>{t.addNumber}</T>
              </Tap>
            </View>
          ) : null}
          {hasPhone ? (
            <SheetButtons primary={again ? t.sendAgain : t.sendWhatsApp} onPrimary={() => sendReceipt(t2!)} primaryBg="#1FA855"
              secondary={t.later} onSecondary={nextReceipt} />
          ) : (
            <SheetButtons primary={t.later} onPrimary={nextReceipt} primaryBg={c.surface2} primaryFg={c.text} />
          )}
          {t2!.kind === 'entry' && canDispute(state.entries, entry) ? (
            <Tap onPress={() => { tapLight(); set({ disputeFor: entry.id }); }} label={t.studentSaysWrong} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
              <T size={14} weight={600} color={c.amber}>{t.studentSaysWrong}</T>
            </Tap>
          ) : null}
        </>
      ) : <View style={{ height: 120 }} />}
    </Sheet>
  );
}

/** Back from WhatsApp: did the receipt go? Only the shopkeeper can know. */
export function ConfirmSentSheet() {
  const { state, confirmReceipt, find } = useStore();
  const { c, t } = useLook();
  const target = state.confirmFor;
  const [last, setLast] = useState(target);
  if (target && target !== last) setLast(target);
  const entry = (target || last) ? state.entries.find((e) => e.id === (target || last)!.entryId) : undefined;
  const name = entry ? firstName(find(entry.studentId)?.name || '') : '';
  return (
    <Sheet open={!!target} onClose={() => confirmReceipt(false)} title={t.didItGo(name)}>
      <T size={15} color={c.text2} style={{ marginTop: 6 }}>{t.receipt + ' ' + (entry?.receiptNo || '')}</T>
      <SheetButtons primary={t.sent} onPrimary={() => confirmReceipt(true)} secondary={t.notYet} onSecondary={() => confirmReceipt(false)} />
    </Sheet>
  );
}

const REASONS: DisputeReason[] = ['didnt_buy', 'wrong_amount', 'already_paid', 'card_misused'];

/** "Student says it's wrong": pick the reason they gave. */
export function DisputeSheet() {
  const { state, set, openDispute } = useStore();
  const { c, t } = useLook();
  const [reason, setReason] = useState<DisputeReason | null>(null);
  const open = !!state.disputeFor;
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) { setWasOpen(open); if (open) setReason(null); }
  const entry = state.entries.find((e) => e.id === state.disputeFor);
  return (
    <Sheet open={open} onClose={() => set({ disputeFor: '' })} title={t.whatsWrong}>
      <T size={15} color={c.text2} style={{ marginTop: 6 }}>{entry ? entry.receiptNo + ' · ₹' + fmt(entry.amount) : ''}</T>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
        {REASONS.map((r) => {
          const on = reason === r;
          return (
            <Tap key={r} onPress={() => { tapLight(); setReason(r); }} accessibilityRole="radio" accessibilityState={{ checked: on }} label={t.reasons[r]} scaleTo={0.95}
              style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 22, justifyContent: 'center', backgroundColor: on ? c.amberSoft : c.bg, borderWidth: 2, borderColor: on ? c.amber : 'transparent' }}>
              <T size={15} weight={600} color={on ? c.amber : c.text}>{t.reasons[r]}</T>
            </Tap>
          );
        })}
      </View>
      <SheetButtons primary={t.markDisputed} onPrimary={() => reason && entry && openDispute(entry.id, reason)}
        primaryBg={reason ? c.amber : c.disBg} primaryFg={reason ? '#FFFFFF' : c.disFg} secondary={t.later} onSecondary={() => set({ disputeFor: '' })} />
    </Sheet>
  );
}

/**
 * "Saved ₹120 · Undo" for 10 seconds, with a bar counting down. At the bottom of the profile, out of the way of
 * Back and Edit; while a sheet covers the bottom it moves to the top instead.
 */
export function UndoSnackbar({ atTop }: { atTop: boolean }) {
  const { state, undoLast } = useStore();
  const { c, t } = useLook();
  const { top, bottom } = useSafe();
  const u = state.undo;
  const v = useState(() => new Animated.Value(0))[0];
  const bar = useState(() => new Animated.Value(1))[0];
  const [shown, setShown] = useState(u);
  if (u && u !== shown) setShown(u);
  useEffect(() => {
    Animated.timing(v, { toValue: u ? 1 : 0, duration: reducedMotion() ? 0 : u ? 360 : 220, easing: Easing.bezier(0.2, 0.9, 0.25, 1.15), useNativeDriver: true }).start();
    if (!u) return;
    const left = Math.max(0, u.until - Date.now());
    bar.setValue(left / UNDO_MS);
    const a = Animated.timing(bar, { toValue: 0, duration: left, easing: Easing.linear, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [u, v, bar]);
  if (!u && !shown) return null;
  return (
    <Animated.View pointerEvents={u ? 'box-none' : 'none'} style={{
      position: 'absolute', left: 16, right: 16, opacity: v,
      ...(atTop ? { top: top + 6 } : { bottom: Math.max(bottom, 16) + 8 }),
      transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [atTop ? -24 : 24, 0] }) }],
    }}>
      <View accessibilityLiveRegion="polite" style={{
        borderRadius: 18, backgroundColor: c.toastBg, overflow: 'hidden',
        shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 15, shadowOffset: { width: 0, height: 8 },
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 16, paddingRight: 6, minHeight: 52 }}>
          <Icon name="check" size={18} color={c.toastIcon} sw={2.6} />
          <T size={15} weight={600} color={c.toastFg} style={{ flex: 1 }} numberOfLines={1}>{t.savedAmt('₹' + fmt((u || shown)!.amount))}</T>
          <Tap onPress={undoLast} label={t.undo} style={{ minHeight: 44, minWidth: 64, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' }}>
            <T size={15} weight={700} color={c.toastBg === '#0B0F19' ? '#8FA8FF' : c.primary}>{t.undo}</T>
          </Tap>
        </View>
        <Animated.View style={{ height: 3, backgroundColor: c.toastBg === '#0B0F19' ? '#8FA8FF' : c.primary, transformOrigin: 'left', transform: [{ scaleX: bar }] }} />
      </View>
    </Animated.View>
  );
}
