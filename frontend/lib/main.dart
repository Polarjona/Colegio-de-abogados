import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import 'screens/auth_screens.dart';
import 'screens/filters_screen.dart';
import 'screens/history_screen.dart';
import 'screens/home_screen.dart';
import 'screens/news_screen.dart';
import 'screens/notification_preferences_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/welcome_screen.dart';
import 'utils/app_theme.dart';

final navigatorKey = GlobalKey<NavigatorState>();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await _configureMessaging();
  runApp(const MarcoLegalApp());
}

Future<void> _configureMessaging() async {
  final messaging = FirebaseMessaging.instance;
  await messaging.requestPermission();
  FirebaseAuth.instance.authStateChanges().listen((user) async {
    if (user == null) return;
    await _saveDeviceToken(user.uid, await messaging.getToken());
    messaging.onTokenRefresh.listen(
      (token) => _saveDeviceToken(user.uid, token),
    );
  });
}

Future<void> _saveDeviceToken(String userId, String? token) async {
  if (token == null || token.isEmpty) return;
  await FirebaseFirestore.instance.collection('deviceTokens').doc(token).set({
    'token': token,
    'userId': userId,
    'active': true,
    'updatedAt': FieldValue.serverTimestamp(),
  }, SetOptions(merge: true));
}

class MarcoLegalApp extends StatelessWidget {
  const MarcoLegalApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
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
