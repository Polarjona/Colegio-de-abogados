import 'package:flutter/material.dart';

import 'screens/auth_screens.dart';
import 'screens/filters_screen.dart';
import 'screens/history_screen.dart';
import 'screens/home_screen.dart';
import 'screens/news_screen.dart';
import 'screens/notification_preferences_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/welcome_screen.dart';
import 'utils/app_theme.dart';

void main() {
  runApp(const MarcoLegalApp());
}

class MarcoLegalApp extends StatelessWidget {
  const MarcoLegalApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Marco Legal',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      initialRoute: '/welcome',
      routes: {
        '/welcome': (_) => const WelcomeScreen(),
        '/login': (_) => const LoginScreen(),
        '/register': (_) => const RegisterScreen(),
        '/home': (_) => const HomeScreen(),
        '/news': (_) => const NewsScreen(),
        '/filters': (_) => const FiltersScreen(),
        '/history': (_) => const HistoryScreen(),
        '/settings': (_) => const SettingsScreen(),
        '/notifications': (_) => const NotificationPreferencesScreen(),
      },
    );
  }
}
