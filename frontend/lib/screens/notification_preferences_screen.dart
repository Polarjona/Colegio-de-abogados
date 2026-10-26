import 'package:flutter/material.dart';

import '../data/demo_updates.dart';
import '../utils/app_theme.dart';
import '../widgets/app_scaffold.dart';

class NotificationPreferencesScreen extends StatefulWidget {
  const NotificationPreferencesScreen({super.key});

  @override
  State<NotificationPreferencesScreen> createState() =>
      _NotificationPreferencesScreenState();
}

class _NotificationPreferencesScreenState
    extends State<NotificationPreferencesScreen> {
  bool _allNotifications = true;
  final Set<String> _enabledCategories = {
    'Civil',
    'Laboral',
    'Administrativo',
  };

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Notificaciones',
      activeTab: 2,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        children: [
          const Text(
            'Tus avisos, a tu manera',
            style: TextStyle(
              color: AppTheme.navy,
              fontSize: 24,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Elige si quieres recibir avisos y qué áreas deben aparecer.',
            style: TextStyle(color: AppTheme.muted, height: 1.45),
          ),
          const SizedBox(height: 18),
          _PreferenceCard(
            title: 'Recibir notificaciones',
            subtitle: 'Activa o pausa todos los avisos.',
            value: _allNotifications,
            onChanged: (value) => setState(() => _allNotifications = value),
          ),
          const SizedBox(height: 18),
          const Text(
            'ÁREAS DE INTERÉS',
            style: TextStyle(
              color: AppTheme.muted,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 7),
          ...legalCategories.map(
            (category) => SwitchListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 4),
              title: Text('Novedades ${category.toLowerCase()}'),
              value: _enabledCategories.contains(category),
              activeColor: AppTheme.navy,
              onChanged: _allNotifications
                  ? (value) {
                      setState(() {
                        if (value) {
                          _enabledCategories.add(category);
                        } else {
                          _enabledCategories.remove(category);
                        }
                      });
                    }
                  : null,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Las preferencias se guardan solo durante esta demostración.',
            style: TextStyle(color: AppTheme.muted, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _PreferenceCard extends StatelessWidget {
  const _PreferenceCard({
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 8, 8),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppTheme.border),
        borderRadius: BorderRadius.circular(16),
      ),
      child: SwitchListTile(
        contentPadding: EdgeInsets.zero,
        title: Text(title,
            style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text(subtitle),
        value: value,
        activeColor: AppTheme.navy,
        onChanged: onChanged,
      ),
    );
  }
}
