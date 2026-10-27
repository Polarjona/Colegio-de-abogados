import 'package:flutter/material.dart';

import '../data/demo_updates.dart';
import '../utils/app_theme.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/legal_update_card.dart';

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final consulted = demoUpdates.skip(2).toList();
    return AppScaffold(
      title: 'Historial',
      activeTab: 1,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        children: [
          const Text(
            'Lo que ya has consultado',
            style: TextStyle(
              color: AppTheme.navy,
              fontSize: 24,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 7),
          const Text(
            'Aquí encontrarás las publicaciones que has revisado.',
            style: TextStyle(color: AppTheme.muted),
          ),
          const SizedBox(height: 20),
          ...consulted.map(
            (update) => LegalUpdateCard(
              update: update,
              showReadDate: true,
              onTap: () => Navigator.pushNamed(context, '/news'),
            ),
          ),
        ],
      ),
    );
  }
}
