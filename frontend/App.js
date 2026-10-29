import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  PanResponder,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const APP_LOGO = require('./assets/marco-legal-logo.png');

let Notifications = null;
try {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (error) {
  console.warn('Las notificaciones push no están disponibles en este cliente Expo', error.message);
}

const colors = {
  navy: '#142A3B',
  blue: '#254A64',
  gold: '#C69A52',
  goldSoft: '#F6EEDC',
  paper: '#F7F5F0',
  ink: '#263645',
  muted: '#75818A',
  border: '#E6E2DA',
  white: '#FFFFFF',
  success: '#2F775E',
  danger: '#B65C52',
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
const sortModes = [
  { value: 'newest', label: 'Más nuevas' },
  { value: 'oldest', label: 'Más antiguas' },
  { value: 'alphabetical', label: 'A-Z' },
];
const API_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:3006' : 'http://localhost:3006');

async function registerPushToken(token) {
  if (Platform.OS === 'web' || !Notifications) return;
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
  const projectId = Constants.expoConfig?.extra?.eas?.projectId
    || Constants.easConfig?.projectId
    || process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  if (!projectId) {
    throw new Error('Falta configurar EXPO_PUBLIC_EAS_PROJECT_ID o extra.eas.projectId');
  }
  const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
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

function displayText(value, fallback = '') {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
}

function normalizeNotifications(items) {
  return items.map((item) => ({
    ...item,
    title: displayText(item.title, 'Nueva publicación del BOE'),
    summary: displayText(item.summary),
    category: displayText(item.category, 'General'),
    updatedAt: displayText(item.updatedAt),
    sentAt: displayText(item.sentAt),
    newsId: displayText(item.newsId),
  }));
}

function formatDate(value) {
  if (!value) return 'Sin fecha';
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    value = value.toDate();
  }
  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
    return 'Sin fecha';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function sortUpdates(items, mode) {
  return [...items].sort((a, b) => {
    if (mode === 'alphabetical') {
      return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
    }
    const aTime = Date.parse(a.publishedAt || a.date || '');
    const bTime = Date.parse(b.publishedAt || b.date || '');
    const aValue = Number.isNaN(aTime) ? 0 : aTime;
    const bValue = Number.isNaN(bTime) ? 0 : bTime;
    return mode === 'newest' ? bValue - aValue : aValue - bValue;
  });
}

function Icon({ name, size = 22, color = colors.navy }) {
  return <Ionicons name={name} size={size} color={color} />;
}

function SortControl({ mode, onSelect }) {
  const current = sortModes.find((item) => item.value === mode) || sortModes[0];
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.sortControl}>
      <Pressable
        accessibilityLabel={`Ordenar: ${current.label}`}
        accessibilityRole="button"
        onPress={() => setOpen((value) => !value)}
        style={({ pressed }) => [styles.sortButton, pressed && styles.pressed]}
      >
        <Icon name="swap-vertical-outline" size={18} color={colors.navy} />
        <Text style={styles.sortButtonLabel}>{current.label}</Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.navy} />
      </Pressable>
      {open && <View style={styles.sortMenu}>
        {sortModes.map((item) => (
          <Pressable
            key={item.value}
            accessibilityRole="button"
            onPress={() => {
              onSelect(item.value);
              setOpen(false);
            }}
            style={({ pressed }) => [styles.sortOption, pressed && styles.pressed]}
          >
            <Text style={[styles.sortOptionLabel, item.value === mode && styles.sortOptionSelected]}>{item.label}</Text>
            {item.value === mode && <Icon name="checkmark" size={17} color={colors.gold} />}
          </Pressable>
        ))}
      </View>}
    </View>
  );
}

function Button({ children, onPress, variant = 'primary', disabled = false }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, variant === 'secondary' && styles.buttonSecondary, variant === 'text' && styles.buttonText, variant === 'auth' && styles.authButton, disabled && styles.buttonDisabled, pressed && styles.pressed]}>
      <Text style={[styles.buttonLabel, variant === 'secondary' && styles.buttonLabelSecondary, variant === 'auth' && styles.authButtonLabel]}>{children}</Text>
    </Pressable>
  );
}

function Header({ title, onBack, action, actionIcon = 'options-outline' }) {
  return (
    <View style={styles.header}>
      {onBack ? <Pressable accessibilityLabel="Volver" onPress={onBack} style={styles.headerButton}><Icon name="arrow-back" /></Pressable> : <View style={styles.headerButtonPlaceholder} />}
      <Text style={styles.headerTitle}>{title}</Text>
      {action ? <Pressable accessibilityLabel="Opciones" onPress={action} style={styles.headerButton}><Icon name={actionIcon} /></Pressable> : <View style={styles.headerButtonPlaceholder} />}
    </View>
  );
}

function BottomNav({ active, navigate }) {
  const items = [['home-outline', 'Inicio', 'home'], ['time-outline', 'Historial', 'history'], ['notifications-outline', 'Avisos', 'alerts'], ['person-outline', 'Perfil', 'profile']];
  return (
    <View style={styles.bottomNav}>
      {items.map(([icon, label, route], index) => <Pressable key={route} onPress={() => navigate(route)} style={[styles.navItem, active === index && styles.navItemActive]}>
        <View style={[styles.navIcon, active === index && styles.navIconActive]}><Icon name={active === index ? icon.replace('-outline', '') : icon} size={21} color={active === index ? colors.white : colors.muted} /></View>
        <Text style={[styles.navLabel, active === index && styles.navLabelActive]}>{label}</Text>
      </Pressable>)}
    </View>
  );
}

function UpdateCard({ update, onPress }) {
  const categoryIcons = { Civil: 'home-outline', Penal: 'shield-checkmark-outline', Laboral: 'people-outline', Mercantil: 'business-outline', Administrativo: 'briefcase-outline', Fiscal: 'calculator-outline' };
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cardTop}><View style={styles.categoryWrap}><View style={styles.categoryIconSmall}><Icon name={categoryIcons[update.category] || 'document-text-outline'} size={15} color={colors.gold} /></View><Text style={styles.category}>{update.category}</Text></View>{update.isNew && <Text style={styles.newBadge}>NUEVO</Text>}</View>
      <Text style={styles.cardTitle} numberOfLines={2}>{update.title}</Text>
      <Text style={styles.cardSummary} numberOfLines={2}>{update.summary}</Text>
      <View style={styles.cardMeta}><Text style={styles.metaText}>{formatDate(update.date)}</Text><Icon name="chevron-forward" size={18} color={colors.gold} /></View>
    </Pressable>
  );
}

function Home({ navigate, updates, loading, error, onRefresh }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('Todas');
  const [sortMode, setSortMode] = useState('newest');
  const filtered = sortUpdates(updates.filter((item) => (
    (selected === 'Todas' || item.category === selected)
    && item.title.toLowerCase().includes(query.toLowerCase())
  )), sortMode);
  return <Screen withNav active={0} navigate={navigate} refreshing={loading} onRefresh={onRefresh}>
    <View style={styles.homeHero}><View style={styles.greeting}><Text style={styles.eyebrow}>COLEGIO DE ABOGADOS</Text><Text style={styles.pageTitle}>Novedades para ti</Text><Text style={styles.subtitle}>La actualidad jurídica, siempre al día.</Text></View><View style={styles.heroSeal}><Image source={APP_LOGO} style={styles.heroLogo} resizeMode="contain" /></View></View>
    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Publicaciones</Text><Text style={styles.countText}>{filtered.length} resultados</Text></View>
    <View style={styles.searchRow}><View style={styles.searchBox}><Icon name="search-outline" size={20} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Buscar publicaciones" placeholderTextColor={colors.muted} style={styles.searchInput} /></View><SortControl mode={sortMode} onSelect={setSortMode} /></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{['Todas', ...categories].map((category) => <Pressable key={category} onPress={() => setSelected(category)} style={[styles.chip, selected === category && styles.chipSelected]}><Text style={[styles.chipText, selected === category && styles.chipTextSelected]}>{category}</Text></Pressable>)}</ScrollView>
    {loading && <Text style={styles.statusText}>Cargando publicaciones...</Text>}
    {error && <Text style={styles.errorText}>{error}</Text>}
    {!loading && !error && (filtered.length ? filtered.map((update) => <UpdateCard key={update.reference} update={update} onPress={() => navigate('detail', update)} />) : <EmptyState text="No hay publicaciones que coincidan con tu búsqueda." />)}
  </Screen>;
}

function News({ navigate, updates, loading, error }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('Todas');
  const [sortMode, setSortMode] = useState('newest');
  const filtered = sortUpdates(updates.filter((item) => (selected === 'Todas' || item.category === selected) && item.title.toLowerCase().includes(query.toLowerCase())), sortMode);
  return <Screen withNav active={0} navigate={navigate}>
    <Header title="Novedades" action={() => navigate('filters')} actionIcon="options-outline" />
    <View style={styles.searchRow}><View style={styles.searchBox}><Icon name="search-outline" size={20} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Buscar publicaciones" placeholderTextColor={colors.muted} style={styles.searchInput} /></View><SortControl mode={sortMode} onSelect={setSortMode} /></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{['Todas', ...categories].map((category) => <Pressable key={category} onPress={() => setSelected(category)} style={[styles.chip, selected === category && styles.chipSelected]}><Text style={[styles.chipText, selected === category && styles.chipTextSelected]}>{category}</Text></Pressable>)}</ScrollView>
    {loading && <Text style={styles.statusText}>Cargando publicaciones...</Text>}
    {error && <Text style={styles.errorText}>{error}</Text>}
    {!loading && !error && (filtered.length ? filtered.map((update) => <UpdateCard key={update.reference} update={update} onPress={() => navigate('detail', update)} />) : <EmptyState text="No hay publicaciones que coincidan con tu búsqueda." />)}
  </Screen>;
}

function Detail({ update, navigate, onSwipeBack, onViewed }) {
  useEffect(() => {
    if (update?.reference) {
      onViewed(update.reference);
    }
  }, [update?.reference]);
  return <Screen onSwipeBack={onSwipeBack}><Header title="Detalle" onBack={onSwipeBack} /><ScrollView contentContainerStyle={styles.detail}>
    <View style={styles.detailBadge}><View style={styles.detailIcon}><Icon name="document-text-outline" size={18} color={colors.gold} /></View><Text style={styles.category}>{update.category}</Text></View>
    <Text style={styles.detailTitle}>{update.title}</Text><Text style={styles.metaText}>{formatDate(update.date)} · {update.reference}</Text>
    <View style={styles.divider} /><Text style={styles.detailLead}>{update.summary}</Text><Text style={styles.bodyText}>{update.content || update.description || 'Esta publicación recoge las disposiciones publicadas en el Boletín Oficial del Estado. Consulta el texto oficial para conocer el alcance completo, las fechas de entrada en vigor y las obligaciones aplicables.'}</Text>
    <Button onPress={() => update.boeUrl ? Linking.openURL(update.boeUrl) : Alert.alert('Enlace no disponible', 'Esta publicación todavía no tiene una URL oficial.')}>Consultar publicación oficial</Button>
  </ScrollView></Screen>;
}

function Filters({ navigate, token, preferences, onSwipeBack }) {
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
  return <Screen onSwipeBack={onSwipeBack}><Header title="Áreas jurídicas" onBack={onSwipeBack} /><ScrollView contentContainerStyle={styles.content}><Text style={styles.sectionKicker}>PERSONALIZA TU EXPERIENCIA</Text><Text style={styles.preferenceHeading}>¿Qué quieres seguir?</Text><Text style={styles.subtitle}>Selecciona las materias sobre las que quieres recibir novedades.</Text><View style={styles.preferenceList}>{categories.map((category) => <Pressable key={category} onPress={() => toggle(category)} style={({ pressed }) => [styles.preferenceRow, pressed && styles.pressed]}><View style={styles.categoryIcon}><Icon name="briefcase-outline" size={18} color={colors.gold} /></View><Text style={styles.preferenceText}>{category}</Text><Icon name={selected.includes(category) ? 'checkmark-circle' : 'ellipse-outline'} color={selected.includes(category) ? colors.success : colors.muted} /></Pressable>)}</View><Button disabled={saving} onPress={save}>{saving ? 'Guardando...' : 'Guardar preferencias'}</Button></ScrollView></Screen>;
}

function History({ navigate, history, updates, loading, error }) {
  const viewed = history.map((entry) => updates.find((update) => update.reference === entry.newsId)).filter(Boolean);
  return <Screen withNav active={1} navigate={navigate}><View style={styles.greeting}><Text style={styles.eyebrow}>TU ACTIVIDAD</Text><Text style={styles.pageTitle}>Historial</Text><Text style={styles.subtitle}>Publicaciones que has consultado recientemente.</Text></View>{loading && <Text style={styles.statusText}>Cargando historial...</Text>}{error && <Text style={styles.errorText}>{error}</Text>}{!loading && !error && (viewed.length ? viewed.map((update) => <UpdateCard key={update.reference} update={update} onPress={() => navigate('detail', update)} />) : <EmptyState icon="time-outline" title="Todavía no hay historial" text="Cuando abras una publicación aparecerá aquí." />)}</Screen>;
}

function Alerts({ navigate, notifications, loading, error, onRead }) {
  return <Screen withNav active={2} navigate={navigate}><View style={styles.greeting}><Text style={styles.eyebrow}>AL DÍA</Text><Text style={styles.pageTitle}>Avisos</Text><Text style={styles.subtitle}>Novedades relevantes según tus áreas jurídicas.</Text></View><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Últimos avisos</Text><Text style={styles.countText}>{notifications.filter((item) => !item.read).length} sin leer</Text></View>{loading && <Text style={styles.statusText}>Cargando avisos...</Text>}{error && <Text style={styles.errorText}>{error}</Text>}{!loading && !error && (notifications.length ? notifications.map((item) => <Pressable key={item.id} onPress={() => onRead(item)} style={[styles.notificationRow, !item.read && styles.notificationUnread]}><View style={styles.notificationDot} /><View style={styles.flex}><Text style={styles.notificationTitle} numberOfLines={2}>{item.title || 'Nueva publicación del BOE'}</Text><Text style={styles.metaText}>{formatDate(item.updatedAt || item.sentAt)}</Text></View><Icon name="chevron-forward" size={18} color={colors.muted} /></Pressable>) : <EmptyState icon="notifications-off-outline" title="Sin avisos todavía" text="Aquí aparecerán las novedades que coincidan con tus preferencias." />)}</Screen>;
}

function NotificationPreferences({ navigate, token, preferences, onPreferencesChanged, onSwipeBack }) {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => { if (typeof preferences?.pushNotifications === 'boolean') setEnabled(preferences.pushNotifications); }, [preferences]);
  const toggle = async (value) => {
    setEnabled(value);
    try {
      const next = await apiRequest('/preferences', { method: 'PUT', body: JSON.stringify({ emailNotifications: preferences?.emailNotifications ?? true, pushNotifications: value, categories: preferences?.categories || [] }) }, token);
      onPreferencesChanged(next.preferences);
    } catch (error) { setEnabled(!value); Alert.alert('No se han actualizado los avisos', error.message); }
  };
  return <Screen onSwipeBack={onSwipeBack}><Header title="Preferencias de avisos" onBack={onSwipeBack} /><View style={styles.greeting}><Text style={styles.eyebrow}>CONFIGURACIÓN</Text><Text style={styles.pageTitle}>Preferencias de avisos</Text><Text style={styles.subtitle}>Controla cómo quieres recibir las novedades del BOE.</Text></View><View style={styles.alertCard}><View style={styles.alertIcon}><Icon name="notifications" color={colors.white} /></View><View style={styles.flex}><Text style={styles.cardTitle}>Notificaciones push</Text><Text style={styles.cardSummary}>Recibe un aviso cuando se publique una novedad de tus áreas.</Text></View><Switch value={enabled} onValueChange={toggle} trackColor={{ false: colors.border, true: colors.gold }} /></View></Screen>;
}

function Profile({ navigate, logout, user, token, onUserUpdated }) {
  const [supportVisible, setSupportVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [name, setName] = useState(user?.name || '');
  useEffect(() => {
    let active = true;
    apiRequest('/profile', {}, token)
      .then((payload) => {
        if (active && payload.user) onUserUpdated(payload.user);
      })
      .catch((error) => console.warn('No se pudo actualizar el perfil', error.message));
    return () => {
      active = false;
    };
  }, [token]);
  const initials = (user?.name || user?.email || 'Usuario').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return <Screen withNav active={3} navigate={navigate}><View style={styles.profile}><Pressable onPress={() => { setName(user?.name || ''); setEditVisible(true); }}><View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View></Pressable><Text style={styles.profileName}>{user?.name || 'Usuario'}</Text><Text style={styles.subtitle}>{user?.email}</Text><Pressable onPress={() => { setName(user?.name || ''); setEditVisible(true); }}><Text style={styles.editProfileLink}>Editar nombre</Text></Pressable></View><View style={styles.settingsCard}><SettingRow icon="options-outline" label="Áreas jurídicas" onPress={() => navigate('filters')} /><SettingRow icon="notifications-outline" label="Preferencias de avisos" onPress={() => navigate('notification-preferences')} /><SettingRow icon="help-circle-outline" label="Ayuda y soporte" onPress={() => setSupportVisible(true)} /></View><Button variant="secondary" onPress={logout}>Cerrar sesión</Button><Modal transparent visible={supportVisible} animationType="fade" onRequestClose={() => setSupportVisible(false)}><Pressable style={styles.supportOverlay} onPress={() => setSupportVisible(false)}><Pressable style={styles.supportModal} onPress={(event) => event.stopPropagation()}><View style={styles.supportIcon}><Icon name="help-circle-outline" size={27} color={colors.gold} /></View><Text style={styles.supportTitle}>Ayuda y soporte</Text><Text style={styles.supportText}>Escríbenos a soporte@colegioabogados.es</Text><Button onPress={() => setSupportVisible(false)}>Cerrar</Button></Pressable></Pressable></Modal><Modal transparent visible={editVisible} animationType="fade" onRequestClose={() => setEditVisible(false)}><Pressable style={styles.supportOverlay} onPress={() => setEditVisible(false)}><Pressable style={styles.supportModal} onPress={(event) => event.stopPropagation()}><Text style={styles.supportTitle}>Editar nombre</Text><TextInput value={name} onChangeText={setName} placeholder="Tu nombre" placeholderTextColor={colors.muted} style={styles.input} autoCapitalize="words" /><Button onPress={() => { const cleanName = name.trim(); if (!cleanName) return Alert.alert('Revisa tus datos', 'Introduce tu nombre.'); if (cleanName.length > 100) return Alert.alert('Revisa tus datos', 'El nombre no puede superar los 100 caracteres.'); apiRequest('/profile', { method: 'PUT', body: JSON.stringify({ name: cleanName }) }, token).then((payload) => { onUserUpdated(payload.user); setEditVisible(false); }).catch((error) => Alert.alert('No se pudo actualizar el nombre', error.message)); }}>Guardar</Button><Button variant="secondary" onPress={() => setEditVisible(false)}>Cancelar</Button></Pressable></Pressable></Modal></Screen>;
}

function SettingRow({ icon, label, onPress }) { return <Pressable onPress={onPress} style={styles.settingRow}><Icon name={icon} color={colors.blue} /><Text style={styles.preferenceText}>{label}</Text><Icon name="chevron-forward" size={18} color={colors.muted} /></Pressable>; }
function EmptyState({ text, title, icon = 'file-tray-outline' }) { return <View style={styles.empty}><View style={styles.emptyIcon}><Icon name={icon} size={28} color={colors.blue} /></View>{title && <Text style={styles.emptyTitle}>{title}</Text>}<Text style={styles.emptyText}>{text}</Text></View>; }

function Auth({ onLogin }) {
  const [register, setRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return Alert.alert('Revisa tus datos', 'Introduce un correo electrónico válido.');
    if (register && !name.trim()) return Alert.alert('Revisa tus datos', 'Introduce tu nombre.');
    if (password.length < 6) return Alert.alert('Revisa tus datos', 'La contraseña debe tener al menos 6 caracteres.');
    setSubmitting(true);
    try {
      let payload = await apiRequest(register ? '/register' : '/login', { method: 'POST', body: JSON.stringify({ email, password, name: name.trim() }) });
      if (register) {
        const loginPayload = await apiRequest('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        payload = { ...loginPayload, user: { ...loginPayload.user, name: payload.user?.name || name.trim() } };
      }
      onLogin(payload);
    } catch (error) {
      Alert.alert(register ? 'No se pudo crear la cuenta' : 'No se pudo iniciar sesión', error.message);
    } finally { setSubmitting(false); }
  };
  return <SafeAreaView style={styles.auth}><StatusBar style="light" /><View style={styles.authOrbTop} /><View style={styles.authOrbBottom} /><KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0} style={styles.authKeyboard}><ScrollView contentContainerStyle={styles.authInner} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} showsVerticalScrollIndicator={false}><View><View style={styles.logoCircle}><Image source={APP_LOGO} style={styles.authLogo} resizeMode="contain" /></View><Text style={styles.authTitle}>Marco Legal</Text><Text style={styles.authSubtitle}>{register ? 'Crea tu cuenta para estar al día.' : 'La actualidad jurídica en un solo lugar.'}</Text></View><View style={styles.authForm}><Text style={styles.formIntro}>{register ? 'Empieza ahora' : 'Bienvenido de nuevo'}</Text>{register && <><Text style={styles.label}>Nombre</Text><TextInput autoCapitalize="words" value={name} onChangeText={setName} placeholder="Tu nombre" placeholderTextColor="#A6B0B6" style={styles.input} /></>}<Text style={styles.label}>Correo electrónico</Text><TextInput autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="tu@email.com" placeholderTextColor="#A6B0B6" style={styles.input} /><Text style={styles.label}>Contraseña</Text><TextInput secureTextEntry value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" placeholderTextColor="#A6B0B6" style={styles.input} /><Button variant="auth" disabled={submitting} onPress={submit}>{submitting ? 'Conectando...' : register ? 'Crear cuenta' : 'Entrar'}</Button><Pressable onPress={() => setRegister(!register)}><Text style={styles.authLink}>{register ? '¿Ya tienes una cuenta? Entrar' : '¿No tienes cuenta? Registrarme'}</Text></Pressable></View></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

function Screen({ children, withNav = false, active, navigate, refreshing = false, onRefresh, onSwipeBack }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const responder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Boolean(onSwipeBack)
      && Math.abs(gesture.dx) > 18
      && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.4
      && gesture.dx > 0,
    onPanResponderGrant: () => {
      translateX.stopAnimation();
    },
    onPanResponderMove: (_, gesture) => {
      translateX.setValue(Math.max(0, gesture.dx));
    },
    onPanResponderRelease: (_, gesture) => {
      const shouldGoBack = gesture.dx > 90 && Math.abs(gesture.dy) < 70 && gesture.x0 < 70;
      if (shouldGoBack) {
       Animated.timing(translateX, {
         toValue: 420,
         duration: 180,
         useNativeDriver: true,
       }).start(({ finished }) => {
         if (finished) onSwipeBack();
       });
      } else {
       Animated.spring(translateX, {
         toValue: 0,
         friction: 8,
         tension: 65,
         useNativeDriver: true,
       }).start();
      }
    },
    onPanResponderTerminate: () => {
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    },
  })).current;
  return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><Animated.View style={[styles.screenGesture, { transform: [{ translateX }], opacity: translateX.interpolate({ inputRange: [0, 420], outputRange: [1, 0.88], extrapolate: 'clamp' }) }]} {...responder.panHandlers}><ScrollView refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} colors={[colors.gold]} /> : undefined} contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>{children}</ScrollView></Animated.View>{withNav && <BottomNav active={active} navigate={navigate} />}</SafeAreaView>;
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [route, setRoute] = useState('home');
  const [params, setParams] = useState(null);
  const [session, setSession] = useState(null);
  const [updatesFromApi, setUpdatesFromApi] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [history, setHistory] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = (next, data) => { setParams(data || null); setRoute(next); };
  const goBack = () => {
    if (route === 'detail') return navigate('news');
    if (route === 'filters') return navigate('news');
    if (route === 'notification-preferences') return navigate('profile');
    if (route === 'alerts' || route === 'history' || route === 'profile') return navigate('home');
    return navigate('home');
  };
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
      const loadedPreferences = preferencesPayload.preferences || {};
      setPreferences({
        ...loadedPreferences,
        emailNotifications: loadedPreferences.emailNotifications !== false,
        pushNotifications: loadedPreferences.pushNotifications !== false,
        categories: Array.isArray(loadedPreferences.categories)
          ? loadedPreferences.categories.filter((category) => typeof category === 'string')
          : [],
      });
      loadActivity(payload.token);
      try {
        await registerPushToken(payload.token);
      } catch (registrationError) {
        console.error('No se pudo registrar el token de notificaciones', registrationError);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally { setLoading(false); }
  };
  const loadActivity = async (token) => {
    setActivityLoading(true);
    setActivityError('');
    try {
      const [notificationsPayload, historyPayload] = await Promise.all([
        apiRequest('/notifications', {}, token),
        apiRequest('/history', {}, token),
      ]);
      setNotifications(normalizeNotifications(notificationsPayload.notifications || []));
      setHistory(historyPayload.history || []);
    } catch (requestError) {
      setActivityError(requestError.message);
    } finally {
      setActivityLoading(false);
    }
  };
  const markNotificationRead = async (notification) => {
    if (!notification.read) {
      try {
        await apiRequest(`/notifications/${notification.id}/read`, { method: 'PATCH' }, session.token);
        setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read: true } : item));
      } catch (requestError) {
        setActivityError(requestError.message);
      }
    }
    const update = updatesFromApi.find((item) => item.reference === notification.newsId);
    if (update) navigate('detail', update);
  };
  const markViewed = async (newsId) => {
    if (!session?.token || !newsId) return;
    try {
      await apiRequest(`/history/${newsId}`, { method: 'PUT' }, session.token);
      setHistory((items) => [{ newsId, viewedAt: new Date().toISOString() }, ...items.filter((item) => item.newsId !== newsId)]);
    } catch (requestError) {
      setActivityError(requestError.message);
    }
  };
  const logout = () => {
    setSession(null);
    setAuthenticated(false);
    setUpdatesFromApi([]);
    setPreferences(null);
    setNotifications([]);
    setHistory([]);
    setRoute('home');
  };
  const content = !authenticated
    ? <Auth onLogin={login} />
    : route === 'home' ? <Home navigate={navigate} updates={updatesFromApi} loading={loading} error={error} onRefresh={() => login(session)} />
      : route === 'news' ? <News navigate={navigate} updates={updatesFromApi} loading={loading} error={error} />
        : route === 'detail' ? (params || updatesFromApi[0] ? <Detail navigate={navigate} update={params || updatesFromApi[0]} onSwipeBack={goBack} onViewed={markViewed} /> : <EmptyState text="No hay una publicación seleccionada." />)
          : route === 'filters' ? <Filters navigate={navigate} token={session.token} preferences={preferences} onSwipeBack={goBack} />
            : route === 'history' ? <History navigate={navigate} history={history} updates={updatesFromApi} loading={activityLoading} error={activityError} />
                : route === 'alerts' ? <Alerts navigate={navigate} notifications={notifications} loading={activityLoading} error={activityError} onRead={markNotificationRead} />
                  : route === 'notification-preferences' ? <NotificationPreferences navigate={navigate} token={session.token} preferences={preferences} onPreferencesChanged={setPreferences} onSwipeBack={goBack} />
                : <Profile navigate={navigate} user={session.user} token={session.token} onUserUpdated={(user) => setSession((current) => ({ ...current, user }))} logout={logout} />;
  return <SafeAreaProvider>{content}</SafeAreaProvider>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  screenGesture: { flex: 1 },
  screen: { padding: 20, paddingBottom: 112, maxWidth: 720, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, paddingTop: 4 },
  headerTitle: { flex: 1, textAlign: 'center', color: colors.navy, fontSize: 19, fontWeight: '700' },
  headerButton: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  headerButtonPlaceholder: { width: 40, height: 40 },
  homeHero: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  greeting: { marginTop: 12, marginBottom: 28 }, eyebrow: { color: colors.gold, fontSize: 11, letterSpacing: 1.4, fontWeight: '800', marginBottom: 10 },
  pageTitle: { color: colors.navy, fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -.5 }, subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 6 },
  heroSeal: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', marginTop: 15 }, heroLogo: { width: 38, height: 38 },
  insightCard: { backgroundColor: colors.goldSoft, borderRadius: 18, padding: 17, marginBottom: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#EBDDBF' },
  insightLabel: { color: colors.gold, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginBottom: 5 }, insightTitle: { color: colors.navy, fontSize: 15, fontWeight: '700' }, insightIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, sectionTitle: { color: colors.navy, fontSize: 18, fontWeight: '700', marginBottom: 14 }, link: { color: colors.blue, fontWeight: '700' },
  card: { backgroundColor: colors.white, borderRadius: 18, padding: 17, marginBottom: 13, borderWidth: 1, borderColor: colors.border, shadowColor: '#15202B', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }, categoryWrap: { flexDirection: 'row', alignItems: 'center', gap: 7 }, categoryIconSmall: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' }, category: { color: colors.gold, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: .5 }, newBadge: { color: colors.success, backgroundColor: '#EAF4EF', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, fontSize: 10, fontWeight: '800' },
  cardTitle: { color: colors.ink, fontSize: 16, lineHeight: 22, fontWeight: '700' }, cardSummary: { color: colors.muted, lineHeight: 20, marginTop: 7 }, cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 13 }, metaText: { color: colors.muted, fontSize: 12 },
  button: { minHeight: 54, borderRadius: 14, backgroundColor: colors.navy, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18, marginTop: 22, shadowColor: colors.navy, shadowOpacity: .18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 }, buttonSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.navy, shadowOpacity: 0 }, buttonText: { backgroundColor: 'transparent', shadowOpacity: 0 }, buttonLabel: { color: colors.white, fontWeight: '800', fontSize: 15 }, buttonLabelSecondary: { color: colors.navy }, authButton: { backgroundColor: colors.gold, borderWidth: 1, borderColor: colors.white, shadowColor: '#000000', shadowOpacity: .2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 }, authButtonLabel: { color: colors.navy }, buttonDisabled: { opacity: .5 }, pressed: { opacity: .72 },
  searchRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 13 }, searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 15, paddingHorizontal: 13, shadowColor: '#15202B', shadowOpacity: .03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }, searchInput: { flex: 1, padding: 13, color: colors.ink, fontSize: 15 }, sortControl: { position: 'relative', zIndex: 2, marginLeft: 8 }, sortButton: { minHeight: 48, paddingHorizontal: 10, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.goldSoft, borderWidth: 1, borderColor: '#EBDDBF' }, sortButtonLabel: { color: colors.navy, fontSize: 12, fontWeight: '800', marginHorizontal: 5 }, sortMenu: { position: 'absolute', top: 54, right: 0, width: 150, backgroundColor: colors.white, borderRadius: 13, borderWidth: 1, borderColor: colors.border, paddingVertical: 5, shadowColor: '#15202B', shadowOpacity: .14, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 }, sortOption: { minHeight: 40, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sortOptionLabel: { color: colors.ink, fontSize: 13 }, sortOptionSelected: { color: colors.navy, fontWeight: '800' }, chips: { gap: 8, paddingBottom: 18 }, chip: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white }, chipSelected: { backgroundColor: colors.navy, borderColor: colors.navy }, chipText: { color: colors.muted, fontSize: 13, fontWeight: '700' }, chipTextSelected: { color: colors.white },
  detail: { padding: 4, paddingBottom: 32 }, detailBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 }, detailIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' }, detailTitle: { color: colors.navy, fontSize: 28, lineHeight: 35, fontWeight: '800', marginVertical: 12, letterSpacing: -.4 }, divider: { height: 1, backgroundColor: colors.border, marginVertical: 23 }, detailLead: { color: colors.ink, fontSize: 18, lineHeight: 28, fontWeight: '600' }, bodyText: { color: colors.muted, fontSize: 16, lineHeight: 25, marginTop: 18 },
  content: { paddingBottom: 30 }, sectionKicker: { color: colors.gold, fontSize: 11, letterSpacing: 1.2, fontWeight: '800', marginTop: 8 }, preferenceHeading: { color: colors.navy, fontSize: 25, fontWeight: '800', marginTop: 8, marginBottom: 4 }, preferenceList: { backgroundColor: colors.white, borderRadius: 16, overflow: 'hidden', marginTop: 20, borderWidth: 1, borderColor: colors.border }, preferenceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border, padding: 16 }, preferenceText: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: '600', marginLeft: 13 }, categoryIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: colors.goldSoft },
  profile: { alignItems: 'center', marginVertical: 18 }, avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.gold, fontSize: 27, fontWeight: '800' }, profileName: { color: colors.navy, fontSize: 22, fontWeight: '800', marginTop: 13 }, editProfileLink: { color: colors.blue, fontWeight: '700', marginTop: 8 }, settingsCard: { backgroundColor: colors.white, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: 14 }, settingRow: { flexDirection: 'row', alignItems: 'center', padding: 17, borderBottomWidth: 1, borderBottomColor: colors.border }, supportOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(20, 42, 59, 0.55)' }, supportModal: { width: '100%', maxWidth: 380, borderRadius: 20, padding: 24, alignItems: 'center', backgroundColor: colors.white, shadowColor: '#15202B', shadowOpacity: .2, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 }, supportIcon: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.goldSoft, marginBottom: 12 }, supportTitle: { color: colors.navy, fontSize: 20, fontWeight: '800', marginBottom: 8 }, supportText: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  alertCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: colors.border }, alertIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginRight: 13 }, flex: { flex: 1 }, countText: { color: colors.blue, fontSize: 12, fontWeight: '700' }, notificationRow: { backgroundColor: colors.white, borderRadius: 14, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border }, notificationUnread: { borderColor: '#D5B16A', backgroundColor: '#FFFCF5' }, notificationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold, marginRight: 12 }, notificationTitle: { color: colors.ink, fontSize: 15, lineHeight: 20, fontWeight: '700', marginBottom: 4 }, empty: { alignItems: 'center', justifyContent: 'center', padding: 45, gap: 10 }, emptyIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#EAF0F5', alignItems: 'center', justifyContent: 'center', marginBottom: 3 }, emptyTitle: { color: colors.navy, fontSize: 16, fontWeight: '800', textAlign: 'center' }, emptyText: { textAlign: 'center', color: colors.muted, lineHeight: 22 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 82, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start', backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 9, shadowColor: '#15202B', shadowOpacity: .08, shadowRadius: 12, shadowOffset: { width: 0, height: -4 }, elevation: 10 }, navItem: { alignItems: 'center', gap: 3, minWidth: 64, paddingHorizontal: 8 }, navItemActive: { }, navIcon: { width: 38, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, navIconActive: { backgroundColor: colors.navy }, navLabel: { color: colors.muted, fontSize: 11 }, navLabelActive: { color: colors.navy, fontWeight: '800' },
  auth: { flex: 1, backgroundColor: colors.navy, overflow: 'hidden' }, authKeyboard: { flex: 1 }, authInner: { flexGrow: 1, justifyContent: 'space-between', padding: 28, paddingTop: 70, paddingBottom: 28 }, authOrbTop: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#1C3A50', top: -120, right: -80 }, authOrbBottom: { position: 'absolute', width: 210, height: 210, borderRadius: 105, borderWidth: 1, borderColor: '#31556A', bottom: -95, left: -85 }, logoCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#1C3A50', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }, authLogo: { width: 42, height: 42 }, logoMark: { color: colors.gold, fontSize: 58, fontWeight: '900' }, authTitle: { color: colors.white, fontSize: 37, fontWeight: '800', marginTop: 8 }, authSubtitle: { color: '#B9C4CB', fontSize: 16, lineHeight: 24, marginTop: 9 }, authForm: { paddingBottom: 20 }, formIntro: { color: colors.white, fontSize: 21, fontWeight: '700', marginBottom: 8 }, label: { color: '#DDE4E8', fontWeight: '700', fontSize: 13, marginBottom: 7, marginTop: 14 }, input: { backgroundColor: colors.white, borderRadius: 13, padding: 15, fontSize: 16, color: colors.ink }, authLink: { color: colors.gold, textAlign: 'center', marginTop: 20, fontWeight: '700' },
  statusText: { color: colors.muted, textAlign: 'center', paddingVertical: 28 }, errorText: { color: colors.danger, backgroundColor: '#FBEAEA', borderRadius: 12, padding: 13, marginBottom: 14, lineHeight: 20 },
});
