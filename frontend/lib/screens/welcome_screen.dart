import 'package:flutter/material.dart';

import '../utils/app_theme.dart';
import '../widgets/app_scaffold.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(28, 24, 28, 28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Spacer(),
                  Container(
                    width: 76,
                    height: 76,
                    decoration: BoxDecoration(
                      color: AppTheme.navy,
                      borderRadius: BorderRadius.circular(23),
                    ),
                    child: const Icon(
                      Icons.account_balance_rounded,
                      color: AppTheme.gold,
                      size: 39,
                    ),
                  ),
                  const SizedBox(height: 28),
                  const Text(
                    'MARCO LEGAL',
                    style: TextStyle(
                      color: AppTheme.gold,
                      fontSize: 12,
                      letterSpacing: 2.2,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'La actualidad jurídica, clara y a tiempo.',
                    style: TextStyle(
                      color: AppTheme.navy,
                      fontSize: 34,
                      height: 1.15,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Sigue las novedades publicadas en el BOE y organiza la información importante para tu práctica profesional.',
                    style: TextStyle(
                      color: AppTheme.muted,
                      fontSize: 16,
                      height: 1.55,
                    ),
                  ),
                  const SizedBox(height: 26),
                  const _WelcomeFeature(
                    icon: Icons.newspaper_rounded,
                    text: 'Novedades legislativas en un solo lugar',
                  ),
                  const _WelcomeFeature(
                    icon: Icons.tune_rounded,
                    text: 'Filtra por las áreas que te interesan',
                  ),
                  const _WelcomeFeature(
                    icon: Icons.notifications_active_outlined,
                    text: 'Configura avisos a tu medida',
                  ),
                  const Spacer(),
                  PrimaryButton(
                    label: 'Comenzar',
                    icon: Icons.arrow_forward_rounded,
                    onPressed: () => Navigator.pushNamed(context, '/login'),
                  ),
                  const SizedBox(height: 12),
                  Center(
                    child: TextButton(
                      onPressed: () => Navigator.pushNamed(context, '/register'),
                      child: const Text('Aún no tengo cuenta · Registrarme'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _WelcomeFeature extends StatelessWidget {
  const _WelcomeFeature({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 13),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppTheme.blue),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(color: AppTheme.ink, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}
