import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../utils/app_theme.dart';
import '../widgets/app_scaffold.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Mi perfil',
      activeTab: 3,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: AppTheme.border),
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: Color(0xFFE8EDF0),
                  child: Icon(Icons.person_rounded,
                      color: AppTheme.navy, size: 30),
                ),
                SizedBox(width: 14),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Akram Khamlich',
                      style: TextStyle(
                        color: AppTheme.ink,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'akram@ejemplo.com',
                      style: TextStyle(color: AppTheme.muted, fontSize: 13),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'CUENTA',
            style: TextStyle(
              color: AppTheme.muted,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.1,
            ),
          ),
          const SizedBox(height: 8),
          _SettingsTile(
            icon: Icons.person_outline_rounded,
            title: 'Editar perfil',
            onTap: () => _showDemoMessage(context),
          ),
          _SettingsTile(
            icon: Icons.lock_outline_rounded,
            title: 'Cambiar contraseña',
            onTap: () => _showDemoMessage(context),
          ),
          _SettingsTile(
            icon: Icons.notifications_none_rounded,
            title: 'Preferencias de notificaciones',
            onTap: () => Navigator.pushNamed(context, '/notifications'),
          ),
          _SettingsTile(
            icon: Icons.tune_rounded,
            title: 'Áreas jurídicas',
            onTap: () => Navigator.pushNamed(context, '/filters'),
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: () async {
              await FirebaseAuth.instance.signOut();
              if (context.mounted) {
                Navigator.pushNamedAndRemoveUntil(
                  context,
                  '/welcome',
                  (_) => false,
                );
              }
            },
            icon: const Icon(Icons.logout_rounded),
            label: const Text('Cerrar sesión'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF9C4646),
              minimumSize: const Size.fromHeight(50),
              side: const BorderSide(color: AppTheme.border),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

void _showDemoMessage(BuildContext context) {
  ScaffoldMessenger.of(context).showSnackBar(
    const SnackBar(content: Text('Esta opción estará disponible próximamente.')),
  );
}

class _SettingsTile extends StatelessWidget {
  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 4),
      leading: Icon(icon, color: AppTheme.blue),
      title: Text(title, style: const TextStyle(color: AppTheme.ink)),
      trailing: const Icon(Icons.chevron_right_rounded, color: AppTheme.muted),
      onTap: onTap,
    );
  }
}
