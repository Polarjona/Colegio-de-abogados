import 'package:flutter/material.dart';

import '../data/demo_updates.dart';
import '../models/legal_update.dart';
import '../utils/app_theme.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/legal_update_card.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Marco Legal',
      activeTab: 0,
      actions: [
        IconButton(
          tooltip: 'Filtrar novedades',
          onPressed: () => Navigator.pushNamed(context, '/filters'),
          icon: const Icon(Icons.tune_rounded),
        ),
      ],
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppTheme.navy,
              borderRadius: BorderRadius.circular(20),
              gradient: const LinearGradient(
                colors: [AppTheme.navy, AppTheme.blue],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'LUNES, 26 DE OCTUBRE',
                  style: TextStyle(
                    color: Color(0xFFD9C59E),
                    letterSpacing: 1.2,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Buenos días, Akram',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 23,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Aquí tienes la actualidad jurídica de hoy.',
                  style: TextStyle(color: Color(0xFFD5DEE4), fontSize: 13),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    const Icon(Icons.circle, color: AppTheme.gold, size: 8),
                    const SizedBox(width: 8),
                    const Text(
                      '2 novedades recientes',
                      style: TextStyle(color: Colors.white, fontSize: 12),
                    ),
                    const Spacer(),
                    TextButton(
                      onPressed: () => Navigator.pushNamed(context, '/news'),
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.white,
                        padding: EdgeInsets.zero,
                      ),
                      child: const Text('Ver todas  →'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          SectionHeading(
            title: 'Últimas novedades',
            actionLabel: 'Ver todas',
            onAction: () => Navigator.pushNamed(context, '/news'),
          ),
          ...demoUpdates.take(3).map(
                (update) => LegalUpdateCard(
                  update: update,
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => _DetailRoute(update: update),
                    ),
                  ),
                ),
              ),
          const SizedBox(height: 6),
          OutlinedButton.icon(
            onPressed: () => Navigator.pushNamed(context, '/filters'),
            icon: const Icon(Icons.filter_list_rounded),
            label: const Text('Personalizar áreas jurídicas'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.navy,
              minimumSize: const Size.fromHeight(48),
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

class _DetailRoute extends StatelessWidget {
  const _DetailRoute({required this.update});

  final LegalUpdate update;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detalle de novedad')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: ListView(
              children: [
                Text(
                  update.category.toUpperCase(),
                  style: const TextStyle(
                    color: AppTheme.gold,
                    letterSpacing: 1,
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  update.title,
                  style: const TextStyle(
                    color: AppTheme.navy,
                    fontSize: 27,
                    height: 1.2,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  '${update.source} · ${update.date}',
                  style: const TextStyle(color: AppTheme.muted),
                ),
                const Divider(height: 32),
                const Text(
                  'Resumen',
                  style: TextStyle(
                    color: AppTheme.ink,
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  update.summary,
                  style: const TextStyle(
                    color: AppTheme.ink,
                    fontSize: 16,
                    height: 1.6,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Referencia: ${update.reference}',
                  style: const TextStyle(color: AppTheme.muted, fontSize: 13),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Prototipo: contenido de ejemplo. La conexión con el BOE se incorporará en una fase posterior.',
                  style: TextStyle(color: AppTheme.muted, fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
