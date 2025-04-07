import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final TextEditingController _emailController = TextEditingController();
  String error = '';
  String message = '';
  bool loading = false;

  // Submission of forgot password form
  Future<void> _handleSubmit() async {
    setState(() {
      error = '';
      message = '';
      loading = true;
    });

    // Retrieve email entered by user
    final String email = _emailController.text;

    try {
      final response = await http.post(

        // API endpoint for forgot password
        Uri.parse('https://api.scuba2havefun.xyz/api/auth/forgot-password'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'email': email}),
      );

      // Decode the JSON response
      final responseBody = json.decode(response.body);

      // Success
      if (response.statusCode == 200) {
        setState(() {
          message = responseBody['msg'] ??
              "Reset link sent! Please check your email.";
        });
      } 

      // Failure
      else {
        setState(() {
          error = responseBody['error'] ??
              responseBody['msg'] ??
              'Something went wrong. Please try again.';
        });
      }
    }

    catch (e) {
      setState(() {
        error = 'Something went wrong. Please try again.';
      });
    } 

    finally {
      setState(() {
        loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: RadialGradient(
            colors: [
              Color.fromRGBO(26, 27, 26, 1),
              Color.fromRGBO(6, 54, 21, 1),
            ],
            center: Alignment.center,
            radius: 1.0,
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Container(
              padding: const EdgeInsets.all(16.0),
              color: Color(0xFFF9E0C6),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset(
                    'assets/logo.png',
                    width: 100,
                    height: 100,
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Syllab.AI',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  Divider(height: 32, thickness: 2, color: Colors.black),
                  Text(
                    'Forgot Password',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 16),

                  // Instructions for user
                  Text(
                    'Enter your email address. We\'ll send you a link to reset your password.',
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: 16),

                  TextField(
                    controller: _emailController,
                    decoration: InputDecoration(
                      labelText: 'Email',
                      labelStyle: TextStyle(color: Colors.black),
                      filled: true,
                      fillColor: Color(0xFFF9E0C6),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(20),
                        borderSide: BorderSide(color: Colors.black),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(20),
                        borderSide: BorderSide(color: Colors.black),
                      ),
                    ),
                    keyboardType: TextInputType.emailAddress,
                  ),
                  SizedBox(height: 8),

                  // Show error message
                  if (error.isNotEmpty)
                    Text(
                      error,
                      style: TextStyle(color: Colors.red),
                    ),

                  // Show success message
                  if (message.isNotEmpty)
                    Text(
                      message,
                      style: TextStyle(color: Colors.green),
                    ),
                  SizedBox(height: 16),

                  // Submit button for password reset
                  ElevatedButton(
                    onPressed: loading ? null : _handleSubmit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Color(0xFF152555),
                      minimumSize: Size(double.infinity, 48),
                    ),

                    // Loading indicator
                    child: loading
                        ? SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor:
                                  AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : Text(
                            'Send Reset Link',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                            ),
                          ),
                  ),
                  SizedBox(height: 16),

                  // Navigate back to login
                  TextButton(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    style: TextButton.styleFrom(
                      foregroundColor: Color(0xFFA5370D),
                    ),
                    child: Text('Back to Login'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
