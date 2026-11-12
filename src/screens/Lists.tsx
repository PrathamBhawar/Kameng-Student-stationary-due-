import React from 'react';
import { View } from 'react-native';
import { Anim } from '../anim';
import { Avatar, Icon, T, Tap } from '../components/ui';
import { ReceiptStatusLine } from '../components/Receipts';
import { initials, rs } from '../data';
import { disputeDaysOpen, openDisputes, STALE_DISPUTE_DAYS, unsentReceipts } from '../ledger/balance';
import { tapLight, useLook, useStore } from '../store';
import { shortWhen } from './StudentScreens';

function Empty({ text }: { text: string }) {
  const { c } = useLook();
  return (
    <View style={{ marginTop: 16, backgroundColor: c.surface, borderRadius: 24, paddingVertical: 36, alignItems: 'center', gap: 10 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="check" size={26} color={c.green} sw={2.6} />
      </View>
      <T size={17} weight={600}>{text}</T>
    </View>
  );
}

/** Students → Not sent: every entry whose receipt the student isn't confirmed to have, with one-tap Send. */
export function UnsentList({ show }: { show: (studentId: string) => boolean }) {
  const { state, find, sendReceipt, openReceipt, addNumber } = useStore();
  const { c, t } = useLook();
  const list = unsentReceipts(state.entries).filter(({ entry }) => show(entry.studentId));
  return (
    <>
      {list.length ? (
        <Anim type="rise" delay={80} style={{ marginTop: 16, backgroundColor: c.surface, borderRadius: 24, overflow: 'hidden' }}>
          {list.map(({ entry: e, kind }, i) => {
            const s = find(e.studentId);
            const r = kind === 'kept' ? e.dispute!.keptReceipt! : e.receipt;
            const target = { entryId: e.id, kind };
            return (
              <View key={e.id + kind} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingLeft: 16, paddingRight: 10, minHeight: 76, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
                <Tap onPress={() => { tapLight(); openReceipt(target); }} label={s.name + ', ' + e.receiptNo} style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 }} scaleTo={0.98}>
                  <Avatar ini={initials(s.name)} size={42} bg={c.amberSoft} fg={c.amber} fontSize={15} />
                  <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                    <T size={16} weight={600} numberOfLines={1}>{s.name}</T>
                    <T size={13} color={c.text2} numberOfLines={1}>{e.receiptNo + ' · ' + rs(e.amount) + ' · ' + shortWhen(e.createdAt)}</T>
                    <ReceiptStatusLine receipt={r} />
                  </View>
                </Tap>
                {s.phone ? (
                  <Tap onPress={() => sendReceipt(target)} label={t.send + ' ' + e.receiptNo} scaleTo={0.94}
                    style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: '#1FA855', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Icon name="whatsapp" size={18} color="#FFFFFF" />
                    <T size={15} weight={700} color="#FFFFFF">{t.send}</T>
                  </Tap>
                ) : (
                  <Tap onPress={() => addNumber(s.id)} label={t.addNumber} style={{ minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' }}>
                    <T size={14} weight={700} color={c.primaryInk}>{t.addNumber}</T>
                  </Tap>
                )}
              </View>
            );
          })}
        </Anim>
      ) : <Empty text={t.allSent} />}
    </>
  );
}

/** Students → Disputes: every open dispute, newest first. Never resolved automatically. */
export function DisputeList({ show }: { show: (studentId: string) => boolean }) {
  const { state, find, go } = useStore();
  const { c, t } = useLook();
  const list = openDisputes(state.entries).filter((e) => show(e.studentId));
  return (
    <>
      {list.length ? (
        <Anim type="rise" delay={80} style={{ marginTop: 16, backgroundColor: c.surface, borderRadius: 24, overflow: 'hidden' }}>
          {list.map((e, i) => {
            const s = find(e.studentId);
            const days = disputeDaysOpen(e);
            return (
              <Tap key={e.id} onPress={() => { tapLight(); go('resolve', { resolveId: e.id }); }} label={s.name + ', ' + t.reasons[e.dispute!.reason]} scaleTo={0.98}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, minHeight: 76, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
                <Avatar ini={initials(s.name)} size={42} bg={c.amberSoft} fg={c.amber} fontSize={15} />
                <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                  <T size={16} weight={600} numberOfLines={1}>{s.name}</T>
                  <T size={13} color={c.text2} numberOfLines={1}>{e.receiptNo + ' · ' + t.reasons[e.dispute!.reason]}</T>
                  {days >= STALE_DISPUTE_DAYS ? <T size={12} color={c.text3}>{t.daysOpenLabel(days)}</T> : null}
                </View>
                <T size={17} weight={700} face="display" color={c.amber}>{rs(e.amount)}</T>
                <Icon name="chevron" size={20} color={c.text3} />
              </Tap>
            );
          })}
        </Anim>
      ) : <Empty text={t.noDisputes} />}
    </>
  );
}
