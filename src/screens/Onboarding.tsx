import React, { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Anim, reducedMotion } from '../anim';
import { AnimatedLogo, LogoMark } from '../components/Logo';
import { Coin } from '../components/Coin';
import { appleSignIn, GoogleAuth, googleUnavailableReason } from '../auth';
import { Avatar, Glass, Icon, LinearBg, OwnerAvatar, PillButton, RadialBg, SheenBar, T, Tap } from '../components/ui';
import { BackBtn, Barcode, Keypad } from '../components/parts';
import { grad } from '../theme';
import { useLook, useStore } from '../store';
import { useSafe } from '../safe';

const W = '#FFFFFF';
const W78 = 'rgba(255,255,255,0.78)';

export function OnbBg() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} pointerEvents="none">
      <RadialBg stops={grad.onb} cx="50%" cy="0%" rx="140%" ry="72%" />
    </View>
  );
}

/** Pulsing blue glow (data-anim="glow"). */
export function Glow({ size, top, left, h, stops = grad.glow }: { size: number; top: number; left?: number; h?: number; stops?: typeof grad.glow }) {
  const { width } = useSafe();
  return (
    <Anim type="glow" pointerEvents="none"
      style={{ position: 'absolute', top, left: left ?? (width - size) / 2, width: size, height: h ?? size }}>
      <RadialBg stops={stops} />
    </Anim>
  );
}

// ───────────────────────── 01 Splash
export function Splash() {
  const { state, go, tab } = useStore();
  const { height } = useSafe();
  const start = () => (state.onboarded ? tab('overview') : go('intro1'));
  return (
    <Pressable onPress={start} accessibilityRole="button" accessibilityLabel="Start" style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, overflow: 'hidden' }}>
      <Glow size={560} top={height / 2 - 330} />
      <View style={{ width: 196, height: 196, alignItems: 'center', justifyContent: 'center' }}>
        <Anim type="ring" delay={1000} style={styles.ring} />
        <Anim type="ring" delay={2200} style={styles.ring} />
        <Anim type="coin">
          <Anim type="float" delay={1800}>
            <Coin size={196} inner={154} glow={0.55} blur={110}>
              <AnimatedLogo size={92} />
              <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 98, overflow: 'hidden' }]}>
                <Anim type="sheen" delay={1400} span={385} style={{ position: 'absolute', top: -39, left: -88, width: 74, height: 274 }}>
                  <SheenBar width={74} height={274} />
                </Anim>
              </View>
            </Coin>
          </Anim>
        </Anim>
      </View>
      <Anim type="rise" delay={1150} style={{ marginTop: 36 }}>
        <T size={40} weight={800} face="display" ls={-0.03} color={W}>Student Dues</T>
      </Anim>
      <Anim type="rise" delay={1300} style={{ marginTop: 8 }}>
        <T size={18} color={W78}>Student dues, organised.</T>
      </Anim>
      <Anim type="rise" delay={1900} style={{ position: 'absolute', bottom: 64, left: 0, right: 0 }}>
        <T size={14} weight={600} color="rgba(255,255,255,0.6)" center>Tap to start</T>
      </Anim>
    </Pressable>
  );
}

// ───────────────────────── 02 / 03 Intro
function Progress({ step }: { step: 1 | 2 }) {
  const { top } = useSafe();
  const seg = (state: 'done' | 'fill' | 'empty', key: number) => (
    <View key={key} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: state === 'done' ? W : 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
      {state === 'fill' ? <Anim type="fill" style={{ height: '100%', backgroundColor: W }} /> : null}
    </View>
  );
  return (
    <View accessibilityLabel={`Step ${step} of 2`} style={{ position: 'absolute', top: top + 4, left: 16, right: 16, flexDirection: 'row', gap: 6 }}>
      {step === 1 ? [seg('fill', 0), seg('empty', 1)] : [seg('done', 0), seg('fill', 1)]}
    </View>
  );
}

function SkipBtn() {
  const { go } = useStore();
  return (
    <Tap onPress={() => go('lang')} label="Skip" style={{ paddingVertical: 10, paddingHorizontal: 2 }}>
      <T size={16} weight={600} color="rgba(255,255,255,0.85)">Skip</T>
    </Tap>
  );
}

function IntroTitle({ title, sub }: { title: string; sub: string }) {
  const { top } = useSafe();
  return (
    <View style={{ position: 'absolute', top: top + 74, left: 16, right: 16 }}>
      <Anim type="rise"><T size={40} weight={900} face="display" ls={-0.01} lh={1.02} upper color={W} accessibilityRole="header">{title}</T></Anim>
      <Anim type="rise" delay={80} style={{ marginTop: 12 }}><T size={17} color={W78}>{sub}</T></Anim>
    </View>
  );
}

function PhoneMock({ children, bg }: { children: React.ReactNode; bg?: React.ReactNode }) {
  const { width, height, k, top } = useSafe();
  return (
    <Anim type="rise" delay={160} pointerEvents="none"
      style={{ position: 'absolute', left: width / 2 - 118, top: (top + 246) * k + (height < 874 ? 0 : (height - 874) * 0.35), width: 236, height: 510, borderRadius: 46, backgroundColor: '#0B0C12', padding: 7, borderWidth: 1.5, borderColor: '#3B4160', shadowColor: '#000', shadowOpacity: 0.9, shadowRadius: 50, shadowOffset: { width: 0, height: 50 } }}>
      <View style={{ flex: 1, borderRadius: 38, overflow: 'hidden' }}>
        {bg}
        {children}
        <View style={{ position: 'absolute', top: 9, left: 75, width: 72, height: 21, borderRadius: 11, backgroundColor: '#000' }} />
      </View>
    </Anim>
  );
}

const BottomFade = () => (
  <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 250 }}>
    <LinearBg stops={[[0, 'rgba(0,0,0,0)'], [0.42, 'rgba(0,0,0,0.92)'], [1, '#000000']]} />
  </View>
);

function IntroButtons({ primary, onPrimary }: { primary: string; onPrimary: () => void }) {
  const { go } = useStore();
  const { bottom } = useSafe();
  return (
    <View style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(bottom, 16), gap: 10 }}>
      <PillButton title={primary} onPress={onPrimary} bg={W} fg="#0B0F19" />
      <PillButton title="Log in" onPress={() => go('auth', { authMode: 'login' })} bg="#1A1B22" fg={W} />
    </View>
  );
}

/** Where the floating card sits: design position, nudged up on short screens so it clears the buttons. */
function useCardTop(designTop: number, cardH: number) {
  const { height, k, bottom } = useSafe();
  return Math.min(designTop * k + (height > 874 ? (height - 874) * 0.4 : 0), height - Math.max(bottom, 16) - 122 - cardH - 14);
}

const chip = (label: string, bg: string, fg: string) => (
  <View style={{ height: 28, paddingHorizontal: 12, borderRadius: 14, backgroundColor: bg, justifyContent: 'center' }}>
    <T fixed size={13} weight={700} color={fg}>{label}</T>
  </View>
);

export function Intro1() {
  const { go } = useStore();
  const { top } = useSafe();
  const cardTop = useCardTop(512, 136);
  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <OnbBg />
      <Progress step={1} />
      <View style={{ position: 'absolute', top: top + 20, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: W, alignItems: 'center', justifyContent: 'center' }}>
            <LogoMark size={16} bar="#1A2BE8" dot="#16A34A" four={false} />
          </View>
          <T size={15} weight={600} color={W}>Welcome to Student Dues</T>
        </View>
        <SkipBtn />
      </View>
      <IntroTitle title="Scan & find" sub="Scan ID. See dues instantly." />

      <PhoneMock bg={<RadialBg stops={[[0, '#2A3140'], [0.6, '#0D1017'], [1, '#06080C']]} cx="50%" cy="30%" rx="90%" ry="55%" />}>
        <T fixed size={11} weight={700} color={W} center style={{ position: 'absolute', top: 46, left: 0, right: 0 }}>Scan ID</T>
        <View style={{ position: 'absolute', top: 92, left: 26, right: 26, height: 84, borderRadius: 12, borderWidth: 2, borderColor: W, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ height: 46, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6, backgroundColor: '#E8EBF0', flexDirection: 'row' }}>
            <Barcode color="#11141B" gap={2} />
          </View>
          <Anim type="laser" span={148} style={{ position: 'absolute', top: 8, bottom: 8, left: '50%', width: 2, marginLeft: -1, borderRadius: 1, backgroundColor: '#8FA8FF', shadowColor: '#8FA8FF', shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }} />
        </View>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 210, borderTopLeftRadius: 22, borderTopRightRadius: 22, backgroundColor: '#F2F4F7', paddingVertical: 10, paddingHorizontal: 12 }}>
          <View style={{ width: 26, height: 3, borderRadius: 2, backgroundColor: '#D3D7DE', alignSelf: 'center' }} />
          <View style={{ marginTop: 10, padding: 8, borderRadius: 14, backgroundColor: W, borderWidth: 2, borderColor: '#5A74FF', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Avatar ini="AB" size={26} bg="#FFF0D6" fg="#9A5B00" fontSize={9} weight={800} />
            <View style={{ flex: 1, gap: 1 }}>
              <T fixed size={10} weight={700} color="#0B0F19">Ankur Bora</T>
              <T fixed size={8} color="#566070">Kameng · B-214</T>
            </View>
            <T fixed size={11} weight={800} color="#0B0F19">₹380</T>
          </View>
          <View style={{ marginTop: 8, height: 28, borderRadius: 14, backgroundColor: '#2B4CFF' }} />
          <View style={{ marginTop: 6, height: 28, borderRadius: 14, backgroundColor: '#E3E6EB' }} />
        </View>
      </PhoneMock>

      <BottomFade />

      <Anim type="pop" delay={520} pointerEvents="none" style={{ position: 'absolute', left: 22, right: 22, top: cardTop }}>
        <Anim type="float" delay={1200} style={styles.floatCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar ini="AB" size={50} bg="#FFF0D6" fg="#9A5B00" fontSize={17} weight={800} />
            <View style={{ flex: 1, gap: 2 }}>
              <T fixed size={19} weight={700} color="#0B0F19">Ankur Bora</T>
              <T fixed size={14} color="#566070">230101015 · Kameng B-214</T>
            </View>
            <T fixed size={24} weight={800} face="display" color="#0B0F19">₹380</T>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {chip('Found in 1 sec', '#E2F4E8', '#11803A')}
            {chip('Pending', '#FFF0D6', '#9A5B00')}
          </View>
        </Anim>
      </Anim>

      <IntroButtons primary="Continue" onPrimary={() => go('intro2')} />
    </View>
  );
}

const actCircle = (bg: string, child: React.ReactNode, size = 56) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>{child}</View>
);

export function Intro2() {
  const { go, back } = useStore();
  const { top } = useSafe();
  const cardTop = useCardTop(550, 118);
  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <OnbBg />
      <Progress step={2} />
      <View style={{ position: 'absolute', top: top + 20, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
        <BackBtn color={W} onPress={back} style={{ marginLeft: -10 }} />
        <SkipBtn />
      </View>
      <IntroTitle title="Remind & collect" sub="Remind, then receive payment." />

      <PhoneMock bg={<View style={[StyleSheet.absoluteFill, { backgroundColor: '#F2F4F7' }]} />}>
        <View style={{ height: 196, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: 'hidden', alignItems: 'center', paddingTop: 40 }}>
          <LinearBg stops={grad.card} />
          <Avatar ini="AB" size={34} bg="rgba(255,255,255,0.2)" fg={W} fontSize={11} weight={800} />
          <T fixed size={11} weight={700} color={W} style={{ marginTop: 6 }}>Ankur Bora</T>
          <T fixed size={30} weight={800} face="display" ls={-0.03} color={W} style={{ marginTop: 34 }}>₹380</T>
          <View style={{ marginTop: 4, height: 16, paddingHorizontal: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center' }}>
            <T fixed size={8} weight={700} color={W}>Pending</T>
          </View>
        </View>
        <View style={{ marginTop: 10, marginHorizontal: 10, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 16, borderWidth: 2, borderColor: '#5A74FF', flexDirection: 'row' }}>
          {[['Add due', '#2B4CFF'], ['Receive', '#11803A'], ['Remind', '#FFFFFF']].map(([l, b]) => (
            <View key={l} style={{ flex: 1, alignItems: 'center', gap: 3 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: b }} />
              <T fixed size={7} weight={700} color="#0B0F19">{l}</T>
            </View>
          ))}
        </View>
        <View style={{ margin: 10, borderRadius: 14, backgroundColor: W, paddingVertical: 8, paddingHorizontal: 10, gap: 9 }}>
          {['70%', '55%', '62%'].map((w) => <View key={w} style={{ height: 8, width: w as any, borderRadius: 4, backgroundColor: '#E3E6EB' }} />)}
        </View>
      </PhoneMock>

      <BottomFade />

      <Anim type="pop" delay={520} pointerEvents="none" style={{ position: 'absolute', left: 18, right: 18, top: cardTop }}>
        <Anim type="float" delay={1200} style={[styles.floatCard, { flexDirection: 'row', paddingVertical: 18, paddingHorizontal: 8, gap: 4 }]}>
          {[
            ['Add due', actCircle('#2B4CFF', <Icon name="plus" size={26} color={W} sw={2.2} />)],
            ['Receive Payment', actCircle('#11803A', <T fixed size={26} weight={800} face="display" color={W}>₹</T>)],
            ['Remind', actCircle('#EEF0F4', <Icon name="bell" size={24} color="#0B0F19" />)],
          ].map(([l, ic]) => (
            <View key={l as string} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
              {ic}
              <T fixed size={14} weight={700} color="#0B0F19" center>{l as string}</T>
            </View>
          ))}
        </Anim>
      </Anim>

      <IntroButtons primary="Get started" onPrimary={() => go('lang')} />
    </View>
  );
}

// ───────────────────────── 04 Language
export function Language() {
  const { state, go, back, set } = useStore();
  const { top, bottom } = useSafe();
  const opts: [typeof state.lang, string, string, string][] = [['en', 'English', 'Aa', 'English'], ['as', 'অসমীয়া', 'অ', 'Assamese']];
  return (
    <View style={{ flex: 1, paddingTop: top + 4, paddingHorizontal: 16, paddingBottom: Math.max(bottom, 16) }}>
      <OnbBg />
      <BackBtn color={W} onPress={back} style={{ marginLeft: -10 }} />
      <Anim type="rise" style={{ marginTop: 14 }}><T size={40} weight={900} face="display" ls={-0.01} lh={1.02} upper color={W} accessibilityRole="header">Choose language</T></Anim>
      <Anim type="rise" delay={80} style={{ marginTop: 10 }}><T size={18} weight={600} color={W78}>ভাষা বাছনি কৰক</T></Anim>
      <View accessibilityRole="radiogroup" style={{ gap: 12, marginTop: 30 }}>
        {opts.map(([k, label, glyph, sub], i) => {
          const on = state.lang === k;
          return (
            <Anim key={k} type="rise" delay={160 + i * 80}>
              <Tap onPress={() => set({ lang: k })} accessibilityRole="radio" accessibilityState={{ checked: on }} label={label} scaleTo={0.98}>
                <Glass tint="rgba(255,255,255,0.08)" radius={22} intensity={20}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, paddingHorizontal: 18, minHeight: 80, borderWidth: on ? 2 : 1, borderColor: on ? W : 'rgba(255,255,255,0.14)' }}>
                  <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                    <T fixed size={22} weight={800} face="display" color={W}>{glyph}</T>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T size={18} weight={700} color={W}>{label}</T>
                    <T size={14} color="rgba(255,255,255,0.7)">{sub}</T>
                  </View>
                  <RadioDot on={on} />
                </Glass>
              </Tap>
            </Anim>
          );
        })}
      </View>
      <View style={{ flex: 1 }} />
      <PillButton title="Continue" onPress={() => go('auth', { authMode: 'signup' })} bg={W} fg="#0B0F19" />
    </View>
  );
}

function RadioDot({ on }: { on: boolean }) {
  const v = useState(() => new Animated.Value(on ? 1 : 0))[0];
  useEffect(() => { Animated.spring(v, { toValue: on ? 1 : 0, useNativeDriver: true, bounciness: 10, speed: 20 }).start(); }, [on, v]);
  return (
    <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: on ? W : 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', width: 26, height: 26, borderRadius: 13, backgroundColor: W, alignItems: 'center', justifyContent: 'center', opacity: v, transform: [{ scale: v }] }}>
        <Icon name="check" size={15} color="#1A2BE8" sw={3} />
      </Animated.View>
    </View>
  );
}

// ───────────────────────── 05 Get started (sign up / log in)
export function Segmented<K extends string>({ options, value, onChange, pad = 4, height, radius, track, thumb, thumbShadow, render, label }: {
  options: [K, string][]; value: K; onChange: (k: K) => void; pad?: number; height: number; radius: number;
  track: string; thumb: string; thumbShadow?: boolean; render: (k: K, label: string, on: boolean) => React.ReactNode; label: string;
}) {
  const idx = Math.max(0, options.findIndex((o) => o[0] === value));
  const [w, setW] = useState(0);
  const x = useState(() => new Animated.Value(idx))[0];
  useEffect(() => {
    if (reducedMotion()) x.setValue(idx);
    else Animated.spring(x, { toValue: idx, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  }, [idx, x]);
  const n = options.length;
  const segW = w ? (w - pad * 2 - (n - 1) * 4) / n : 0;
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ flexDirection: 'row', gap: 4, padding: pad, borderRadius: radius + pad, backgroundColor: track }}>
      {segW > 0 && (
        <Animated.View pointerEvents="none" style={{
          position: 'absolute', top: pad, left: pad, width: segW, height, borderRadius: radius, backgroundColor: thumb,
          shadowColor: '#000', shadowOpacity: thumbShadow ? 0.15 : 0, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
          transform: [{ translateX: x.interpolate({ inputRange: [0, Math.max(1, n - 1)], outputRange: [0, (segW + 4) * Math.max(1, n - 1)] }) }],
        }} />
      )}
      {options.map(([k, l]) => (
        <Tap key={k} onPress={() => onChange(k)} accessibilityRole="radio" accessibilityState={{ checked: k === value }} label={l} scaleTo={0.97}
          style={{ flex: 1, minWidth: 0, height, borderRadius: radius, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}>
          {render(k, l, k === value)}
        </Tap>
      ))}
    </View>
  );
}

export function Auth() {
  const { state, set, back, go, tab, authStart, authDone, authFail, demoSignIn } = useStore();
  const { top, bottom, width, k } = useSafe();
  const signup = state.authMode === 'signup';
  const busy = state.authBusy;
  const coinTop = (top + 114) * k;

  // Google: the real OAuth popup / sheet when client IDs are set up outside Expo Go, otherwise a labelled demo.
  const googleReason = googleUnavailableReason();
  const googlePrompt = useRef<(() => Promise<void>) | null>(null);
  const onGoogle = () => {
    if (googleReason || !googlePrompt.current) { demoSignIn('google', googleReason || 'Google sign-in is still loading'); return; }
    if (!authStart('google')) return;
    googlePrompt.current().catch(() => authFail('Couldn’t open Google sign-in'));
  };
  // Apple: the native Sign in with Apple sheet on iPhone (works in Expo Go too).
  const onApple = () => {
    if (Platform.OS !== 'ios') { demoSignIn('apple', 'Sign in with Apple is available on iPhone'); return; }
    if (!authStart('apple')) return;
    appleSignIn()
      .then((p) => (p ? authDone(p) : authFail(null)))
      .catch((e) => authFail(e?.message || 'Apple sign-in failed'));
  };

  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      {googleReason ? null : (
        <GoogleAuth register={(fn) => { googlePrompt.current = fn; }} onProfile={authDone} onError={authFail} />
      )}
      <OnbBg />
      <Glow size={460} top={coinTop + 88 - 230} />
      <View style={{ position: 'absolute', top: top + 4, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackBtn color={W} onPress={back} style={{ marginLeft: -10 }} />
        <Glass tint="rgba(255,255,255,0.12)" radius={22} intensity={20} style={{ width: 196 }}>
          <Segmented label="Sign up or log in" options={[['signup', 'Sign up'], ['login', 'Log in']]} value={state.authMode}
            onChange={(m) => set({ authMode: m })} height={36} radius={18} track="transparent" thumb={W}
            render={(_, l, on) => <T size={14} weight={700} color={on ? '#0B0F19' : 'rgba(255,255,255,0.85)'} numberOfLines={1}>{l}</T>} />
        </Glass>
        <View style={{ width: 34 }} />
      </View>

      <Anim type="pop" delay={120} pointerEvents="none" style={{ position: 'absolute', left: width / 2 - 88, top: coinTop }}>
        <Anim type="float" delay={900}>
          <Coin size={176} inner={138} glow={0.45} blur={90}>
            <LogoMark size={78} bar="#8D94A7" dot="#8D94A7" check="#EEF0F5" />
          </Coin>
        </Anim>
      </Anim>

      <View style={{ position: 'absolute', left: 16, right: 16, top: coinTop + 224 }}>
        <Anim type="rise" delay={200} replayKey={state.authMode}>
          <T size={32} weight={900} face="display" ls={-0.01} lh={1.02} upper center color={W} accessibilityRole="header">{signup ? 'Create account' : 'Welcome back'}</T>
        </Anim>
        <Anim type="rise" delay={280} replayKey={state.authMode} style={{ marginTop: 10 }}>
          <T size={17} color={W78} center>{signup ? 'Choose how to sign up.' : 'Choose how to log in.'}</T>
        </Anim>
      </View>

      <View style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(bottom - 4, 16), gap: 10 }}>
        <Anim type="rise" delay={320} replayKey={state.authMode} style={{ opacity: busy && busy !== 'apple' ? 0.5 : 1 }}>
          <PillButton title={busy === 'apple' ? 'Connecting…' : 'Continue with Apple'} onPress={onApple} bg={W} fg="#000" />
        </Anim>
        <Anim type="rise" delay={380} replayKey={state.authMode} style={{ opacity: busy && busy !== 'google' ? 0.5 : 1 }}>
          <Tap onPress={onGoogle} label="Continue with Google">
            <Glass tint="rgba(255,255,255,0.14)" radius={28} intensity={20} style={{ height: 56, alignItems: 'center', justifyContent: 'center' }}>
              <T size={17} weight={600} color={W}>{busy === 'google' ? 'Connecting…' : 'Continue with Google'}</T>
            </Glass>
          </Tap>
        </Anim>
        <Anim type="rise" delay={440} replayKey={state.authMode}>
          <PillButton title="Continue with phone" onPress={() => { if (!busy) go('signin'); }} bg="#1A1B22" fg={W}>
            <Icon name="device" size={20} color={W} />
          </PillButton>
        </Anim>
        <Tap onPress={() => { set({ onboarded: true, account: { provider: 'demo', name: '', email: '' } }); tab('overview'); }} label="Try demo" style={{ marginTop: 4, padding: 8, alignItems: 'center' }}>
          <T size={15} weight={600} color="rgba(255,255,255,0.85)">Try demo</T>
        </Tap>
      </View>
    </View>
  );
}

// ───────────────────────── 06 Phone sign-in
const inputBase = { height: 60, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', color: W, paddingHorizontal: 18 } as const;

export function SignIn() {
  const { state, set, back, go } = useStore();
  const { fs } = useLook();
  const { top, bottom } = useSafe();
  const digits = state.phone.replace(/\D/g, '');
  const ok = digits.length === 10;
  const err = digits.length > 0 && !ok;
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <OnbBg />
      <View style={{ flex: 1, paddingTop: top + 4, paddingHorizontal: 16, paddingBottom: Math.max(bottom, 16) }}>
        <BackBtn color={W} onPress={back} style={{ marginLeft: -10 }} />
        <Anim type="rise" style={{ marginTop: 14 }}><T size={40} weight={900} face="display" ls={-0.01} upper color={W} accessibilityRole="header">{state.authMode === 'signup' ? 'Sign up' : 'Log in'}</T></Anim>
        <Anim type="rise" delay={80} style={{ marginTop: 8 }}><T size={17} color={W78}>We’ll text a code.</T></Anim>
        <T size={14} weight={600} color="rgba(255,255,255,0.8)" style={{ marginTop: 28 }} nativeID="phLabel">Mobile number</T>
        <Anim type="rise" delay={140} style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <View style={[inputBase, { justifyContent: 'center', paddingHorizontal: 16 }]}><T size={20} weight={600} color={W}>+91</T></View>
          <TextInput
            accessibilityLabelledBy="phLabel" accessibilityLabel="Mobile number"
            value={state.phone} onChangeText={(v) => set({ phone: v.replace(/[^\d ]/g, '').slice(0, 11) })}
            keyboardType="number-pad" textContentType="telephoneNumber" autoComplete="tel" placeholder="98765 43210"
            placeholderTextColor="rgba(255,255,255,0.45)" keyboardAppearance="dark" returnKeyType="done"
            style={[inputBase, { flex: 1, minWidth: 0, fontSize: fs(20), fontFamily: 'Inter_600SemiBold', borderWidth: 2, borderColor: err ? '#FFB4AB' : 'transparent' }]} />
        </Anim>
        {err ? <T accessibilityRole="alert" size={15} weight={600} color="#FFB4AB" style={{ marginTop: 8 }}>Enter all 10 digits</T> : null}
        <View style={{ flex: 1 }} />
        <PillButton title="Send code" disabled={!ok} onPress={() => ok && go('otp', { code: '' })}
          bg={ok ? W : 'rgba(255,255,255,0.2)'} fg={ok ? '#0B0F19' : 'rgba(255,255,255,0.6)'} />
      </View>
    </KeyboardAvoidingView>
  );
}

// ───────────────────────── 06b Enter code
export function Otp() {
  const { state, back, go, toast, set } = useStore();
  const { top, bottom } = useSafe();
  const code = state.code;
  const ok = code.length === 6;
  const [left, setLeft] = useState(24);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return (
    <View style={{ flex: 1, paddingTop: top + 4, paddingHorizontal: 16, paddingBottom: Math.max(bottom - 4, 16) }}>
      <OnbBg />
      <BackBtn color={W} onPress={back} style={{ marginLeft: -10 }} />
      <Anim type="rise" style={{ marginTop: 14 }}><T size={40} weight={900} face="display" ls={-0.01} upper color={W} accessibilityRole="header">Enter code</T></Anim>
      <Anim type="rise" delay={80} style={{ marginTop: 8 }}><T size={17} color={W78}>Sent to +91 {state.phone}</T></Anim>
      <View accessibilityLabel={`Code, ${code.length} of 6 digits`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => <OtpBox key={i} d={code[i] || ''} active={i === code.length} gap={i === 2 ? 10 : 0} />)}
      </View>
      {left > 0 ? (
        <T size={15} color="rgba(255,255,255,0.75)" style={{ marginTop: 14 }}>Resend in 0:{String(left).padStart(2, '0')}</T>
      ) : (
        <Tap onPress={() => { setLeft(24); set({ code: '' }); toast('New code sent'); }} label="Resend code" style={{ marginTop: 6, paddingVertical: 8, alignSelf: 'flex-start' }}>
          <T size={15} weight={700} color={W}>Resend code</T>
        </Tap>
      )}
      <View style={{ flex: 1 }} />
      <PillButton title="Verify" disabled={!ok} onPress={() => ok && go('name', { nameDraft: '', account: { provider: 'phone', name: '', email: '+91 ' + state.phone } })} style={{ marginBottom: 12 }}
        bg={ok ? W : 'rgba(255,255,255,0.2)'} fg={ok ? '#0B0F19' : 'rgba(255,255,255,0.6)'} />
      <Keypad kind="otp" />
    </View>
  );
}

function OtpBox({ d, active, gap }: { d: string; active: boolean; gap: number }) {
  const s = useState(() => new Animated.Value(1))[0];
  useEffect(() => {
    if (!d || reducedMotion()) return;
    s.setValue(0.82);
    Animated.spring(s, { toValue: 1, useNativeDriver: true, bounciness: 12, speed: 24 }).start();
  }, [d, s]);
  return (
    <View style={{ width: 48, height: 58, borderRadius: 14, marginRight: gap, backgroundColor: d ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)', borderWidth: 2, borderColor: active ? W : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ transform: [{ scale: s }] }}><T fixed size={26} weight={700} face="display" color={W}>{d}</T></Animated.View>
    </View>
  );
}

// ───────────────────────── 06c Your name
export function Name() {
  const { state, set, back, toast } = useStore();
  const { fs } = useLook();
  const { top, bottom } = useSafe();
  const draft = state.nameDraft.trim();
  const ok = draft.replace(/[^A-Za-zঀ-৿]/g, '').length >= 2;
  const err = draft.length > 0 && !ok;
  const ini = draft ? draft.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const done = () => {
    if (!ok) return;
    set({ ownerName: draft, stack: ['overview'], dir: 1, onboarded: true });
    toast('Welcome, ' + draft.split(/\s+/)[0]);
  };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <OnbBg />
      <View style={{ flex: 1, paddingTop: top + 4, paddingHorizontal: 16, paddingBottom: Math.max(bottom, 16), overflow: 'hidden' }}>
        <Glow size={440} top={top + 52} />
        <BackBtn color={W} onPress={back} style={{ marginLeft: -10 }} />
        <Anim type="rise" style={{ marginTop: 14 }}><T size={40} weight={900} face="display" ls={-0.01} lh={1.02} upper color={W} accessibilityRole="header">Your name</T></Anim>
        <Anim type="rise" delay={80} style={{ marginTop: 8 }}><T size={17} color={W78}>Shown on reminders.</T></Anim>
        <Anim type="pop" delay={160} style={{ alignSelf: 'center', marginTop: 44, borderRadius: 64, borderWidth: 6, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 30, shadowOffset: { width: 0, height: 30 } }}>
          <OwnerAvatar ini={ini} size={116} fontSize={44} />
        </Anim>
        <T size={14} weight={600} color="rgba(255,255,255,0.8)" style={{ marginTop: 40 }}>Full name</T>
        <Anim type="rise" delay={220} style={{ marginTop: 8 }}>
          <TextInput accessibilityLabel="Full name" value={state.nameDraft} onChangeText={(v) => set({ nameDraft: v.slice(0, 40) })}
            autoCapitalize="words" autoComplete="name" textContentType="name" placeholder="e.g. Sampath Kumar"
            placeholderTextColor="rgba(255,255,255,0.45)" keyboardAppearance="dark" returnKeyType="done" onSubmitEditing={done}
            style={[inputBase, { fontSize: fs(20), fontFamily: 'Inter_600SemiBold', borderWidth: err ? 2 : 1, borderColor: err ? '#FFB4AB' : 'rgba(255,255,255,0.14)' }]} />
        </Anim>
        {err ? <T accessibilityRole="alert" size={15} weight={600} color="#FFB4AB" style={{ marginTop: 8 }}>Enter at least 2 letters</T> : null}
        <View style={{ flex: 1 }} />
        <PillButton title="Continue" disabled={!ok} onPress={done} bg={ok ? W : 'rgba(255,255,255,0.2)'} fg={ok ? '#0B0F19' : 'rgba(255,255,255,0.6)'} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  ring: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 98, borderWidth: 2, borderColor: 'rgba(127,155,255,0.7)' },
  floatCard: {
    gap: 12, padding: 18, borderRadius: 26, backgroundColor: '#FFFFFF',
    shadowColor: '#1A2BE8', shadowOpacity: 0.65, shadowRadius: 40, shadowOffset: { width: 0, height: 40 },
  },
});
