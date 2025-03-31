import 'package:flutter/material.dart';

class CoursesScreen extends StatefulWidget {
  const CoursesScreen({super.key});

  @override
  State<CoursesScreen> createState() => _CoursesScreenState();
}

class _CoursesScreenState extends State<CoursesScreen> {
  // List to store courses
  List<Map<String, dynamic>> courses = []; // Initially empty

  // Controllers for text input
  final TextEditingController _courseNameController = TextEditingController();
  final TextEditingController _modulesController = TextEditingController();

  // Initialize with some sample courses to ensure content is visible
  @override
  void initState() {
    super.initState();
    // Uncomment this if you want to start with sample courses
    // courses = [
    //   {'name': 'Intro to Research', 'modules': 5},
    //   {'name': 'C Programming', 'modules': 5},
    // ];
  }

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
          content: SingleChildScrollView(
            child: Column(
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
                if (_courseNameController.text.isNotEmpty) {
                  // Add the course with default value for modules if empty
                  setState(() {
                    courses.add({
                      'name': _courseNameController.text,
                      'modules': _modulesController.text.isNotEmpty
                          ? int.parse(_modulesController.text)
                          : 5, // Default to 5 modules
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

  // Method to show delete confirmation dialog
  void _showDeleteConfirmationDialog(int index) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Delete Course'),
          content: Text('Are you sure you want to delete "${courses[index]['name']}"?'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop(); // Close the dialog
              },
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                // Delete the course
                setState(() {
                  courses.removeAt(index);
                });
                Navigator.of(context).pop(); // Close the dialog
              },
              style: TextButton.styleFrom(
                foregroundColor: Colors.red,
              ),
              child: const Text('Delete'),
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
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Add Syllabi button
              Padding(
                padding: const EdgeInsets.only(bottom: 16.0),
                child: ElevatedButton.icon(
                  onPressed: _showAddCourseDialog,
                  icon: const Icon(Icons.add),
                  label: const Text('Add Syllabi'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12.0),
                  ),
                ),
              ),

              // Message when no courses are available
              if (courses.isEmpty)
                const Expanded(
                  child: Center(
                    child: Text(
                      'No courses added yet. Click "Add Syllabi" to add your first course.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey,
                      ),
                    ),
                  ),
                )
              else
              // List of courses
                Expanded(
                  child: ListView.separated(
                    itemCount: courses.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final course = courses[index];
                      return Dismissible(
                        key: Key('course_${index}_${course['name']}'),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20.0),
                          color: Colors.red,
                          child: const Icon(
                            Icons.delete,
                            color: Colors.white,
                          ),
                        ),
                        confirmDismiss: (direction) async {
                          // Show confirmation dialog
                          _showDeleteConfirmationDialog(index);
                          return false; // Don't dismiss automatically
                        },
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.grey[200],
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Stack(
                            children: [
                              Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      course['name'],
                                      style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text('${course['modules']} modules'),
                                    const SizedBox(height: 8),
                                    LinearProgressIndicator(
                                      value: 0.5, // Placeholder progress
                                      minHeight: 10,
                                      backgroundColor: Colors.grey[300],
                                      valueColor: AlwaysStoppedAnimation<Color>(Colors.green[600]!),
                                    ),
                                  ],
                                ),
                              ),
                              Positioned(
                                top: 8,
                                right: 8,
                                child: IconButton(
                                  icon: const Icon(Icons.delete, color: Colors.red),
                                  onPressed: () => _showDeleteConfirmationDialog(index),
                                  tooltip: 'Delete Course',
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
            ],
          ),
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