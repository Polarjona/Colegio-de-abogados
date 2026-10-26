import 'package:flutter/material.dart';

import '../models/legal_update.dart';
import '../utils/app_theme.dart';

class LegalUpdateCard extends StatelessWidget {
  const LegalUpdateCard({
    required this.update,
    required this.onTap,
    this.showReadDate = false,
    super.key,
  });

  final LegalUpdate update;
  final VoidCallback onTap;
  final bool showReadDate;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppTheme.border),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  _CategoryTag(label: update.category),
                  const Spacer(),
                  if (update.isNew && !showReadDate)
                    const Text(
                      'NUEVA',
                      style: TextStyle(
                        color: AppTheme.gold,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 11),
              Text(
                update.title,
                style: const TextStyle(
                  color: AppTheme.ink,
                  fontSize: 15,
                  height: 1.35,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(Icons.account_balance_outlined,
                      size: 15, color: AppTheme.muted),
                  const SizedBox(width: 5),
                  Expanded(
                    child: Text(
                      showReadDate ? 'Consultada el ${update.date}' : update.source,
                      style: const TextStyle(
                        color: AppTheme.muted,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  if (!showReadDate)
                    Text(
                      update.date,
                      style: const TextStyle(
                        color: AppTheme.muted,
                        fontSize: 11,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategoryTag extends StatelessWidget {
  const _CategoryTag({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0xFFEAF0F3),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        child: Text(
          label,
          style: const TextStyle(
            color: AppTheme.blue,
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
