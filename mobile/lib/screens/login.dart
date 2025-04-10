import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'register.dart';
import 'home.dart';
import 'forgot_password.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}
class _LoginScreenState extends State<LoginScreen> {
  // Controllers for input fields
  final emailController = TextEditingController();
  final passwordController = TextEditingController();

  // Toggles password visibility
  bool _obscurePassword = true;

  // Stores error message if login fails
  String? _errorText;

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  // Styles for input fields
  InputDecoration _roundedInputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(30),
        borderSide: BorderSide(color: Colors.black),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(30),
        borderSide: BorderSide(color: Colors.black),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(30),
        borderSide: BorderSide(color: Colors.black, width: 2),
      ),
      contentPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 16),
    );
  }

  void _login() async {
    final email = emailController.text.trim();
    final password = passwordController.text;

    setState(() => _errorText = null);

    // Check if fields are empty
    if (email.isEmpty || password.isEmpty) {
      setState(() => _errorText = 'Please enter both email and password.');
      return;
    }

    // API endpoint for login
    final url = Uri.parse('https://api.scuba2havefun.xyz/api/auth/login');

    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      // Success
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final token = data['token'];

        // Stores token
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', token);
        
        // Navigate to home page
        setState(() => _errorText = null);
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => HomePage(),
          ),
        );
      }

      // Failure
      else {
        final error = jsonDecode(response.body);

        setState(() {
          _errorText = "Login failed: ${error['message'] ?? 'Unknown error'}";
        });
      }
    }

    catch (e) {
      setState(() {
        _errorText = 'Error: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: RadialGradient(
            colors: [Color.fromRGBO(26, 27, 26, 1), Color.fromRGBO(6, 54, 21, 1)],
            center: Alignment.center,
            radius: 1.0,
          ),
        ),
        child: Center(
          child: Container(
            padding: EdgeInsets.all(20),
            width: 350,
            decoration: BoxDecoration(
              color: Color(0xFFF9E0C6),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Image.asset('assets/logo.png', height: 80),
                Text(
                  "Syllab.AI",
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2D6169),
                    fontFamily: 'DynaPuff',
                  ),
                ),
                Divider(
                  color: Color(0xFF152555),
                  thickness: 1,
                  indent: 20,
                  endIndent: 20,
                ),
                Text("Login", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                SizedBox(height: 10),

                // Email input field
                TextField(
                  controller: emailController,
                  decoration: _roundedInputDecoration("Email"),
                ),
                SizedBox(height: 10),

                // Password input field
                TextField(
                  controller: passwordController,
                  obscureText: _obscurePassword,
                  decoration: _roundedInputDecoration("Password").copyWith(
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_off : Icons.visibility,
                        color: Colors.grey,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscurePassword = !_obscurePassword;
                        });
                      },
                    ),
                  ),
                ),
                SizedBox(height: 20),

                // Error message if login fails
                if (_errorText != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    child: Text(
                      _errorText!,
                      style: TextStyle(color: Colors.red, fontSize: 14),
                      textAlign: TextAlign.center,
                    ),
                  ),

                // Login button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Color(0xFF152555),
                      foregroundColor: Colors.white,
                      shadowColor: Colors.black,
                      minimumSize: Size(double.infinity, 50),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30),
                      ),
                    ),
                    onPressed: _login,
                    child: Text("Login", style: TextStyle(fontSize: 16)),
                  ),
                ),

                // Links to register and forgot password
                Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text("Don't have an account?", style: TextStyle(color: Colors.black)),
                        TextButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) => RegisterScreen()),
                            );
                          },
                          child: Text("Register", style: TextStyle(color: Color(0xFFA5370D))),
                        ),
                      ],
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => ForgotPasswordPage()),
                        );
                      },
                      child: Text("Forgot Password", style: TextStyle(color: Color(0xFFA5370D)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
