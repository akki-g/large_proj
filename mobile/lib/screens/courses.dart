import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io';
import 'package:file_selector/file_selector.dart';
import 'package:http_parser/http_parser.dart';

import 'class.dart';

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

  final TextEditingController _searchController = TextEditingController();
  String searchKeyword = '';

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

  List<Map<String, dynamic>> get filteredCourses {
    if (searchKeyword.isEmpty) return courses;
    final keyword = searchKeyword.toLowerCase();
    return courses.where((course) {
      final name = course['name'].toString().toLowerCase();
      final number = course['number'].toString().toLowerCase();
      return name.contains(keyword) || number.contains(keyword);
    }).toList();
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
        if (responseData['jwtToken'] != null) {
          await prefs.setString('jwtToken', responseData['jwtToken']);
        }

        if (responseData['classes'] != null) {
          final List<dynamic> classList = responseData['classes'];

          setState(() {
            // Transform API data to match our local format
            courses = classList.map<Map<String, dynamic>>((c) => {
              'id': c['_id'] ?? '',
              'name': c['name'] ?? '',
              'number': c['number'] ?? '',
              'progress': {
                'completedChapters': c['progress']?['completedChapters'] ?? 0,
                'totalChapters': c['progress']?['totalChapters'] ?? 10,
              },
            }).toList();
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
      uniformTypeIdentifiers: ['com.adobe.pdf'],
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
      request.fields['name'] = name;
      request.fields['number'] = courseNumber;
      request.fields['jwtToken'] = jwtToken;

      // Add PDF file using XFile
      request.files.add(
        await http.MultipartFile.fromPath(
          'syllabus',
          _selectedXFile!.path,
          filename: _selectedFileName,
          contentType: MediaType('application', 'pdf'),
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

      // JSON request body
      final Map<String, dynamic> requestBody = {
        'classID': courseId,
        'jwtToken': jwtToken,
      };

      // Send POST request
      final response = await http.post(
        Uri.parse('$apiBaseUrl/classes/delete'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $jwtToken',
        },
        body: jsonEncode(requestBody),
      );

      // Debug response
      print("Response status: ${response.statusCode}");
      print("Response body: ${response.body}");


      final responseData = await json.decode(response.body);

          if (response.statusCode == 200 || response.statusCode == 201) {
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
                backgroundColor: Color(0xFFF9E0C6),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                title: const Center(
                  child: Text(
                    'Create New Class',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'DynaPuff',
                      color: Color(0xFF246169),
                    ),
                  ),
                ),
                content: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TextField(
                        controller: _courseNameController,
                        decoration: const InputDecoration(
                          labelText: 'Course Name',
                          hintText: 'Enter course name',
                          labelStyle: TextStyle(color: Colors.black),
                          focusedBorder: UnderlineInputBorder(
                            borderSide: BorderSide(color: Colors.black),
                          ),
                          enabledBorder: UnderlineInputBorder(
                            borderSide: BorderSide(color: Colors.black),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _courseNumberController,
                        textCapitalization: TextCapitalization.characters,
                        keyboardType: TextInputType.text,
                        onChanged: (value) {
                          _courseNumberController.value = _courseNumberController.value.copyWith(
                            text: value.toUpperCase(),
                            selection: TextSelection.collapsed(offset: value.length),
                          );
                        },
                        decoration: const InputDecoration(
                          labelText: 'Course Number',
                          hintText: 'Enter course number',
                          labelStyle: TextStyle(color: Colors.black),
                          focusedBorder: UnderlineInputBorder(
                            borderSide: BorderSide(color: Colors.black),
                          ),
                          enabledBorder: UnderlineInputBorder(
                            borderSide: BorderSide(color: Colors.black),
                          ),
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
                              color: Colors.black,
                            ),
                          ),
                          const SizedBox(height: 8),
                          OutlinedButton.icon(
                            onPressed: () async {
                              await _pickPdfFile();
                              // Update the StatefulBuilder state to show selected file
                              setState(() {});
                            },
                            icon: const Icon(Icons.upload_file, color: Colors.black),
                            label: const Text('Select PDF File', style: TextStyle(color: Colors.black)),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Colors.black),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                            ),
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

                      FocusScope.of(context).unfocus();
                      SystemChannels.textInput.invokeMethod('TextInput.hide');

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
    // Find the course name and number based on courseId
    final courseIndex = courses.indexWhere((course) => course['id'] == courseId);
    if (courseIndex != -1) {
      final courseName = courses[courseIndex]['name'];
      final courseNumber = courses[courseIndex]['number'];

      // Navigate to course details screen
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => CourseDetailScreen(
            courseId: courseId,
            courseName: courseName,
            courseNumber: courseNumber,
          ),
        ),
      );
    } else {
      // Course not found in local data
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Course details not found')),
      );
    }
  }

  @override
Widget build(BuildContext context) {
  return Scaffold(
    appBar: AppBar(
      backgroundColor: const Color(0xFFF9E0C6),
      iconTheme: const IconThemeData(color: Colors.black),
      titleSpacing: 15,
      title: const Text(
        'say sylla-bye to your study troubles!',
        style: TextStyle(
          fontFamily: 'DynaPuff',
          fontWeight: FontWeight.w600,
          fontSize: 16,
          color: Color(0xFF246169),
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh),
          onPressed: fetchCourses,
          tooltip: 'Refresh Courses',
        ),
      ],
    ),
    body: Container(
      decoration: const BoxDecoration(
        gradient: RadialGradient(
          center: Alignment.center,
          radius: 1.0,
          colors: [
            Color.fromRGBO(26, 27, 26, 1),
            Color.fromRGBO(6, 54, 21, 1),
          ],
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Padding(
                padding: EdgeInsets.only(bottom: 8.0),
                child: Text(
                  'Welcome to your dashboard!',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontFamily: 'DynaPuff',
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Color.fromARGB(255, 187, 242, 250),
                  ),
                ),
              ),
              // Add Syllabi Button
              Padding(
                padding: const EdgeInsets.only(bottom: 16.0),
                child: ElevatedButton.icon(
                  onPressed: _showAddCourseDialog,
                  icon: const Icon(Icons.add, color: Colors.white),
                  label: const Text(
                    'Add Syllabus',
                    style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFA5370D),
                    padding: const EdgeInsets.symmetric(vertical: 12.0),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),

              Padding(
                padding: const EdgeInsets.only(bottom: 16.0),
                child: TextField(
                  controller: _searchController,
                  onChanged: (value) {
                    setState(() {
                      searchKeyword = value;
                    });
                  },
                  style: const TextStyle(color: Colors.black),
                  decoration: InputDecoration(
                    hintText: 'Search classes...',
                    hintStyle: const TextStyle(color: Colors.black54),
                    filled: true,
                    fillColor: const Color(0xFFF9E0C6),
                    contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    prefixIcon: const Icon(Icons.search, color: Colors.black),
                    suffixIcon: searchKeyword.isNotEmpty ? IconButton(
                      icon: const Icon(Icons.clear, color: Colors.black),
                      onPressed: () {
                        _searchController.clear();
                        setState(() {
                          searchKeyword = '';
                        });
                      },
                    )
                  : null,
                  ),
                ),
              ),

              // Courses or Loading/Error
              Expanded(
                child: isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : errorMessage != null
                        ? Center(
                            child: Text(
                              errorMessage!,
                              style: const TextStyle(
                                color: Color(0xFFF9E0C6),
                                fontSize: 16,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          )
                        : courses.isEmpty
                            ? const Center(
                                child: Text(
                                  'No courses added yet.\nClick "Add Syllabus" to get started.',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Color(0xFFF9E0C6),
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              )
                            : filteredCourses.isEmpty
                              ? const Center(
                                  child: Text(
                                    'No matching courses found.',
                                    style: TextStyle(
                                      fontSize: 16,
                                      color: Color(0xFFF9E0C6),
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                              )
                            : ListView.separated(
                                itemCount: filteredCourses.length,
                                separatorBuilder: (context, index) =>
                                    const SizedBox(height: 12),
                                itemBuilder: (context, index) {
                                  final course = filteredCourses[index];
                                  final completed = course['progress']['completedChapters'] ?? 0;
                                  final total = course['progress']['totalChapters'] ?? 10;
                                  return GestureDetector(
                                    onTap: () =>
                                        _navigateToCourse(course['id']),
                                    child: Container(
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF9E0C6),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Stack(
                                        children: [
                                          Padding(
                                            padding: const EdgeInsets.all(16.0),
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  course['name'],
                                                  style: const TextStyle(
                                                    fontSize: 18,
                                                    fontWeight: FontWeight.bold,
                                                    color: Colors.black,
                                                  ),
                                                ),
                                                const SizedBox(height: 4),
                                                Text(
                                                  course['number'],
                                                  style: const TextStyle(
                                                    color: Colors.black87,
                                                  ),
                                                ),
                                                const SizedBox(height: 8),
                                                Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    LinearProgressIndicator(
                                                      value: (completed / total).clamp(0.0, 1.0),
                                                      minHeight: 10,
                                                      backgroundColor: Colors.grey[800],
                                                      valueColor: AlwaysStoppedAnimation<Color>(Colors.green[600]!),
                                                    ),
                                                    const SizedBox(height: 4),
                                                    Text(
                                                      '$completed / $total chapters completed',
                                                      style: const TextStyle(
                                                        fontSize: 12,
                                                        color: Colors.black,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ],
                                            ),
                                          ),
                                          Positioned(
                                            top: 8,
                                            right: 8,
                                            child: IconButton(
                                              icon: const Icon(Icons.delete,
                                                  color: Colors.red),
                                              onPressed: () =>
                                                  _showDeleteConfirmationDialog(
                                                      index),
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