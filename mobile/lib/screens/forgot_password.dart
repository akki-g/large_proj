import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class ForgotPasswordPage extends StatefulWidget {
  @override
  _ForgotPasswordPageState createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final TextEditingController _emailController = TextEditingController();
  String error = '';
  String message = '';
  bool loading = false;

  Future<void> _handleSubmit() async {
    setState(() {
      error = '';
      message = '';
      loading = true;
    });
    final String email = _emailController.text;

    try {
      final response = await http.post(
        Uri.parse('https://api.scuba2havefun.xyz/api/auth/forgot-password'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'email': email}),
      );

      final responseBody = json.decode(response.body);

      if (response.statusCode == 200) {
        setState(() {
          message = responseBody['msg'] ?? "Reset link sent! Please check your email.";
        });
      } else {
        setState(() {
          error = responseBody['error'] ??
              responseBody['msg'] ??
              'Something went wrong. Please try again.';
        });
      }
    } catch (e) {
      setState(() {
        error = 'Something went wrong. Please try again.';
      });
    } finally {
      setState(() {
        loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
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
              Divider(height: 32, thickness: 2),
              Text(
                'Forgot Password',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 16),
              Text(
                'Enter your email address. We\'ll send you a link to reset your password.',
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 16),
              TextField(
                controller: _emailController,
                decoration: InputDecoration(
                  labelText: 'Email',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.emailAddress,
              ),
              SizedBox(height: 8),
              if (error.isNotEmpty)
                Text(
                  error,
                  style: TextStyle(color: Colors.red),
                ),
              if (message.isNotEmpty)
                Text(
                  message,
                  style: TextStyle(color: Colors.green),
                ),
              SizedBox(height: 16),
              ElevatedButton(
                onPressed: loading ? null : _handleSubmit,
                style: ElevatedButton.styleFrom(
                  minimumSize: Size(double.infinity, 48),
                ),
                child: loading
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Text('Send Reset Link'),
              ),
              SizedBox(height: 16),
              TextButton(
                onPressed: () {
                  Navigator.pop(context);
                },
                child: Text('Back to Login'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
