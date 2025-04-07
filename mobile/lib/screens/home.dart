import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'login.dart';
import 'chatbot.dart';
import 'courses.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  // Tracks current tab
  int _selectedIndex = 0;

  // Fields for delete account
  String _deletePassword = '';
  bool _isDeleting = false;
  String _deleteError = '';
  bool _obscureDeletePassword = true;

  // Fields for reset password
  String _resetEmail = '';
  bool _isResetting = false;
  String _resetError = '';
  String _resetMessage = '';

  // Profile data
  String _firstName = '';
  String _lastName = '';
  String _fullName = '';
  String _email = '';

  // Screens
  final List<Widget> _screens = [
    CoursesScreen(),
    ChatPage(),
  ];

  // Delete account
  Future<void> deleteAccount(String password) async {
    if (_deletePassword.trim().isEmpty) {
      setState(() {
        _deleteError =
            'Please enter your password to confirm account deletion.';
      });
      return;
    }

    try {
      setState(() {
        _isDeleting = true;
        _deleteError = '';
      });

      SharedPreferences prefs = await SharedPreferences.getInstance();
      String? jwtToken = prefs.getString('token');

      if (jwtToken == null || jwtToken.isEmpty) {
        setState(() {
          _deleteError = 'No authentication token found. Please log in again.';
          _isDeleting = false;
        });
        return;
      }

      final response = await http.post(

        // API endpoint for delete account
        Uri.parse('https://api.scuba2havefun.xyz/api/auth/delete-account'),
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: jsonEncode({
          'password': _deletePassword,
          'jwtToken': jwtToken,
        }),
      );

      if (response.statusCode != 200 && response.statusCode != 201) {
        final jsonResponse = jsonDecode(response.body);
        String errorMsg = jsonResponse['msg'] ??
            jsonResponse['error'] ??
            'An error occurred while trying to delete your account. Please try again.';
        throw Exception(errorMsg);
      }

      // Clear token and navigate to login
      await prefs.remove('token');
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => LoginScreen()),
      );
    } 
    catch (e) {
      setState(() {
        _deleteError = e.toString();
      });
    } 
    finally {
      setState(() {
        _isDeleting = false;
      });
    }
  }

  // Password reset
  Future<String> resetPassword(String email) async {
    await Future.delayed(Duration(seconds: 2));
    final response = await http.post(

      // API endpoint for password reset
      Uri.parse('https://api.scuba2havefun.xyz/api/auth/forgot-password'),
      body: {'email': email},
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final jsonResponse = jsonDecode(response.body);
      return jsonResponse['msg'];
    } else {
      throw Exception('Failed to send reset email.');
    }
  }

  // Selected tab from navigation bar
  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  // Profle data
  Future<void> profileData() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    if (token == null || token.isEmpty) {
      throw Exception('No token found. Please log in again.');
    }

    final response = await http.post(

      // API endpong for profile data
      Uri.parse('https://api.scuba2havefun.xyz/api/auth/retrieve-data'),
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: jsonEncode({'jwtToken': token}),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = jsonDecode(response.body);

      setState(() {
        _firstName = data['firstName'] ?? '';
        _lastName = data['lastName'] ?? '';
        _fullName = data['fullName'] ?? '';
        _email = data['email'] ?? '';
      });

      // Refresh token if available
      if (data['token'] != null) {
        await prefs.setString('token', data['token']);
      }

      return;
    } 
    else {
      throw Exception('Failed to retrieve profile data.');
    }
  }

  void _showSettings(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Color(0xFFF9E0C6),
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Text(
                'Settings',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
            ),
            SizedBox(height: 20),
            ListTile(
              leading: Icon(Icons.delete_forever, color: Colors.red),
              title: Text('Delete Account',
                  style: TextStyle(color: Colors.red)),
              onTap: () {
                Navigator.of(context).pop();
                _showDeleteAccountDialog(context);
              },
            ),
            ListTile(
              leading: Icon(Icons.lock_reset),
              title: Text('Reset Password'),
              onTap: () {
                Navigator.of(context).pop();
                _showResetPasswordDialog(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showProfile(BuildContext context) async {
    try {
      await profileData(); 
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          backgroundColor: Color(0xFFF9E0C6),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: Center(
            child: Text(
              'Profile',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: Colors.white,
                child: Icon(Icons.person, color: Color(0xFF246169)),
              ),
              SizedBox(height: 16),
              Text(
                'Name: $_fullName',
                textAlign: TextAlign.center,
              ),
              Text(
                'Email: $_email',
                textAlign: TextAlign.center,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text('Close'),
            ),
          ],
        ),
      );
    } 
    catch (e) {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Text('Error'),
          content: Text('Failed to load profile data: $e'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text('Close'),
            ),
          ],
        ),
      );
    }
  }

  void _showDeleteAccountDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return AlertDialog(
              backgroundColor: Color(0xFFF9E0C6),
              title: Center(child: Text('Delete Account')),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Are you sure you want to delete your account? This action cannot be undone.',
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: 10),
                  Text(
                    'Please enter your password to confirm:',
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: 20),
                  TextField(
                    obscureText: _obscureDeletePassword,
                    decoration: InputDecoration(
                      labelText: 'Password',
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
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscureDeletePassword
                              ? Icons.visibility_off
                              : Icons.visibility,
                          color: Colors.black,
                        ),
                        onPressed: () {
                          setStateDialog(() {
                            _obscureDeletePassword = !_obscureDeletePassword;
                          });
                        },
                      ),
                    ),
                    onChanged: (value) {
                      setStateDialog(() {
                        _deletePassword = value;
                      });
                    },
                  ),
                  if (_deleteError.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 8.0),
                      child: Text(
                        _deleteError,
                        style: TextStyle(color: Colors.red),
                        textAlign: TextAlign.center,
                      ),
                    ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    setState(() {
                      _deletePassword = '';
                      _deleteError = '';
                    });
                  },
                  child: Text('Cancel'),
                ),
                TextButton(
                  onPressed: _isDeleting || _deletePassword.trim().isEmpty
                      ? null
                      : () async {
                          setStateDialog(() {
                            _isDeleting = true;
                            _deleteError = '';
                          });
                          try {
                            await deleteAccount(_deletePassword);
                            Navigator.of(context).pop();
                            Navigator.pushReplacement(
                              context,
                              MaterialPageRoute(
                                  builder: (context) => LoginScreen()),
                            );
                          } catch (e) {
                            setStateDialog(() {
                              _deleteError = e.toString();
                            });
                          } finally {
                            setState(() {
                              _deletePassword = '';
                              _isDeleting = false;
                            });
                          }
                        },
                  child: _isDeleting
                      ? SizedBox(
                          width: 20,
                          height: 20,
                          child:
                              CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text('Delete Account'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showResetPasswordDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return AlertDialog(
              backgroundColor: Color(0xFFF9E0C6),
              title: Center(child: Text('Reset Password')),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Enter your email address to reset your password:',
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: 10),
                  TextField(
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
                    onChanged: (value) {
                      setStateDialog(() {
                        _resetEmail = value;
                      });
                    },
                  ),
                  if (_resetError.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 8.0),
                      child: Text(
                        _resetError,
                        style: TextStyle(color: Colors.red),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  if (_resetMessage.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 8.0),
                      child: Text(
                        _resetMessage,
                        style: TextStyle(color: Colors.green),
                        textAlign: TextAlign.center,
                      ),
                    ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    setState(() {
                      _resetEmail = '';
                      _resetError = '';
                      _resetMessage = '';
                    });
                  },
                  child: Text('Cancel'),
                ),
                TextButton(
                  onPressed: _isResetting || _resetEmail.trim().isEmpty
                      ? null
                      : () async {
                          setStateDialog(() {
                            _isResetting = true;
                            _resetError = '';
                            _resetMessage = '';
                          });

                          try {
                            await resetPassword(_resetEmail);
                            setStateDialog(() {
                              _resetMessage =
                                  'Password reset email sent. Please check your inbox.';
                            });
                          } catch (e) {
                            setStateDialog(() {
                              _resetError = e.toString();
                            });
                          } finally {
                            setState(() {
                              _isResetting = false;
                            });
                          }
                        },
                  child: _isResetting
                      ? SizedBox(
                          width: 20,
                          height: 20,
                          child:
                              CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text('Send Reset Email'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Color(0xFFF9E0C6),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: Center(
          child: Text(
            'Confirm Logout',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
        ),
        content: Text(
          'Are you sure you want to logout?',
          textAlign: TextAlign.center,
        ),
        actionsAlignment: MainAxisAlignment.spaceEvenly,
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => LoginScreen()),
              );
            },
            child: Text(
              'Logout',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Color(0xFFF9E0C6),
        centerTitle: true,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset(
              'assets/logo.png',
              height: 32,
            ),
            SizedBox(width: 8),
            Text(
              'Syllab.AI',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Color(0xFF246169),
                fontFamily: 'DynaPuff',
              ),
            ),
          ],
        ),
        actions: [
          PopupMenuButton<String>(
            icon: Icon(Icons.more_vert, color: Colors.black),
            color: Color(0xFFF9E0C6),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            onSelected: (value) {
              if (value == 'profile') {
                _showProfile(context);
              } else if (value == 'settings') {
                _showSettings(context);
              } else if (value == 'logout') {
                _confirmLogout(context);
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'profile',
                child: Row(
                  children: [
                    Icon(Icons.account_box, color: Colors.black),
                    SizedBox(width: 8),
                    Text(
                      'Profile',
                      style: TextStyle(color: Colors.black),
                    ),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'settings',
                child: Row(
                  children: [
                    Icon(Icons.settings, color: Colors.black),
                    SizedBox(width: 8),
                    Text(
                      'User Settings',
                      style: TextStyle(color: Colors.black),
                    ),
                  ],
                ),
              ),
              PopupMenuItem(
                enabled: false,
                height: 0,
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 4.0),
                  child: Divider(
                    thickness: 1,
                    color: Colors.black,
                    height: 1,
                  ),
                ),
              ),
              PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(Icons.logout, color: Colors.red),
                    SizedBox(width: 8),
                    Text(
                      'Logout',
                      style: TextStyle(color: Colors.red),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        backgroundColor: Color(0xFFF9E0C6),
        selectedItemColor: Color(0xFF152555),
        unselectedItemColor: Colors.grey,
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        items: [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.android),
            label: 'Chatbot',
          ),
        ],
      ),
    );
  }
}
