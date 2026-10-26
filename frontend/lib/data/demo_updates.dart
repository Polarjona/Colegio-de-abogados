import '../models/legal_update.dart';

const demoUpdates = [
  LegalUpdate(
    title: 'Actualización de la Ley de Procedimiento Administrativo',
    category: 'Administrativo',
    source: 'Boletín Oficial del Estado',
    date: 'Hoy · 09:42',
    summary:
        'Se publica una actualización que introduce cambios en los plazos y en la tramitación electrónica de determinados procedimientos administrativos.',
    reference: 'BOE-A-2026-10482',
    isNew: true,
  ),
  LegalUpdate(
    title: 'Modificación de medidas de protección laboral',
    category: 'Laboral',
    source: 'Boletín Oficial del Estado',
    date: 'Ayer · 16:20',
    summary:
        'Nuevas disposiciones sobre medidas de conciliación y protección de las personas trabajadoras.',
    reference: 'BOE-A-2026-10371',
    isNew: true,
  ),
  LegalUpdate(
    title: 'Reforma de la normativa de arrendamientos urbanos',
    category: 'Civil',
    source: 'Boletín Oficial del Estado',
    date: '22 oct 2026',
    summary:
        'Cambios normativos relacionados con los contratos de arrendamiento y las obligaciones de las partes.',
    reference: 'BOE-A-2026-10156',
  ),
  LegalUpdate(
    title: 'Criterios de aplicación en materia tributaria',
    category: 'Fiscal',
    source: 'Boletín Oficial del Estado',
    date: '20 oct 2026',
    summary:
        'Se actualizan los criterios interpretativos aplicables a varios supuestos tributarios.',
    reference: 'BOE-A-2026-09924',
  ),
  LegalUpdate(
    title: 'Disposiciones sobre sociedades mercantiles',
    category: 'Mercantil',
    source: 'Boletín Oficial del Estado',
    date: '18 oct 2026',
    summary:
        'Nuevas disposiciones relativas al registro y funcionamiento de las sociedades mercantiles.',
    reference: 'BOE-A-2026-09610',
  ),
  LegalUpdate(
    title: 'Revisión de disposiciones del Código Penal',
    category: 'Penal',
    source: 'Boletín Oficial del Estado',
    date: '15 oct 2026',
    summary:
        'Publicación de cambios y disposiciones complementarias en materia penal.',
    reference: 'BOE-A-2026-09133',
  ),
];

const legalCategories = [
  'Civil',
  'Penal',
  'Laboral',
  'Mercantil',
  'Administrativo',
  'Fiscal',
];
