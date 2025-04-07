import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart'; // Add this package for date formatting
import 'quiz.dart';

const String apiBaseUrl = 'https://api.scuba2havefun.xyz/api';

// Models to match your interfaces
class ChapterData {
  final bool isCompleted;
  final double quizScore;
  final DateTime? completedAt;
  final int attempts;
  final String id;
  final String chapterName;
  final String className;
  final String classID;
  final String summary;
  final String userID;
  final List<String> quiz;

  ChapterData({
    required this.isCompleted,
    required this.quizScore,
    this.completedAt,
    required this.attempts,
    required this.id,
    required this.chapterName,
    required this.className,
    required this.classID,
    required this.summary,
    required this.userID,
    required this.quiz,
  });

  factory ChapterData.fromJson(Map<String, dynamic> json) {
    return ChapterData(
      isCompleted: json['isCompleted'] ?? false,
      quizScore: (json['quizScore'] ?? 0).toDouble(),
      completedAt: json['completedAt'] != null ? DateTime.parse(json['completedAt']) : null,
      attempts: json['attempts'] ?? 0,
      id: json['_id'] ?? '',
      chapterName: json['chapterName'] ?? '',
      className: json['className'] ?? '',
      classID: json['classID'] ?? '',
      summary: json['summary'] ?? '',
      userID: json['userID'] ?? '',
      quiz: json['quiz'] != null ? List<String>.from(json['quiz']) : [],
    );
  }
}

class ClassData {
  final String id;
  final String name;
  final String number;
  final List<ChapterData> chapters;

  ClassData({
    required this.id,
    required this.name,
    required this.number,
    required this.chapters,
  });

  factory ClassData.fromJson(Map<String, dynamic> json) {
    List<ChapterData> chaptersList = [];
    if (json['chapters'] != null) {
      chaptersList = List<ChapterData>.from(
        (json['chapters'] as List).map((chapter) => ChapterData.fromJson(chapter)),
      );
    }

    return ClassData(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      number: json['number'] ?? '',
      chapters: chaptersList,
    );
  }
}

class CourseDetailScreen extends StatefulWidget {
  final String courseId;
  final String courseName;
  final String courseNumber;

  const CourseDetailScreen({
    super.key,
    required this.courseId,
    required this.courseName,
    required this.courseNumber,
  });

  @override
  State<CourseDetailScreen> createState() => _CourseDetailScreenState();
}

class _CourseDetailScreenState extends State<CourseDetailScreen> {
  bool isLoading = true;
  String? errorMessage;
  ClassData? courseData;
  Set<int> expandedChapters = {}; // Track which chapters are expanded

  @override
  void initState() {
    super.initState();
    fetchCourseDetails();
  }

  // Fetch course details and chapters from API
  Future<void> fetchCourseDetails() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      // Get token from shared preferences
      final prefs = await SharedPreferences.getInstance();
      final jwtToken = prefs.getString('token');

      if (jwtToken == null) {
        setState(() {
          isLoading = false;
          errorMessage = 'Not logged in. Please log in to view course details.';
        });
        return;
      }

      // Make API request to get course with chapters
      final response = await http.get(
        Uri.parse('$apiBaseUrl/classes/classWithChapters?classID=${widget.courseId}&jwtToken=$jwtToken'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $jwtToken',
        },
      );

      final responseData = json.decode(response.body);

      if (response.statusCode == 200) {
        // Save updated token if provided
        if (responseData['token'] != null) {
          await prefs.setString('token', responseData['token']);
        }

        setState(() {
          // Parse the course data using our model

          debugPrint(responseData.toString());

          if (responseData['class'] != null) {
            courseData = ClassData.fromJson(responseData['class']);
          }


          isLoading = false;

          // Expand the first chapter by default
          if (courseData != null && courseData!.chapters.isNotEmpty) {
            expandedChapters.add(0);
          }
        });
      } else {
        setState(() {
          isLoading = false;
          errorMessage = 'Failed to load course details: ${responseData['message'] ?? 'Unknown error'}';
        });
      }
    } catch (error) {
      setState(() {
        isLoading = false;
        errorMessage = 'Network error: $error';
      });
    }
  }

  // Toggle chapter expansion state
  void toggleChapterExpansion(int index) {
    setState(() {
      if (expandedChapters.contains(index)) {
        expandedChapters.remove(index);
      } else {
        expandedChapters.add(index);
      }
    });
  }

  // Navigate to quiz for a specific chapter
  void navigateToQuiz(ChapterData chapter) {
    // Get the course ID from the widget
    //String courseId = widget.courseId;

    // Navigate to the quiz page
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => QuizPage(
          courseId: widget.courseId,
          classId: chapter.classID,
          chapterId: chapter.id,
          chapterName: chapter.chapterName,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        color: const Color(0xFF1A331A), // Dark green background
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Course header with beige background
                Container(
                  padding: const EdgeInsets.all(16.0),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8D5B5), // Beige color for header
                    borderRadius: BorderRadius.circular(8.0),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.courseName,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2D5A3D), // Dark green text
                        ),
                      ),
                      Text(
                        'Course Number: ${widget.courseNumber}',
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.grey[700],
                        ),
                      ),
                      const SizedBox(height: 12),
                      // Back button
                      OutlinedButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                        },
                        icon: const Icon(Icons.arrow_back),
                        label: const Text('Back to Dashboard'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF2D5A3D),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Loading, error, or content
                Expanded(
                  child: isLoading
                      ? const Center(child: CircularProgressIndicator())
                      : errorMessage != null
                      ? Center(
                    child: Text(
                      errorMessage!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white),
                    ),
                  )
                      : courseData == null || courseData!.chapters.isEmpty
                      ? const Center(
                    child: Text(
                      'No chapters available for this course.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.white,
                      ),
                    ),
                  )
                      : ListView.builder(
                    itemCount: courseData!.chapters.length,
                    itemBuilder: (context, index) {
                      final chapter = courseData!.chapters[index];
                      final isExpanded = expandedChapters.contains(index);

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12.0),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF7E2C1), // Light beige for chapter cards
                          borderRadius: BorderRadius.circular(8.0),
                          border: chapter.isCompleted
                              ? Border.all(color: Colors.green, width: 2)
                              : null,
                        ),
                        child: Column(
                          children: [
                            // Chapter header with expand/collapse
                            ListTile(
                              title: Row(
                                children: [
                                  Expanded( // Expands to fit the text instead of truncating
                                    child: Text(
                                      chapter.chapterName,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF2D5A3D),
                                      ),
                                      softWrap: true, // Allows text to wrap instead of truncating
                                    ),
                                  ),
                                  IconButton(
                                    icon: Icon(
                                      isExpanded ? Icons.remove : Icons.add,
                                      color: const Color(0xFF2D5A3D),
                                    ),
                                    onPressed: () => toggleChapterExpansion(index),
                                  ),
                                ],
                              ),
                              subtitle: chapter.attempts > 0
                                  ? Text(
                                'Score: ${(chapter.quizScore * 10).toInt()}% • ${chapter.attempts} attempt${chapter.attempts > 1 ? 's' : ''}',
                                style: TextStyle(
                                  color: chapter.quizScore >= 0.7 ? Colors.green[700] : Colors.orange,
                                ),
                              )
                                  : null,
                              onTap: () => toggleChapterExpansion(index),
                            ),



                            // Expanded chapter content
                            if (isExpanded)
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Summary',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    // Summary with left border styling
                                    Container(
                                      padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 12.0),
                                      decoration: BoxDecoration(
                                        border: Border(
                                          left: BorderSide(
                                            color: Colors.grey[600]!,
                                            width: 3.0,
                                          ),
                                        ),
                                      ),
                                      child: Text(
                                        chapter.summary,
                                        style: TextStyle(
                                          color: Colors.grey[800],
                                        ),
                                      ),
                                    ),
                                    if (chapter.completedAt != null)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 12.0),
                                        child: Text(
                                          'Completed: ${DateFormat('MMM d, yyyy').format(chapter.completedAt!)}',
                                          style: TextStyle(
                                            color: Colors.grey[600],
                                            fontStyle: FontStyle.italic,
                                          ),
                                        ),
                                      ),
                                    const SizedBox(height: 16),
                                    // Quiz button
                                    Center(
                                      child: ElevatedButton(
                                        onPressed: () => navigateToQuiz(chapter),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(0xFFB94E2F), // Orange-red button
                                          foregroundColor: Colors.white,
                                          minimumSize: const Size(200, 48),
                                        ),
                                        child: Text(
                                            chapter.attempts > 0 ? 'Retake Quiz' : 'Take Quiz'
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                  ],
                                ),
                              ),
                          ],
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
}