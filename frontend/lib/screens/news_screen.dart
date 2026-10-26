import 'package:flutter/material.dart';

import '../data/demo_updates.dart';
import '../models/legal_update.dart';
import '../utils/app_theme.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/legal_update_card.dart';

class NewsScreen extends StatefulWidget {
  const NewsScreen({super.key});

  @override
  State<NewsScreen> createState() => _NewsScreenState();
}

class _NewsScreenState extends State<NewsScreen> {
  String? _category;

  @override
  Widget build(BuildContext context) {
    final updates = _category == null
        ? demoUpdates
        : demoUpdates.where((item) => item.category == _category).toList();
    return AppScaffold(
      title: 'Novedades jurídicas',
      showBack: true,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
            child: Column(
              children: [
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Buscar por título o referencia',
                    prefixIcon: const Icon(Icons.search_rounded),
                    suffixIcon: IconButton(
                      tooltip: 'Filtros',
                      onPressed: () async {
                        final selected = await Navigator.push<String>(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const FiltersScreenForResult(),
                          ),
                        );
                        if (selected != null && mounted) {
                          setState(
                            () => _category = selected.isEmpty ? null : selected,
                          );
                        }
                      },
                      icon: const Icon(Icons.tune_rounded),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 38,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      _FilterChip(
                        label: 'Todas',
                        selected: _category == null,
                        onTap: () => setState(() => _category = null),
                      ),
                      ...legalCategories.map(
                        (category) => _FilterChip(
                          label: category,
                          selected: _category == category,
                          onTap: () => setState(() => _category = category),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
              children: [
                Text(
                  '${updates.length} publicaciones',
                  style: const TextStyle(color: AppTheme.muted, fontSize: 12),
                ),
                const SizedBox(height: 12),
                ...updates.map(
                  (update) => LegalUpdateCard(
                    update: update,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => _NewsDetail(update: update),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 7),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
        labelStyle: TextStyle(
          color: selected ? Colors.white : AppTheme.ink,
          fontSize: 12,
        ),
        backgroundColor: Colors.white,
        selectedColor: AppTheme.navy,
        side: BorderSide(
          color: selected ? AppTheme.navy : AppTheme.border,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
      ),
    );
  }
}

class FiltersScreenForResult extends StatelessWidget {
  const FiltersScreenForResult({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Filtrar por área')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text('Selecciona un área para aplicarla a las novedades.'),
          const SizedBox(height: 14),
          ...legalCategories.map(
            (category) => ListTile(
              leading: const Icon(Icons.folder_open_rounded),
              title: Text(category),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () => Navigator.pop(context, category),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, ''),
            child: const Text('Mostrar todas'),
          ),
        ],
      ),
    );
  }
}

class _NewsDetail extends StatelessWidget {
  const _NewsDetail({required this.update});

  final LegalUpdate update;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detalle de novedad')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            update.category.toUpperCase(),
            style: const TextStyle(
              color: AppTheme.gold,
              fontWeight: FontWeight.w800,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            update.title,
            style: const TextStyle(
              color: AppTheme.navy,
              fontSize: 27,
              height: 1.2,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 18),
          Text('${update.source} · ${update.date}',
              style: const TextStyle(color: AppTheme.muted)),
          const Divider(height: 32),
          const Text(
            'Resumen',
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
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
          Text('Referencia: ${update.reference}',
              style: const TextStyle(color: AppTheme.muted)),
          const SizedBox(height: 20),
          const Text(
            'Contenido de demostración. La consulta real al BOE se conectará más adelante.',
            style: TextStyle(color: AppTheme.muted, fontSize: 12),
          ),
        ],
      ),
    );
  }
}
