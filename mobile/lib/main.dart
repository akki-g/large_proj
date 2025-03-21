import 'package:flutter/material.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primaryColor: Colors.green,
      ),
      home: LoginScreen(),
    );
  }
}

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

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
                Text("Syllab.ai", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF2D6169), fontFamily: 'DynaPuff', fontStyle: FontStyle.normal)),
                Divider(),
                Text("Login", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                SizedBox(height: 10),
                TextField(decoration: InputDecoration(labelText: "Email")),
                TextField(obscureText: true, decoration: InputDecoration(labelText: "Password")),
                SizedBox(height: 20),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color(0xFF152555),
                    foregroundColor: Colors.white,
                    shadowColor: Colors.black,
                  ),
                  onPressed: () {},
                  child: Text("Login", style: TextStyle(color: Colors.white)),
                ),
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
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class RegisterScreen extends StatelessWidget {
  const RegisterScreen({super.key});

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
                Text("Syllab.ai", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF2D6169), fontFamily: 'DynaPuff', fontStyle: FontStyle.normal)),
                Divider(),
                Text("Register", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                SizedBox(height: 10),
                TextField(decoration: InputDecoration(labelText: "First Name")),
                TextField(decoration: InputDecoration(labelText: "Last Name")),
                TextField(decoration: InputDecoration(labelText: "Email")),
                TextField(obscureText: true, decoration: InputDecoration(labelText: "Password")),
                TextField(decoration: InputDecoration(labelText: "Phone Number")),
                SizedBox(height: 20),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color(0xFF152555),
                    foregroundColor: Colors.white,
                    shadowColor: Colors.black,
                  ),
                  onPressed: () {},
                  child: Text("Register", style: TextStyle(color: Colors.white)),
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
    );
  }
}
