import 'package:flutter/material.dart';

import '../data/demo_updates.dart';
import '../utils/app_theme.dart';
import '../widgets/app_scaffold.dart';

class FiltersScreen extends StatefulWidget {
  const FiltersScreen({super.key});

  @override
  State<FiltersScreen> createState() => _FiltersScreenState();
}

class _FiltersScreenState extends State<FiltersScreen> {
  final Set<String> _selected = {};

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Áreas jurídicas',
      showBack: true,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        children: [
          const Text(
            'Elige tus temas',
            style: TextStyle(
              color: AppTheme.navy,
              fontSize: 25,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Selecciona las áreas que quieres consultar. Puedes cambiar esta selección cuando quieras.',
            style: TextStyle(color: AppTheme.muted, height: 1.45),
          ),
          const SizedBox(height: 20),
          ...legalCategories.map(
            (category) => Card(
              margin: const EdgeInsets.only(bottom: 9),
              color: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
                side: const BorderSide(color: AppTheme.border),
              ),
              child: CheckboxListTile(
                value: _selected.contains(category),
                onChanged: (selected) {
                  setState(() {
                    if (selected ?? false) {
                      _selected.add(category);
                    } else {
                      _selected.remove(category);
                    }
                  });
                },
                activeColor: AppTheme.navy,
                title: Text(category),
                secondary: const Icon(Icons.folder_open_rounded,
                    color: AppTheme.blue),
                controlAffinity: ListTileControlAffinity.trailing,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          PrimaryButton(
            label: 'Aplicar selección',
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    _selected.isEmpty
                        ? 'Se mostrarán todas las áreas.'
                        : 'Preferencias guardadas para esta demostración.',
                  ),
                ),
              );
              Navigator.pop(context);
            },
          ),
        ],
      ),
    );
  }
}
