import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class CoursesScreen extends StatefulWidget {
  const CoursesScreen({super.key});

  @override
  State<CoursesScreen> createState() => _CoursesScreenState();
}

class _CoursesScreenState extends State<CoursesScreen> {
  // List to store courses
  List<Map<String, dynamic>> courses = [];

  // Controllers for text input
  final TextEditingController _courseNameController = TextEditingController();
  final TextEditingController _modulesController = TextEditingController();

  // Method to show add course dialog
  void _showAddCourseDialog() {
    // Reset controllers
    _courseNameController.clear();
    _modulesController.clear();

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Add New Course'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: _courseNameController,
                decoration: const InputDecoration(
                  labelText: 'Course Name',
                  hintText: 'Enter course name',
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _modulesController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Number of Modules',
                  hintText: 'Enter number of modules',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop(); // Close the dialog
              },
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                // Validate inputs
                if (_courseNameController.text.isNotEmpty && 
                    _modulesController.text.isNotEmpty) {
                  // Add the course
                  setState(() {
                    courses.add({
                      'name': _courseNameController.text,
                      'modules': int.parse(_modulesController.text),
                    });
                  });
                  Navigator.of(context).pop(); // Close the dialog
                }
              },
              child: const Text('Add'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Courses'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _showAddCourseDialog,
            tooltip: 'Add Syllabi',
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // Add Syllabi button
            ElevatedButton.icon(
              onPressed: _showAddCourseDialog,
              icon: const Icon(Icons.add),
              label: const Text('Add Syllabi'),
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 50),
              ),
            ),
            const SizedBox(height: 16),
            
            // List of courses
            Expanded(
              child: ListView.separated(
                itemCount: courses.length,
                separatorBuilder: (context, index) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final course = courses[index];
                  return Container(
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: ListTile(
                      title: Text(course['name']),
                      subtitle: Text('${course['modules']} modules'),
                      trailing: LinearProgressIndicator(
                        value: 0.5, // Placeholder progress
                        backgroundColor: Colors.grey[300],
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.green[600]!),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Dispose controllers to prevent memory leaks
  @override
  void dispose() {
    _courseNameController.dispose();
    _modulesController.dispose();
    super.dispose();
  }
}