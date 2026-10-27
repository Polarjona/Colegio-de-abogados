class LegalUpdate {
  const LegalUpdate({
    required this.title,
    required this.category,
    required this.source,
    required this.date,
    required this.summary,
    required this.reference,
    this.isNew = false,
  });

  final String title;
  final String category;
  final String source;
  final String date;
  final String summary;
  final String reference;
  final bool isNew;
}
