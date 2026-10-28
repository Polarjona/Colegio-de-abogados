import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const colors = {
  navy: '#142A3B',
  blue: '#254A64',
  gold: '#C69A52',
  paper: '#F7F5F0',
  ink: '#263645',
  muted: '#75818A',
  border: '#E6E2DA',
  white: '#FFFFFF',
  success: '#2F775E',
};

const updates = [
  { title: 'Actualización de la Ley de Procedimiento Administrativo', category: 'Administrativo', date: 'Hoy · 09:42', summary: 'Se publica una actualización que introduce cambios en los plazos y en la tramitación electrónica de determinados procedimientos administrativos.', reference: 'BOE-A-2026-10482', isNew: true },
  { title: 'Modificación de medidas de protección laboral', category: 'Laboral', date: 'Ayer · 16:20', summary: 'Nuevas disposiciones sobre medidas de conciliación y protección de las personas trabajadoras.', reference: 'BOE-A-2026-10371', isNew: true },
  { title: 'Reforma de la normativa de arrendamientos urbanos', category: 'Civil', date: '22 oct 2026', summary: 'Cambios normativos relacionados con los contratos de arrendamiento y las obligaciones de las partes.', reference: 'BOE-A-2026-10156' },
  { title: 'Criterios de aplicación en materia tributaria', category: 'Fiscal', date: '20 oct 2026', summary: 'Se actualizan los criterios interpretativos aplicables a varios supuestos tributarios.', reference: 'BOE-A-2026-09924' },
  { title: 'Disposiciones sobre sociedades mercantiles', category: 'Mercantil', date: '18 oct 2026', summary: 'Nuevas disposiciones relativas al registro y funcionamiento de las sociedades mercantiles.', reference: 'BOE-A-2026-09610' },
  { title: 'Revisión de disposiciones del Código Penal', category: 'Penal', date: '15 oct 2026', summary: 'Publicación de cambios y disposiciones complementarias en materia penal.', reference: 'BOE-A-2026-09133' },
];
const categories = ['Civil', 'Penal', 'Laboral', 'Mercantil', 'Administrativo', 'Fiscal'];
const API_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:3006' : 'http://localhost:3006');

async function registerPushToken(token) {
  if (Platform.OS === 'web') return;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let status = existingStatus;
  if (status !== 'granted') {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== 'granted') return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Novedades BOE',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }
  const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
  const pushToken = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  await apiRequest('/devices/token', {
    method: 'POST',
    body: JSON.stringify({ token: pushToken.data, provider: 'expo' }),
  }, token);
}

async function apiRequest(path, options = {}, token) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `La API respondió con ${response.status}.`);
  return payload;
}

function normalizeNews(items) {
  return items.map((item) => ({
    ...item,
    category: item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1).toLowerCase() : 'General',
    date: item.date || item.publishedAt || 'Sin fecha',
    summary: item.summary || item.description || 'Consulta la publicación oficial para conocer todos los detalles.',
    reference: item.reference || item.id,
  }));
}

function Icon({ name, size = 22, color = colors.navy }) {
  return <Ionicons name={name} size={size} color={color} />;
}

function Button({ children, onPress, variant = 'primary', disabled = false }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, variant === 'secondary' && styles.buttonSecondary, variant === 'text' && styles.buttonText, disabled && styles.buttonDisabled, pressed && styles.pressed]}>
      <Text style={[styles.buttonLabel, variant !== 'primary' && styles.buttonLabelSecondary]}>{children}</Text>
    </Pressable>
  );
}

function Header({ title, onBack, action, actionIcon = 'options-outline' }) {
  return (
    <View style={styles.header}>
      {onBack ? <Pressable accessibilityLabel="Volver" onPress={onBack} style={styles.headerButton}><Icon name="arrow-back" /></Pressable> : <View style={styles.headerButton} />}
      <Text style={styles.headerTitle}>{title}</Text>
      {action ? <Pressable accessibilityLabel="Opciones" onPress={action} style={styles.headerButton}><Icon name={actionIcon} /></Pressable> : <View style={styles.headerButton} />}
    </View>
  );
}

function BottomNav({ active, navigate }) {
  const items = [['home-outline', 'Inicio', 'home'], ['time-outline', 'Historial', 'history'], ['notifications-outline', 'Avisos', 'alerts'], ['person-outline', 'Perfil', 'profile']];
  return (
    <View style={styles.bottomNav}>
      {items.map(([icon, label, route], index) => <Pressable key={route} onPress={() => navigate(route)} style={styles.navItem}>
        <Icon name={active === index ? icon.replace('-outline', '') : icon} size={22} color={active === index ? colors.navy : colors.muted} />
        <Text style={[styles.navLabel, active === index && styles.navLabelActive]}>{label}</Text>
      </Pressable>)}
    </View>
  );
}

function UpdateCard({ update, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cardTop}><Text style={styles.category}>{update.category}</Text>{update.isNew && <Text style={styles.newBadge}>NUEVO</Text>}</View>
      <Text style={styles.cardTitle}>{update.title}</Text>
      <Text style={styles.cardSummary} numberOfLines={2}>{update.summary}</Text>
      <View style={styles.cardMeta}><Text style={styles.metaText}>{update.date}</Text><Icon name="chevron-forward" size={18} color={colors.gold} /></View>
    </Pressable>
  );
}

function Home({ navigate, updates, loading, error }) {
  return <Screen withNav active={0} navigate={navigate}>
    <View style={styles.greeting}><Text style={styles.eyebrow}>COLEGIO DE ABOGADOS</Text><Text style={styles.pageTitle}>Novedades para ti</Text><Text style={styles.subtitle}>La actualidad jurídica, siempre al día.</Text></View>
    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Últimas publicaciones</Text><Pressable onPress={() => navigate('news')}><Text style={styles.link}>Ver todas</Text></Pressable></View>
    {loading && <Text style={styles.statusText}>Cargando publicaciones...</Text>}
    {error && <Text style={styles.errorText}>{error}</Text>}
    {!loading && !error && updates.slice(0, 3).map((update) => <UpdateCard key={update.reference} update={update} onPress={() => navigate('detail', update)} />)}
  </Screen>;
}

function News({ navigate, updates, loading, error }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('Todas');
  const filtered = updates.filter((item) => (selected === 'Todas' || item.category === selected) && item.title.toLowerCase().includes(query.toLowerCase()));
  return <Screen withNav active={0} navigate={navigate}>
    <Header title="Novedades" action={() => navigate('filters')} />
    <View style={styles.searchBox}><Icon name="search-outline" size={20} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Buscar publicaciones" placeholderTextColor={colors.muted} style={styles.searchInput} /></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{['Todas', ...categories].map((category) => <Pressable key={category} onPress={() => setSelected(category)} style={[styles.chip, selected === category && styles.chipSelected]}><Text style={[styles.chipText, selected === category && styles.chipTextSelected]}>{category}</Text></Pressable>)}</ScrollView>
    {loading && <Text style={styles.statusText}>Cargando publicaciones...</Text>}
    {error && <Text style={styles.errorText}>{error}</Text>}
    {!loading && !error && (filtered.length ? filtered.map((update) => <UpdateCard key={update.reference} update={update} onPress={() => navigate('detail', update)} />) : <EmptyState text="No hay publicaciones que coincidan con tu búsqueda." />)}
  </Screen>;
}

function Detail({ update, navigate }) {
  return <Screen><Header title="Detalle" onBack={() => navigate('news')} /><ScrollView contentContainerStyle={styles.detail}>
    <Text style={styles.category}>{update.category}</Text><Text style={styles.detailTitle}>{update.title}</Text><Text style={styles.metaText}>{update.date} · {update.reference}</Text>
    <View style={styles.divider} /><Text style={styles.detailLead}>{update.summary}</Text><Text style={styles.bodyText}>Esta publicación recoge las disposiciones publicadas en el Boletín Oficial del Estado. Consulta el texto oficial para conocer el alcance completo, las fechas de entrada en vigor y las obligaciones aplicables.</Text>
    <Button onPress={() => Alert.alert('Próximamente', 'El enlace al BOE estará disponible cuando se conecte la API.')}>Consultar en el BOE</Button>
  </ScrollView></Screen>;
}

function Filters({ navigate, token, preferences }) {
  const [selected, setSelected] = useState(categories);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (preferences?.categories) setSelected(preferences.categories);
  }, [preferences]);
  const toggle = (category) => setSelected((value) => value.includes(category) ? value.filter((item) => item !== category) : [...value, category]);
  const save = async () => {
    setSaving(true);
    try {
      await apiRequest('/preferences', { method: 'PUT', body: JSON.stringify({ emailNotifications: preferences?.emailNotifications ?? true, pushNotifications: preferences?.pushNotifications ?? true, categories: selected }) }, token);
      navigate('news');
    } catch (error) {
      Alert.alert('No se han guardado las preferencias', error.message);
    } finally { setSaving(false); }
  };
  return <Screen><Header title="Áreas jurídicas" onBack={() => navigate('news')} /><ScrollView contentContainerStyle={styles.content}><Text style={styles.subtitle}>Selecciona las materias sobre las que quieres recibir novedades.</Text>{categories.map((category) => <Pressable key={category} onPress={() => toggle(category)} style={styles.preferenceRow}><View style={styles.categoryIcon}><Icon name="briefcase-outline" size={18} color={colors.gold} /></View><Text style={styles.preferenceText}>{category}</Text><Icon name={selected.includes(category) ? 'checkmark-circle' : 'ellipse-outline'} color={selected.includes(category) ? colors.success : colors.muted} /></Pressable>)}<Button disabled={saving} onPress={save}>{saving ? 'Guardando...' : 'Guardar preferencias'}</Button></ScrollView></Screen>;
}

function History({ navigate, updates }) {
  return <Screen withNav active={1} navigate={navigate}><View style={styles.greeting}><Text style={styles.pageTitle}>Historial</Text><Text style={styles.subtitle}>Tus publicaciones consultadas recientemente.</Text></View>{updates.slice(2, 6).map((update) => <UpdateCard key={update.reference} update={update} onPress={() => navigate('detail', update)} />)}</Screen>;
}

function Alerts({ navigate, token, preferences, onPreferencesChanged }) {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => { if (typeof preferences?.pushNotifications === 'boolean') setEnabled(preferences.pushNotifications); }, [preferences]);
  const toggle = async (value) => {
    setEnabled(value);
    try {
      const next = await apiRequest('/preferences', { method: 'PUT', body: JSON.stringify({ emailNotifications: preferences?.emailNotifications ?? true, pushNotifications: value, categories: preferences?.categories || [] }) }, token);
      onPreferencesChanged(next.preferences);
    } catch (error) { setEnabled(!value); Alert.alert('No se han actualizado los avisos', error.message); }
  };
  return <Screen withNav active={2} navigate={navigate}><View style={styles.greeting}><Text style={styles.pageTitle}>Avisos</Text><Text style={styles.subtitle}>No te pierdas ninguna novedad relevante.</Text></View><View style={styles.alertCard}><View style={styles.alertIcon}><Icon name="notifications" color={colors.white} /></View><View style={styles.flex}><Text style={styles.cardTitle}>Notificaciones push</Text><Text style={styles.cardSummary}>Recibe un aviso cuando se publique una novedad de tus áreas.</Text></View><Switch value={enabled} onValueChange={toggle} trackColor={{ false: colors.border, true: colors.gold }} /></View><Text style={styles.sectionTitle}>Últimos avisos</Text><EmptyState text="Aquí aparecerán tus avisos recientes." /></Screen>;
}

function Profile({ navigate, logout, user }) {
  const initials = (user?.name || user?.email || 'Usuario').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return <Screen withNav active={3} navigate={navigate}><View style={styles.profile}><View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View><Text style={styles.profileName}>{user?.name || 'Usuario'}</Text><Text style={styles.subtitle}>{user?.email}</Text></View><View style={styles.settingsCard}><SettingRow icon="options-outline" label="Áreas jurídicas" onPress={() => navigate('filters')} /><SettingRow icon="notifications-outline" label="Preferencias de avisos" onPress={() => navigate('alerts')} /><SettingRow icon="help-circle-outline" label="Ayuda y soporte" onPress={() => Alert.alert('Ayuda', 'Escríbenos a soporte@colegioabogados.es')} /></View><Button variant="secondary" onPress={logout}>Cerrar sesión</Button></Screen>;
}

function SettingRow({ icon, label, onPress }) { return <Pressable onPress={onPress} style={styles.settingRow}><Icon name={icon} color={colors.blue} /><Text style={styles.preferenceText}>{label}</Text><Icon name="chevron-forward" size={18} color={colors.muted} /></Pressable>; }
function EmptyState({ text }) { return <View style={styles.empty}><Icon name="file-tray-outline" size={34} color={colors.muted} /><Text style={styles.emptyText}>{text}</Text></View>; }

function Auth({ onLogin }) {
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return Alert.alert('Revisa tus datos', 'Introduce un correo electrónico válido.');
    if (password.length < 6) return Alert.alert('Revisa tus datos', 'La contraseña debe tener al menos 6 caracteres.');
    setSubmitting(true);
    try {
      let payload = await apiRequest(register ? '/register' : '/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      if (register) {
        payload = await apiRequest('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      }
      onLogin(payload);
    } catch (error) {
      Alert.alert(register ? 'No se pudo crear la cuenta' : 'No se pudo iniciar sesión', error.message);
    } finally { setSubmitting(false); }
  };
  return <SafeAreaView style={styles.auth}><StatusBar style="light" /><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.authInner}><View><Text style={styles.logoMark}>M</Text><Text style={styles.authTitle}>Marco Legal</Text><Text style={styles.authSubtitle}>{register ? 'Crea tu cuenta para estar al día.' : 'La actualidad jurídica en un solo lugar.'}</Text></View><View style={styles.authForm}><Text style={styles.label}>Correo electrónico</Text><TextInput autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="tu@email.com" placeholderTextColor="#A6B0B6" style={styles.input} /><Text style={styles.label}>Contraseña</Text><TextInput secureTextEntry value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" placeholderTextColor="#A6B0B6" style={styles.input} /><Button disabled={submitting} onPress={submit}>{submitting ? 'Conectando...' : register ? 'Crear cuenta' : 'Entrar'}</Button><Pressable onPress={() => setRegister(!register)}><Text style={styles.authLink}>{register ? '¿Ya tienes una cuenta? Entrar' : '¿No tienes cuenta? Registrarme'}</Text></Pressable></View></KeyboardAvoidingView></SafeAreaView>;
}

function Screen({ children, withNav = false, active, navigate }) {
  return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>{children}</ScrollView>{withNav && <BottomNav active={active} navigate={navigate} />}</SafeAreaView>;
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [route, setRoute] = useState('home');
  const [params, setParams] = useState(null);
  const [session, setSession] = useState(null);
  const [updatesFromApi, setUpdatesFromApi] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = (next, data) => { setParams(data || null); setRoute(next); };
  const login = async (payload) => {
    setSession(payload);
    setAuthenticated(true);
    setLoading(true);
    setError('');
    try {
      const [newsPayload, preferencesPayload] = await Promise.all([
        apiRequest('/news'),
        apiRequest('/preferences', {}, payload.token),
      ]);
      setUpdatesFromApi(normalizeNews(newsPayload.news || []));
      setPreferences(preferencesPayload.preferences);
      try {
        await registerPushToken(payload.token);
      } catch (registrationError) {
        console.error('No se pudo registrar el token de notificaciones', registrationError);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally { setLoading(false); }
  };
  const logout = () => {
    setSession(null);
    setAuthenticated(false);
    setUpdatesFromApi([]);
    setPreferences(null);
    setRoute('home');
  };
  const content = !authenticated
    ? <Auth onLogin={login} />
    : route === 'home' ? <Home navigate={navigate} updates={updatesFromApi} loading={loading} error={error} />
      : route === 'news' ? <News navigate={navigate} updates={updatesFromApi} loading={loading} error={error} />
        : route === 'detail' ? (params || updatesFromApi[0] ? <Detail navigate={navigate} update={params || updatesFromApi[0]} /> : <EmptyState text="No hay una publicación seleccionada." />)
          : route === 'filters' ? <Filters navigate={navigate} token={session.token} preferences={preferences} />
            : route === 'history' ? <History navigate={navigate} updates={updatesFromApi} />
              : route === 'alerts' ? <Alerts navigate={navigate} token={session.token} preferences={preferences} onPreferencesChanged={setPreferences} />
                : <Profile navigate={navigate} user={session.user} logout={logout} />;
  return <SafeAreaProvider>{content}</SafeAreaProvider>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  screen: { padding: 20, paddingBottom: 112, maxWidth: 720, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  headerTitle: { flex: 1, textAlign: 'center', color: colors.navy, fontSize: 19, fontWeight: '700' },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  greeting: { marginTop: 12, marginBottom: 28 }, eyebrow: { color: colors.gold, fontSize: 11, letterSpacing: 1.4, fontWeight: '800', marginBottom: 10 },
  pageTitle: { color: colors.navy, fontSize: 30, lineHeight: 36, fontWeight: '800' }, subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 6 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, sectionTitle: { color: colors.navy, fontSize: 18, fontWeight: '700', marginBottom: 14 }, link: { color: colors.blue, fontWeight: '700' },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 17, marginBottom: 13, borderWidth: 1, borderColor: colors.border, shadowColor: '#15202B', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }, category: { color: colors.gold, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: .5 }, newBadge: { color: colors.success, fontSize: 10, fontWeight: '800' },
  cardTitle: { color: colors.ink, fontSize: 16, lineHeight: 22, fontWeight: '700' }, cardSummary: { color: colors.muted, lineHeight: 20, marginTop: 7 }, cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 13 }, metaText: { color: colors.muted, fontSize: 12 },
  button: { minHeight: 52, borderRadius: 13, backgroundColor: colors.navy, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18, marginTop: 22 }, buttonSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.navy }, buttonText: { backgroundColor: 'transparent' }, buttonLabel: { color: colors.white, fontWeight: '800', fontSize: 15 }, buttonLabelSecondary: { color: colors.navy }, buttonDisabled: { opacity: .5 }, pressed: { opacity: .72 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 13, paddingHorizontal: 13, marginBottom: 13 }, searchInput: { flex: 1, padding: 13, color: colors.ink, fontSize: 15 }, chips: { gap: 8, paddingBottom: 18 }, chip: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white }, chipSelected: { backgroundColor: colors.navy, borderColor: colors.navy }, chipText: { color: colors.muted, fontSize: 13, fontWeight: '700' }, chipTextSelected: { color: colors.white },
  detail: { padding: 4, paddingBottom: 32 }, detailTitle: { color: colors.navy, fontSize: 28, lineHeight: 35, fontWeight: '800', marginVertical: 12 }, divider: { height: 1, backgroundColor: colors.border, marginVertical: 23 }, detailLead: { color: colors.ink, fontSize: 18, lineHeight: 28, fontWeight: '600' }, bodyText: { color: colors.muted, fontSize: 16, lineHeight: 25, marginTop: 18 },
  content: { paddingBottom: 30 }, preferenceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border, padding: 16 }, preferenceText: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: '600', marginLeft: 13 }, categoryIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#F8F0E2' },
  profile: { alignItems: 'center', marginVertical: 18 }, avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.gold, fontSize: 27, fontWeight: '800' }, profileName: { color: colors.navy, fontSize: 22, fontWeight: '800', marginTop: 13 }, settingsCard: { backgroundColor: colors.white, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: 14 }, settingRow: { flexDirection: 'row', alignItems: 'center', padding: 17, borderBottomWidth: 1, borderBottomColor: colors.border },
  alertCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: colors.border }, alertIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginRight: 13 }, flex: { flex: 1 }, empty: { alignItems: 'center', justifyContent: 'center', padding: 45, gap: 10 }, emptyText: { textAlign: 'center', color: colors.muted, lineHeight: 22 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 76, flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }, navItem: { alignItems: 'center', gap: 3, minWidth: 60 }, navLabel: { color: colors.muted, fontSize: 11 }, navLabelActive: { color: colors.navy, fontWeight: '800' },
  auth: { flex: 1, backgroundColor: colors.navy }, authInner: { flex: 1, justifyContent: 'space-between', padding: 28, paddingTop: 70 }, logoMark: { color: colors.gold, fontSize: 58, fontWeight: '900' }, authTitle: { color: colors.white, fontSize: 37, fontWeight: '800', marginTop: 8 }, authSubtitle: { color: '#B9C4CB', fontSize: 16, lineHeight: 24, marginTop: 9 }, authForm: { paddingBottom: 20 }, label: { color: '#DDE4E8', fontWeight: '700', fontSize: 13, marginBottom: 7, marginTop: 14 }, input: { backgroundColor: colors.white, borderRadius: 12, padding: 15, fontSize: 16, color: colors.ink }, authLink: { color: colors.gold, textAlign: 'center', marginTop: 20, fontWeight: '700' },
  statusText: { color: colors.muted, textAlign: 'center', paddingVertical: 28 }, errorText: { color: '#B33A3A', backgroundColor: '#FBEAEA', borderRadius: 10, padding: 13, marginBottom: 14, lineHeight: 20 },
});
