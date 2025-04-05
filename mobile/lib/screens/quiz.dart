import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'dart:async';

class QuizPage extends StatefulWidget {
  final String courseId;
  final String classId;
  final String chapterId;
  final String chapterName;

  const QuizPage({
    Key? key,
    required this.courseId,
    required this.classId,
    required this.chapterId,
    required this.chapterName,
  }) : super(key: key);

  @override
  _QuizPageState createState() => _QuizPageState();
}

class _QuizPageState extends State<QuizPage> {
  bool isLoading = true;
  bool isSubmitting = false;
  String? errorMessage;
  List<QuestionData> questions = [];
  Map<String, String> answers = {};
  QuizResult? quizResult;

  // API base URL
  final String apiBaseUrl = 'https://api.scuba2havefun.xyz/api';

  @override
  void initState() {
    super.initState();
    fetchQuizQuestions();
  }

  // Fetch quiz questions from API
  Future<void> fetchQuizQuestions() async {
    try {
      setState(() {
        isLoading = true;
        errorMessage = null;
      });

      // Get token from shared preferences (using the same key as in the class file)
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      if (token == null) {
        setState(() {
          errorMessage = 'Authentication token not found. Please login again.';
          isLoading = false;
        });
        // Navigate to login page
        return;
      }

      print("Chapter ID being sent: ${widget.chapterId}");
      print("JWT Token being sent: $token");

      print('Sending quiz generate request...');
      print('chapterId: ${widget.chapterId}');
      print('classId: ${widget.classId}');
      print('JWT Token: $token');


      // Make API request with proper authorization header
      final response = await http.post(
        Uri.parse('$apiBaseUrl/quiz/generate'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'chapterID': widget.chapterId,
          'classID': widget.classId,
          'jwtToken': token,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);

        // Update token if provided in response
        if (data['token'] != null) {
          await prefs.setString('token', data['token']);
        }

        // Parse questions
        if (data['questions'] != null && data['questions'].isNotEmpty) {
          setState(() {
            questions = List<QuestionData>.from(
                data['questions'].map((q) => QuestionData.fromJson(q))
            );
          });
        } else {
          setState(() {
            errorMessage = 'No quiz questions found for this chapter';
          });
        }
      } else if (response.statusCode == 401) {
        // Handle unauthorized - token likely expired
        setState(() {
          errorMessage = 'Your session has expired. Please login again.';
        });
        // Navigate to login page
      } else {
        try {
          final data = jsonDecode(response.body);
          setState(() {
            errorMessage = data['error'] ?? 'Failed to load quiz questions';
          });
        } catch (e) {
          setState(() {
            errorMessage = 'Server error: ${response.statusCode}';
          });
        }
      }
    } catch (e) {
      setState(() {
        errorMessage = 'An error occurred: ${e.toString()}';
      });
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  // Submit quiz answers
  Future<void> submitQuiz() async {
    // Validate - check if all questions are answered
    if (answers.length < questions.length) {
      setState(() {
        errorMessage = 'Please answer all questions before submitting';
      });
      return;
    }

    setState(() {
      isSubmitting = true;
      errorMessage = null;
      isLoading = true;
    });

    try {
      // Get the token from shared preferences
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      if (token == null) {
        setState(() {
          errorMessage = 'No authentication token found. Please login again.';
          isLoading = false;
          isSubmitting = false;
        });
        // Navigate to login page
        return;
      }

      // Format answers for submission
      final formattedAnswers = answers.entries.map((entry) => {
        'questionId': entry.key,
        'chosenOption': entry.value
      }).toList();

      // Submit quiz with proper authorization
      final response = await http.post(
        Uri.parse('$apiBaseUrl/quiz/submit'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'chapterID': widget.chapterId,
          'classID': widget.classId, 
          'answers': formattedAnswers,
          'jwtToken': token,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);

        // Update token if provided
        if (data['token'] != null) {
          await prefs.setString('token', data['token']);
        }

        // Set quiz results
        setState(() {
          quizResult = QuizResult.fromJson(data);
        });
      } else if (response.statusCode == 401) {
        setState(() {
          errorMessage = 'Your session has expired. Please login again.';
        });
        // Navigate to login page
      } else {
        try {
          final data = jsonDecode(response.body);
          setState(() {
            errorMessage = data['error'] ?? 'Failed to submit quiz';
          });
        } catch (e) {
          setState(() {
            errorMessage = 'Server error: ${response.statusCode}';
          });
        }
      }
    } catch (e) {
      setState(() {
        errorMessage = 'An error occurred: ${e.toString()}';
      });
    } finally {
      setState(() {
        isSubmitting = false;
        isLoading = false;
      });
    }
  }

  void handleAnswerChange(String questionId, String answer) {
    setState(() {
      answers[questionId] = answer;
    });
  }

  void handleTryAgain() {
    setState(() {
      quizResult = null;
      answers = {};
      isLoading = true;
    });
    fetchQuizQuestions();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        color: const Color(0xFF1A331A), // Dark green background to match course page
        child: SafeArea(
          child: isLoading
              ? _buildLoadingScreen()
              : _buildQuizContent(),
        ),
      ),
    );
  }

  Widget _buildLoadingScreen() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFE8D5B5)),
          ),
          const SizedBox(height: 16),
          Text(
            isSubmitting ? 'Submitting your answers...' : 'Loading quiz questions...',
            style: const TextStyle(color: Colors.white),
          ),
        ],
      ),
    );
  }

  Widget _buildQuizContent() {
    return Column(
      children: [
        // Header
        Container(
          padding: const EdgeInsets.all(16.0),
          decoration: BoxDecoration(
            color: const Color(0xFFE8D5B5), // Beige color for header
            borderRadius: BorderRadius.only(
              bottomLeft: Radius.circular(8.0),
              bottomRight: Radius.circular(8.0),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  OutlinedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    icon: const Icon(Icons.arrow_back),
                    label: const Text('Back to Course'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF2D5A3D),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                widget.chapterName,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2D5A3D), // Dark green text
                ),
              ),
            ],
          ),
        ),

        // Error message if any
        if (errorMessage != null)
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Container(
              padding: const EdgeInsets.all(16.0),
              decoration: BoxDecoration(
                color: Colors.red.shade100,
                borderRadius: BorderRadius.circular(8.0),
                border: Border.all(color: Colors.red),
              ),
              child: Row(
                children: [
                  Icon(Icons.error, color: Colors.red),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      errorMessage!,
                      style: TextStyle(color: Colors.red[800]),
                    ),
                  ),
                ],
              ),
            ),
          ),

        // Quiz content
        Expanded(
          child: quizResult != null
              ? _buildQuizResults()
              : _buildQuizForm(),
        ),
      ],
    );
  }

  Widget _buildQuizForm() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFFF7E2C1), // Light beige background
          borderRadius: BorderRadius.circular(8.0),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Instructions: Select the correct answer for each question',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2D5A3D),
                ),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: ListView.builder(
                  itemCount: questions.length,
                  itemBuilder: (context, index) {
                    final question = questions[index];
                    return _buildQuestionItem(question, index);
                  },
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  OutlinedButton(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    child: const Text('Cancel'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF2D5A3D),
                      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                    ),
                  ),
                  const SizedBox(width: 16),
                  ElevatedButton(
                    onPressed: answers.length == questions.length
                        ? submitQuiz
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFB94E2F), // Orange-red button
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                    ),
                    child: Text(isSubmitting ? 'Submitting...' : 'Submit Quiz'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuestionItem(QuestionData question, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24.0),
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8.0),
        boxShadow: [
          BoxShadow(
            color: Colors.black,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Question ${index + 1}: ${question.question}',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D5A3D),
            ),
          ),
          const SizedBox(height: 12),
          _buildOptionRadio(question.id, question.option1),
          _buildOptionRadio(question.id, question.option2),
          _buildOptionRadio(question.id, question.option3),
          _buildOptionRadio(question.id, question.option4),
        ],
      ),
    );
  }

  Widget _buildOptionRadio(String questionId, String option) {
    return RadioListTile<String>(
      title: Text(option),
      value: option,
      groupValue: answers[questionId],
      onChanged: (value) {
        if (value != null) {
          handleAnswerChange(questionId, value);
        }
      },
      dense: true,
      activeColor: const Color(0xFF2D5A3D),
    );
  }

  Widget _buildQuizResults() {
    final result = quizResult!;
    final isPassed = result.passed;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFFF7E2C1), // Light beige background
          borderRadius: BorderRadius.circular(8.0),
        ),
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Text(
              'Quiz Results',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF2D5A3D),
              ),
            ),
            const SizedBox(height: 24),

            // Score display
            Text(
              'Score: ${result.score}/10',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: isPassed ? Colors.green[700] : Colors.red[700],
              ),
            ),
            Text(
              'You answered ${result.correctCount} out of ${result.totalQuestions} questions correctly.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),

            // Progress bar
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: result.score / 10,
                minHeight: 12,
                backgroundColor: Colors.grey[300],
                valueColor: AlwaysStoppedAnimation<Color>(
                  isPassed ? Colors.green : Colors.red,
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Pass/fail message
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isPassed ? Colors.green[50] : Colors.orange[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isPassed ? Colors.green : Colors.orange,
                ),
              ),
              child: Column(
                children: [
                  Text(
                    isPassed ? 'Congratulations!' : 'Almost there!',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: isPassed ? Colors.green[700] : Colors.orange[700],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    isPassed
                        ? 'You passed the quiz.${result.chapterCompleted ? " This chapter is now marked as completed." : ""}'
                        : 'You need a score of 8 or higher to pass.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: isPassed ? Colors.green[700] : Colors.orange[700],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Action buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2D5A3D),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                  ),
                  child: const Text('Return to Course'),
                ),
                if (!isPassed) ...[
                  const SizedBox(width: 16),
                  OutlinedButton(
                    onPressed: handleTryAgain,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF2D5A3D),
                      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                    ),
                    child: const Text('Try Again'),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 32),

            // Detailed results
            const Text(
              'Detailed Results',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF2D5A3D),
              ),
            ),
            const SizedBox(height: 16),

            // Individual question results
            ...result.results.asMap().entries.map((entry) {
              final index = entry.key;
              final questionResult = entry.value;
              final isCorrect = questionResult.isCorrect;

              return Container(
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isCorrect ? Colors.green : Colors.red,
                    width: 2,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isCorrect ? Colors.green[50] : Colors.red[50],
                        borderRadius: BorderRadius.only(
                          topLeft: Radius.circular(6),
                          topRight: Radius.circular(6),
                        ),
                      ),
                      child: Text(
                        'Question ${index + 1}',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isCorrect ? Colors.green[700] : Colors.red[700],
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(questionResult.question),
                          const SizedBox(height: 16),
                          Text(
                            'Your answer: ${questionResult.yourAnswer}',
                            style: TextStyle(
                              color: isCorrect ? Colors.green[700] : Colors.red[700],
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          if (!isCorrect) ...[
                            const SizedBox(height: 8),
                            Text(
                              'Correct answer: ${questionResult.correctAnswer}',
                              style: TextStyle(
                                color: Colors.green[700],
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ],
        ),
      ),
    );
  }
}

// Data Models
class QuestionData {
  final String id;
  final String question;
  final String option1;
  final String option2;
  final String option3;
  final String option4;

  QuestionData({
    required this.id,
    required this.question,
    required this.option1,
    required this.option2,
    required this.option3,
    required this.option4,
  });

  factory QuestionData.fromJson(Map<String, dynamic> json) {
    return QuestionData(
      id: json['_id'],
      question: json['question'],
      option1: json['option1'],
      option2: json['option2'],
      option3: json['option3'],
      option4: json['option4'],
    );
  }
}

class QuizResult {
  final double score;
  final int correctCount;
  final int totalQuestions;
  final bool passed;
  final bool chapterCompleted;
  final List<QuestionResult> results;

  QuizResult({
    required this.score,
    required this.correctCount,
    required this.totalQuestions,
    required this.passed,
    required this.chapterCompleted,
    required this.results,
  });

  factory QuizResult.fromJson(Map<String, dynamic> json) {
    return QuizResult(
      score: json['score'].toDouble(),
      correctCount: json['correctCount'],
      totalQuestions: json['totalQuestions'],
      passed: json['passed'],
      chapterCompleted: json['chapterCompleted'],
      results: List<QuestionResult>.from(
          json['results'].map((result) => QuestionResult.fromJson(result))
      ),
    );
  }
}

class QuestionResult {
  final String questionId;
  final String question;
  final String yourAnswer;
  final String correctAnswer;
  final bool isCorrect;

  QuestionResult({
    required this.questionId,
    required this.question,
    required this.yourAnswer,
    required this.correctAnswer,
    required this.isCorrect,
  });

  factory QuestionResult.fromJson(Map<String, dynamic> json) {
    return QuestionResult(
      questionId: json['questionId'],
      question: json['question'],
      yourAnswer: json['yourAnswer'],
      correctAnswer: json['correctAnswer'],
      isCorrect: json['isCorrect'],
    );
  }
}