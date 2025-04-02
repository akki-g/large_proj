import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'login.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final firstNameController = TextEditingController();
  final lastNameController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final confirmPasswordController = TextEditingController();
  final phoneController = TextEditingController();

  String? _errorText;
  String? _successText;

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  bool _hasMinLength = false;
  bool _hasUpper = false;
  bool _hasLower = false;
  bool _hasDigit = false;
  bool _hasSpecial = false;

  @override
  void dispose() {
    firstNameController.dispose();
    lastNameController.dispose();
    emailController.dispose();
    passwordController.dispose();
    confirmPasswordController.dispose();
    phoneController.dispose();
    super.dispose();
  }

  bool _isValidPassword(String password) {
    return _hasMinLength && _hasUpper && _hasLower && _hasDigit && _hasSpecial;
  }

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

  Widget _buildPasswordRule(bool condition, String label) {
    return Row(
      children: [
        Icon(
          condition ? Icons.check_circle : Icons.cancel,
          color: condition ? Colors.green : Colors.red,
          size: 18,
        ),
        SizedBox(width: 6),
        Text(label, style: TextStyle(fontSize: 13)),
      ],
    );
  }

  void _register() async {
    final firstName = firstNameController.text.trim();
    final lastName = lastNameController.text.trim();
    final email = emailController.text.trim();
    final password = passwordController.text;
    final confirmPassword = confirmPasswordController.text;
    final phone = phoneController.text.trim();
    
    setState(() {
      _errorText = null;
      _successText = null;
    });
    

    if ([firstName, lastName, email, password, confirmPassword, phone].any((e) => e.isEmpty)) {
      setState(() => _errorText = 'Please fill all fields.');
      return;
    }

    if (password != confirmPassword) {
      setState(() => _errorText = 'Passwords do not match.');
      return;
    }

    if (!_isValidPassword(password)) {
      setState(() => _errorText = 'Password must include at least one uppercase, lowercase, number, and special character.');
      return;
    }

    final url = Uri.parse('https://api.scuba2havefun.xyz/api/auth/register');

    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'firstName': firstName,
          'lastName': lastName,
          'email': email,
          'password': password,
          'phone': phone,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        setState(() {
          _errorText = null;
          _successText = 'Registration successful! Please verify your email.';
        });
        
        await Future.delayed((Duration(seconds: 3)));
        
        if (mounted) {
          Navigator.pop(context);
        }
      }

      else {
        String message = 'Registation failed. Try again.';

        try {
          if (response.body.isNotEmpty) {
            final error = jsonDecode(response.body);
            
            if (error['message'] != null && error['message'].toString().toLowerCase().contains('email')) {
              message = 'An account with that email already exists.';
            }

            else if (error['message'].toString().toLowerCase().contains('phone')) {
              message = 'An account with that phone number already exists.';
            }

            else {
              message = error['message'] ?? message;
            }
          }
        }

        catch (e) {
          message = 'Something went wrong. Please try again';
        }

        setState(() {
          _errorText = message;
          _successText = null;
        });
      }
    }

    catch (e) {
      setState(() {
        _errorText = 'Something went wrong. Please try again.';
        _successText = null;
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
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Image.asset('assets/logo.png', height: 80),
                  Text(
                    "Syllab.ai",
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
                  Text("Register", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  SizedBox(height: 10),
                  TextField(
                    controller: firstNameController,
                    decoration: _roundedInputDecoration("First Name"),
                  ),
                  SizedBox(height: 10),
                  TextField(
                    controller: lastNameController,
                    decoration: _roundedInputDecoration("Last Name"),
                  ),
                  SizedBox(height: 10),
                  TextField(
                    controller: emailController,
                    decoration: _roundedInputDecoration("Email"),
                  ),
                  SizedBox(height: 10),
                  TextField(
                    controller: passwordController,
                    obscureText: _obscurePassword,
                    onChanged: (value) {
                      setState(() {
                        _hasMinLength = value.length >= 8;
                        _hasUpper = RegExp(r'[A-Z]').hasMatch(value);
                        _hasLower = RegExp(r'[a-z]').hasMatch(value);
                        _hasDigit = RegExp(r'\d').hasMatch(value);
                        _hasSpecial = RegExp(r'[@\$!%*?&./#^]').hasMatch(value);
                      });
                    },
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
                  SizedBox(height: 10),
                  TextField(
                    controller: confirmPasswordController,
                    obscureText: _obscureConfirmPassword,
                    decoration: _roundedInputDecoration("Confirm Password").copyWith(
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscureConfirmPassword ? Icons.visibility_off : Icons.visibility,
                          color: Colors.grey,
                        ),
                        onPressed: () {
                          setState(() {
                            _obscureConfirmPassword = !_obscureConfirmPassword;
                          });
                        },
                      ),
                    ),
                  ),
                  SizedBox(height: 10),
                  TextField(
                    controller: phoneController,
                    decoration: _roundedInputDecoration("Phone Number"),
                  ),
                  if (passwordController.text.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      child: Align(
                        alignment: Alignment.center,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _buildPasswordRule(_hasMinLength, "At least 8 characters"),
                            _buildPasswordRule(_hasUpper, "At least one uppercase letter"),
                            _buildPasswordRule(_hasLower, "At least one lowercase letter"),
                            _buildPasswordRule(_hasDigit, "At least one number"),
                            _buildPasswordRule(_hasSpecial, "At least one special character"),
                          ],
                        ),
                      ),
                    ),
                  if (_errorText != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8.0, bottom: 4.0),
                      child: Text(
                        _errorText!,
                        style: TextStyle(color: Colors.red, fontSize: 13),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  if (_successText != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8.0),
                      child: Text(
                        _successText!,
                        style: TextStyle(color: Colors.green, fontSize: 13, fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  SizedBox(height: 10),
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
                      onPressed: _register,
                      child: Text("Register", style: TextStyle(fontSize: 16)),
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    child: Text("Back to Login", style: TextStyle(color: Color(0xFFA5370D))),
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