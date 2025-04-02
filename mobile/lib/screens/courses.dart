import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io';
import 'package:file_selector/file_selector.dart';

const String apiBaseUrl = 'https://api.scuba2havefun.xyz/api';

class CoursesScreen extends StatefulWidget {
  const CoursesScreen({super.key});

  @override
  State<CoursesScreen> createState() => _CoursesScreenState();
}

class _CoursesScreenState extends State<CoursesScreen> {
  List<Map<String, dynamic>> courses = [];
  bool isLoading = true;
  String? errorMessage;

  // Controllers for text input
  final TextEditingController _courseNameController = TextEditingController();
  final TextEditingController _courseNumberController = TextEditingController();

  // For PDF file selection
  String? _selectedFileName;
  File? _selectedPdfFile;
  XFile? _selectedXFile;

  @override
  void initState() {
    super.initState();
    fetchCourses();
  }

  // Fetch courses from the API
  Future<void> fetchCourses() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      // Get token from shared preferences (similar to localStorage)
      final prefs = await SharedPreferences.getInstance();
      final jwtToken = prefs.getString('token');

      if (jwtToken == null) {
        setState(() {
          isLoading = false;
          errorMessage = 'Not logged in. Please log in to view your courses.';
        });
        return;
      }

      final response = await http.get(
        Uri.parse('$apiBaseUrl/classes/allClasses?token=$jwtToken'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $jwtToken',
        },
      );

      final responseData = json.decode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Save updated token if provided
        if (responseData['token'] != null) {
          await prefs.setString('token', responseData['token']);
        }

        if (responseData['classes'] != null) {
          setState(() {
            // Transform API data to match our local format
            courses = List<Map<String, dynamic>>.from(
              responseData['classes'].map((course) => {
                'id': course['_id'] ?? '',
                'name': course['className'] ?? 'Unnamed Course',
                'number': course['courseNumber'] ?? 'Unknown Number',
                // You might need to calculate progress from the API data
                'progress': 0.5, // Default placeholder
              }),
            );
            isLoading = false;
          });
        } else {
          setState(() {
            courses = [];
            isLoading = false;
          });
        }
      } else {
        setState(() {
          isLoading = false;
          errorMessage = 'Failed to load courses: ${responseData['message'] ?? 'Unknown error'}';
        });
      }
    } catch (error) {
      setState(() {
        isLoading = false;
        errorMessage = 'Network error: $error';
      });
    }
  }

  // File picker method for PDF using file_selector
  Future<void> _pickPdfFile() async {
    // Define PDF file type
    final XTypeGroup pdfTypeGroup = XTypeGroup(
      label: 'PDFs',
      extensions: ['pdf'],
    );

    try {
      // Open file picker dialog
      final XFile? file = await openFile(
        acceptedTypeGroups: [pdfTypeGroup],
      );

      // If user cancels the picker, file will be null
      if (file == null) {
        return;
      }

      setState(() {
        _selectedXFile = file;
        _selectedFileName = file.name;
        _selectedPdfFile = File(file.path);
      });
    } catch (e) {
      debugPrint('Error picking PDF file: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error selecting file: $e')),
      );
    }
  }

  // Add a new course via API with PDF upload
  Future<void> addCourse(String name, String courseNumber) async {
    try {
      // Check if PDF is selected
      if (_selectedPdfFile == null || _selectedXFile == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select a PDF syllabus file')),
        );
        return;
      }

      // Get token from shared preferences
      final prefs = await SharedPreferences.getInstance();
      final jwtToken = prefs.getString('token');

      if (jwtToken == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Not logged in. Please log in to add courses.')),
        );
        return;
      }

      // Create multipart request
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$apiBaseUrl/classes/create'),
      );

      // Add headers
      request.headers.addAll({
        'Authorization': 'Bearer $jwtToken',
      });

      // Add text fields
      request.fields['className'] = name;
      request.fields['courseNumber'] = courseNumber;
      request.fields['token'] = jwtToken;

      // Add PDF file using XFile
      request.files.add(
        await http.MultipartFile.fromPath(
          'syllabusPdf',
          _selectedXFile!.path,
          filename: _selectedFileName,
        ),
      );


      print("Sending request to API...");
      print("Course Name: $name");
      print("Course Number: $courseNumber");
      print("Token: $jwtToken");
      print("File Path: ${_selectedXFile!.path}");

      // Send request

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      // print(response.body);
      final responseData = json.decode(response.body);

      print("Response status: ${response.statusCode}");
      print("Response body: ${response.body}");


      if (response.statusCode == 201 || response.statusCode == 200) {
        // Save updated token if provided
        if (responseData['token'] != null) {
          await prefs.setString('token', responseData['token']);
        }

        // Reset selected file
        setState(() {
          _selectedPdfFile = null;
          _selectedFileName = null;
          _selectedXFile = null;
        });

        // Refresh course list
        fetchCourses();

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Course "$name" added successfully')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to add course: ${responseData['message'] ?? 'Unknown error'}')),
        );
      }
    } catch (error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Network error: $error')),
      );
    }
  }


  // Delete a course via API
  Future<void> deleteCourse(String courseId) async {
    try {
      // Get token from shared preferences
      final prefs = await SharedPreferences.getInstance();
      final jwtToken = prefs.getString('token');

      if (jwtToken == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Not logged in. Please log in to delete courses.')),
        );
        return;
      }

      final response = await http.post(
        Uri.parse('$apiBaseUrl/classes/delete/$courseId?token=$jwtToken'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $jwtToken',
        },
      );

      final responseData = await json.decode(response.body);

          if (response.statusCode == 200) {
        // Save updated token if provided
        if (responseData['token'] != null) {
          await prefs.setString('token', responseData['token']);
        }

        // Refresh course list
        fetchCourses();

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Course deleted successfully')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete course: ${responseData['message'] ?? 'Unknown error'}')),
        );
      }
    } catch (error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Network error: $error')),
      );
    }
  }

  // Method to show add course dialog
  void _showAddCourseDialog() {
    // Reset controllers and file selection
    _courseNameController.clear();
    _courseNumberController.clear();
    _selectedFileName = null;
    _selectedPdfFile = null;
    _selectedXFile = null;

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
            builder: (context, setState) {
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
                        controller: _courseNumberController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Course Number',
                          hintText: 'Enter course number',
                        ),
                      ),
                      const SizedBox(height: 24),
                      // PDF Upload section
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text(
                            'Upload Syllabus PDF',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 8),
                          OutlinedButton.icon(
                            onPressed: () async {
                              await _pickPdfFile();
                              // Update the StatefulBuilder state to show selected file
                              setState(() {});
                            },
                            icon: const Icon(Icons.upload_file),
                            label: const Text('Select PDF File'),
                          ),
                          if (_selectedFileName != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 8),
                              child: Text(
                                'Selected: $_selectedFileName',
                                style: const TextStyle(color: Colors.green),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                        ],
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
                      if (_courseNameController.text.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please enter a course name')),
                        );
                        return;
                      }

                      if (_selectedPdfFile == null || _selectedXFile == null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please select a PDF syllabus file')),
                        );
                        return;
                      }

                      final courseName = _courseNameController.text;
                      final courseNumber = _courseNumberController.text;

                      // Close dialog first
                      Navigator.of(context).pop();

                      // Then add course via API
                      addCourse(courseName, courseNumber);
                    },
                    child: const Text('Add'),
                  ),
                ],
              );
            }
        );
      },
    );
  }

  // Method to show delete confirmation dialog
  void _showDeleteConfirmationDialog(int index) {
    final course = courses[index];

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Delete Course'),
          content: Text('Are you sure you want to delete "${course['name']}"?'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop(); // Close the dialog
              },
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                // Close dialog first
                Navigator.of(context).pop();

                // Then delete the course via API
                deleteCourse(course['id']);
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

  // Navigate to course details
  void _navigateToCourse(String courseId) {
    // Navigate to course details screen
    // Navigator.push(
    //   context,
    //   MaterialPageRoute(
    //     builder: (context) => CourseDetailScreen(courseId: courseId),
    //   ),
    // );

    // For now, just show a message
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Navigating to course $courseId')),
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
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: fetchCourses,
            tooltip: 'Refresh Courses',
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

              // Loading, error, or content
              Expanded(
                child: isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : errorMessage != null
                    ? Center(child: Text(errorMessage!, textAlign: TextAlign.center))
                    : courses.isEmpty
                    ? const Center(
                  child: Text(
                    'No courses added yet. Click "Add Syllabi" to add your first course.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey,
                    ),
                  ),
                )
                    : ListView.separated(
                  itemCount: courses.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final course = courses[index];
                    return GestureDetector(
                      onTap: () => _navigateToCourse(course['id']),
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
                                  Text(course['number']),
                                  const SizedBox(height: 8),
                                  LinearProgressIndicator(
                                    value: course['progress'] ?? 0.5, // Use actual progress from API if available
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
    _courseNumberController.dispose();
    super.dispose();
  }
}